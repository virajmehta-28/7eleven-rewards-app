// Automatic 7REWARDS savings at checkout: picks the reward combination that saves the
// member the most money without exceeding their points balance.
import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { PRODUCTS, REWARDS } from './catalog.js';
import { RedemptionError, assertCanAfford, applyRedemption, findReward } from './redeem.js';

export const PREVIEW_TTL_MS = 15 * 60 * 1000;
const MAX_QUANTITY = 99;
const TOKEN_SECRET = process.env.CHECKOUT_TOKEN_SECRET || randomBytes(32).toString('hex');
const confirmedOrders = new Map();

const dollars = (cents) => Math.round(cents) / 100;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

export function findProduct(sku) {
  return PRODUCTS.find((p) => p.sku === sku);
}

function rewardsForSku(sku) {
  return REWARDS.filter((r) => r.qualifyingSkus?.includes(sku));
}

export function normalizeCart(cart) {
  if (!Array.isArray(cart) || cart.length === 0) {
    throw new RedemptionError('EMPTY_CART', 'Add at least one item to check out.', 400);
  }
  const quantities = new Map();
  for (const line of cart) {
    const sku = typeof line?.sku === 'string' ? line.sku : '';
    const quantity = line?.quantity ?? 1;
    if (!findProduct(sku)) throw new RedemptionError('UNKNOWN_SKU', `Unknown item: ${sku || '(missing sku)'}`, 400);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new RedemptionError('INVALID_QUANTITY', `Invalid quantity for ${sku}`, 400);
    }
    quantities.set(sku, (quantities.get(sku) || 0) + quantity);
  }
  for (const [sku, quantity] of quantities) {
    if (quantity > MAX_QUANTITY) throw new RedemptionError('INVALID_QUANTITY', `Max ${MAX_QUANTITY} of ${sku} per order`, 400);
  }
  return [...quantities]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([sku, quantity]) => ({ sku, quantity }));
}

const cartHash = (lines) => createHash('sha256').update(JSON.stringify(lines)).digest('base64url');

// Grouped 0/1 knapsack: each qualifying cart unit takes at most one reward. Maximizes savings,
// breaking ties by spending fewer points. Returns [{ sku, reward, savingsCents }].
export function selectRewards(lines, pointsBalance) {
  const units = [];
  for (const { sku, quantity } of lines) {
    const product = findProduct(sku);
    const options = rewardsForSku(sku)
      .map((reward) => ({ reward, savingsCents: product.priceCents }))
      .filter((o) => o.reward.pointsCost <= pointsBalance);
    for (let i = 0; i < quantity && options.length; i++) units.push({ sku, options });
  }
  if (!units.length) return [];

  const step = units.flatMap((u) => u.options.map((o) => o.reward.pointsCost)).reduce(gcd);
  const maxSpend = units.reduce((sum, u) => sum + Math.max(...u.options.map((o) => o.reward.pointsCost)), 0);
  const budget = Math.floor(Math.min(pointsBalance, maxSpend) / step);

  let savings = new Float64Array(budget + 1);
  let points = new Float64Array(budget + 1);
  const choice = units.map(() => new Int16Array(budget + 1).fill(-1));

  units.forEach((unit, i) => {
    const nextSavings = Float64Array.from(savings);
    const nextPoints = Float64Array.from(points);
    unit.options.forEach((o, k) => {
      const w = o.reward.pointsCost / step;
      for (let b = w; b <= budget; b++) {
        const s = savings[b - w] + o.savingsCents;
        const p = points[b - w] + o.reward.pointsCost;
        if (s > nextSavings[b] || (s === nextSavings[b] && p < nextPoints[b])) {
          nextSavings[b] = s;
          nextPoints[b] = p;
          choice[i][b] = k;
        }
      }
    });
    savings = nextSavings;
    points = nextPoints;
  });

  const picked = [];
  for (let i = units.length - 1, b = budget; i >= 0; i--) {
    const k = choice[i][b];
    if (k < 0) continue;
    const o = units[i].options[k];
    picked.push({ sku: units[i].sku, reward: o.reward, savingsCents: o.savingsCents });
    b -= o.reward.pointsCost / step;
  }
  return picked.reverse();
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verify(token) {
  const invalid = () => new RedemptionError('INVALID_PREVIEW_TOKEN', 'Checkout session is invalid. Please review your order again.', 400);
  if (typeof token !== 'string' || !token.includes('.')) throw invalid();
  const [body, sig] = token.split('.');
  const expected = createHmac('sha256', TOKEN_SECRET).update(body).digest();
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) throw invalid();
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString());
  } catch {
    throw invalid();
  }
}

function priceLines(lines) {
  return lines.map(({ sku, quantity }) => {
    const p = findProduct(sku);
    return { sku, name: p.name, quantity, unitPrice: dollars(p.priceCents), lineTotal: dollars(p.priceCents * quantity), lineTotalCents: p.priceCents * quantity };
  });
}

function summarize(lines, picks, pointsBalance) {
  const items = priceLines(lines);
  const subtotalCents = items.reduce((s, i) => s + i.lineTotalCents, 0);
  const savingsCents = picks.reduce((s, p) => s + p.savingsCents, 0);
  const totalPointsCost = picks.reduce((s, p) => s + p.reward.pointsCost, 0);
  const remainingPoints = pointsBalance - totalPointsCost;
  const appliedIds = new Set(picks.map((p) => p.reward.id));
  const unappliedRewards = lines
    .flatMap(({ sku }) => rewardsForSku(sku).map((reward) => ({ sku, reward })))
    .filter(({ reward }) => !appliedIds.has(reward.id))
    .map(({ sku, reward }) => ({
      rewardId: reward.id,
      name: reward.name,
      sku,
      pointsCost: reward.pointsCost,
      pointsNeeded: Math.max(0, reward.pointsCost - remainingPoints)
    }));
  return {
    currency: 'USD',
    items: items.map(({ lineTotalCents, ...i }) => i),
    subtotal: dollars(subtotalCents),
    appliedRewards: picks.map((p) => ({
      rewardId: p.reward.id,
      name: p.reward.name,
      sku: p.sku,
      itemName: findProduct(p.sku).name,
      pointsSpent: p.reward.pointsCost,
      savings: dollars(p.savingsCents)
    })),
    unappliedRewards,
    rewardSavings: dollars(savingsCents),
    totalPointsCost,
    total: dollars(subtotalCents - savingsCents),
    pointsBalance,
    remainingPoints
  };
}

// Replays are only answered from cache while the token could still be confirmed; afterwards
// PREVIEW_EXPIRED / ORDER_ALREADY_PLACED reject them, so older entries can go.
function pruneConfirmedOrders(now) {
  for (const [pid, { exp }] of confirmedOrders) if (now > exp) confirmedOrders.delete(pid);
}

export function previewCheckout(member, cart, now = Date.now()) {
  const lines = normalizeCart(cart);
  const picks = selectRewards(lines, member.points);
  const summary = summarize(lines, picks, member.points);
  const expiresAt = now + PREVIEW_TTL_MS;
  const previewToken = sign({
    v: 1,
    pid: randomUUID(),
    mid: member.id,
    cart: cartHash(lines),
    sel: picks.map((p) => [p.reward.id, p.sku]),
    pts: member.points,
    exp: expiresAt
  });
  return { ...summary, previewToken, expiresAt: new Date(expiresAt).toISOString() };
}

// Applies exactly the rewards the member saw in the preview. Replaying a confirmed token returns
// the original confirmation instead of spending points twice.
export function confirmCheckout(member, { cart, previewToken } = {}, now = Date.now()) {
  if (!previewToken) throw new RedemptionError('MISSING_PREVIEW_TOKEN', 'Review your order before placing it.', 400);
  const token = verify(previewToken);
  if (token.mid !== member.id) throw new RedemptionError('INVALID_PREVIEW_TOKEN', 'Checkout session is invalid. Please review your order again.', 400);

  pruneConfirmedOrders(now);
  const prior = confirmedOrders.get(token.pid);
  if (prior) return { ...prior.confirmation, replayed: true };
  if (member.redemptions.some((r) => r.previewId === token.pid)) {
    throw new RedemptionError('ORDER_ALREADY_PLACED', 'This order was already placed.', 409);
  }

  if (now > token.exp) throw new RedemptionError('PREVIEW_EXPIRED', 'Your checkout session expired. Please review your order again.', 409);
  const lines = normalizeCart(cart);
  if (cartHash(lines) !== token.cart) throw new RedemptionError('CART_CHANGED', 'Your cart changed since you reviewed it. Please review your order again.', 409);

  const picks = token.sel.map(([rewardId, sku]) => {
    const reward = findReward(rewardId);
    if (!reward || !reward.qualifyingSkus?.includes(sku)) {
      throw new RedemptionError('INVALID_REWARD', `Reward ${rewardId} is no longer available for this item.`, 409);
    }
    return { sku, reward, savingsCents: findProduct(sku).priceCents };
  });
  const summary = summarize(lines, picks, member.points);
  assertCanAfford(member, summary.totalPointsCost);

  const orderId = `7N-${randomBytes(4).toString('hex').toUpperCase()}`;
  const pointsBefore = member.points;
  const redemptionsBefore = member.redemptions.length;
  let redemptions;
  try {
    redemptions = picks.map((p) => applyRedemption(member, p.reward, { orderId, sku: p.sku, previewId: token.pid }));
  } catch (err) {
    member.points = pointsBefore;
    member.redemptions.length = redemptionsBefore;
    throw err;
  }

  const { unappliedRewards, pointsBalance, ...rest } = summary;
  const confirmation = {
    orderId,
    status: 'CONFIRMED',
    ...rest,
    appliedRewards: rest.appliedRewards.map((a, i) => ({
      ...a,
      confirmationCode: redemptions[i].confirmationCode,
      expiresAt: redemptions[i].expiresAt,
      remainingPoints: redemptions[i].remainingPoints
    })),
    pointsBalance: pointsBefore,
    remainingPoints: member.points,
    confirmedAt: new Date(now).toISOString()
  };
  confirmedOrders.set(token.pid, { confirmation, exp: token.exp });
  return confirmation;
}
