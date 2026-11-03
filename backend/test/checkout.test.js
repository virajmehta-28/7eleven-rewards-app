import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { previewCheckout, confirmCheckout, PREVIEW_TTL_MS } from '../src/checkout.js';
import { RedemptionError } from '../src/redeem.js';
import { MEMBERS } from '../src/catalog.js';
import { handle } from '../src/server.js';

const member = (points = 2000) => ({ id: `t-${Math.random()}`, points, redemptions: [] });
const errCode = (code) => (err) => err instanceof RedemptionError && err.code === code;

test('auto-applies an eligible reward the member can afford', () => {
  const m = member(1000);
  const p = previewCheckout(m, [{ sku: 'SLP-COKE-M', quantity: 1 }, { sku: 'RBL-ENR-12', quantity: 1 }]);
  assert.equal(p.subtotal, 6.28);
  assert.deepEqual(p.appliedRewards.map((a) => [a.rewardId, a.sku, a.pointsSpent, a.savings]), [[1051, 'SLP-COKE-M', 300, 2.29]]);
  assert.equal(p.rewardSavings, 2.29);
  assert.equal(p.totalPointsCost, 300);
  assert.equal(p.total, 3.99);
  assert.equal(p.remainingPoints, 700);
  assert.ok(p.previewToken);
});

test('preview does not mutate the member', () => {
  const m = member(1000);
  previewCheckout(m, [{ sku: 'SLP-COKE-M', quantity: 1 }]);
  assert.equal(m.points, 1000);
  assert.equal(m.redemptions.length, 0);
});

test('insufficient points: qualifying item but no affordable reward', () => {
  const m = member(1200);
  const p = previewCheckout(m, [{ sku: 'PZA-PEP-LG', quantity: 1 }]);
  assert.equal(p.appliedRewards.length, 0);
  assert.equal(p.total, 9.99);
  assert.deepEqual(p.unappliedRewards.map((u) => [u.rewardId, u.pointsNeeded]), [[1072, 300]]);
});

test('no qualifying items: no rewards applied and total equals subtotal', () => {
  const m = member(5000);
  const p = previewCheckout(m, [{ sku: 'OTC-ADV-24', quantity: 2 }, { sku: 'RBL-ENR-12', quantity: 1 }]);
  assert.equal(p.appliedRewards.length, 0);
  assert.equal(p.rewardSavings, 0);
  assert.equal(p.totalPointsCost, 0);
  assert.equal(p.total, p.subtotal);
  assert.equal(p.subtotal, 18.97);
});

test('selects the best multi-reward combination within the points balance', () => {
  // Greedy-by-value (pizza + Big Bite = $13.48) and greedy-by-ratio (Slurpee + Big Bite + donut = $7.17)
  // both lose to pizza + Slurpee + donut = $13.67 for exactly 2000 pts.
  const m = member(2000);
  const p = previewCheckout(m, [
    { sku: 'PZA-PEP-LG', quantity: 1 },
    { sku: 'SLP-COKE-M', quantity: 1 },
    { sku: 'BBT-QTR-LB', quantity: 1 },
    { sku: 'BKY-7S-GLZ', quantity: 1 }
  ]);
  assert.deepEqual(p.appliedRewards.map((a) => a.rewardId).sort(), [1051, 1072, 1093]);
  assert.equal(p.rewardSavings, 13.67);
  assert.equal(p.totalPointsCost, 2000);
  assert.equal(p.total, 3.49);
});

test('applies the same reward to multiple units and prefers fewer points on ties', () => {
  const m = member(700);
  const p = previewCheckout(m, [{ sku: 'SLP-COKE-M', quantity: 3 }]);
  assert.equal(p.appliedRewards.length, 2);
  assert.equal(p.totalPointsCost, 600);
  assert.equal(p.rewardSavings, 4.58);
});

test('rejects unknown SKUs and empty carts', () => {
  const m = member();
  assert.throws(() => previewCheckout(m, []), errCode('EMPTY_CART'));
  assert.throws(() => previewCheckout(m, [{ sku: 'NOPE', quantity: 1 }]), errCode('UNKNOWN_SKU'));
  assert.throws(() => previewCheckout(m, [{ sku: 'SLP-COKE-M', quantity: 0 }]), errCode('INVALID_QUANTITY'));
});

test('confirm applies exactly what preview showed and records redemptions', () => {
  const m = member(2840);
  const cart = [{ sku: 'PZA-PEP-LG', quantity: 1 }, { sku: 'SLP-COKE-M', quantity: 2 }, { sku: 'TAQ-CHK-2', quantity: 1 }];
  const p = previewCheckout(m, cart);
  const c = confirmCheckout(m, { cart, previewToken: p.previewToken });
  assert.equal(c.status, 'CONFIRMED');
  assert.equal(c.total, p.total);
  assert.equal(c.rewardSavings, p.rewardSavings);
  assert.equal(c.totalPointsCost, p.totalPointsCost);
  assert.deepEqual(c.appliedRewards.map((a) => a.rewardId), p.appliedRewards.map((a) => a.rewardId));
  assert.equal(c.remainingPoints, 2840 - p.totalPointsCost);
  assert.equal(m.points, c.remainingPoints);
  assert.equal(m.redemptions.length, p.appliedRewards.length);
  assert.ok(m.redemptions.every((r) => r.orderId === c.orderId));
  const codes = c.appliedRewards.map((a) => a.confirmationCode);
  assert.equal(new Set(codes).size, codes.length);
});

test('confirm is idempotent for a replayed preview token', () => {
  const m = member(1000);
  const cart = [{ sku: 'SLP-COKE-M', quantity: 1 }];
  const p = previewCheckout(m, cart);
  const first = confirmCheckout(m, { cart, previewToken: p.previewToken });
  const second = confirmCheckout(m, { cart, previewToken: p.previewToken });
  assert.equal(second.replayed, true);
  assert.equal(second.orderId, first.orderId);
  assert.equal(m.points, 700);
  assert.equal(m.redemptions.length, 1);
});

test('confirmed token is never applied twice once the replay cache is gone', () => {
  const m = member(1000);
  const cart = [{ sku: 'SLP-COKE-M', quantity: 1 }];
  const p = previewCheckout(m, cart);
  const now = Date.now();
  confirmCheckout(m, { cart, previewToken: p.previewToken }, now);
  assert.throws(() => confirmCheckout(m, { cart, previewToken: p.previewToken }, now + PREVIEW_TTL_MS + 1000), errCode('ORDER_ALREADY_PLACED'));
  assert.equal(m.points, 700);
  assert.equal(m.redemptions.length, 1);
});

test('each applied reward reports the balance after its own redemption', () => {
  const m = member(1000);
  const cart = [{ sku: 'SLP-COKE-M', quantity: 1 }, { sku: 'BKY-7S-GLZ', quantity: 1 }];
  const c = confirmCheckout(m, { cart, previewToken: previewCheckout(m, cart).previewToken });
  assert.deepEqual(c.appliedRewards.map((a) => a.remainingPoints), m.redemptions.map((r) => r.remainingPoints));
  assert.equal(c.appliedRewards.at(-1).remainingPoints, c.remainingPoints);
});

test('confirm rejects a changed cart', () => {
  const m = member(1000);
  const p = previewCheckout(m, [{ sku: 'SLP-COKE-M', quantity: 1 }]);
  assert.throws(() => confirmCheckout(m, { cart: [{ sku: 'SLP-COKE-M', quantity: 2 }], previewToken: p.previewToken }), errCode('CART_CHANGED'));
  assert.equal(m.points, 1000);
});

test('confirm rejects when points were spent elsewhere after preview', () => {
  const m = member(1000);
  const cart = [{ sku: 'BBT-QTR-LB', quantity: 1 }, { sku: 'SLP-COKE-M', quantity: 1 }];
  const p = previewCheckout(m, cart);
  assert.equal(p.totalPointsCost, 800);
  m.points = 500;
  assert.throws(() => confirmCheckout(m, { cart, previewToken: p.previewToken }), (e) => errCode('INSUFFICIENT_POINTS')(e) && e.status === 409);
  assert.equal(m.points, 500);
  assert.equal(m.redemptions.length, 0);
});

test('confirm rejects expired, tampered, foreign and missing tokens', () => {
  const m = member(1000);
  const cart = [{ sku: 'SLP-COKE-M', quantity: 1 }];
  const p = previewCheckout(m, cart);
  assert.throws(() => confirmCheckout(m, { cart, previewToken: p.previewToken }, Date.now() + PREVIEW_TTL_MS + 1000), errCode('PREVIEW_EXPIRED'));
  const [body, sig] = p.previewToken.split('.');
  const forged = JSON.parse(Buffer.from(body, 'base64url').toString());
  forged.sel = [[1072, 'PZA-PEP-LG']];
  assert.throws(() => confirmCheckout(m, { cart, previewToken: `${Buffer.from(JSON.stringify(forged)).toString('base64url')}.${sig}` }), errCode('INVALID_PREVIEW_TOKEN'));
  assert.throws(() => confirmCheckout(member(1000), { cart, previewToken: p.previewToken }), errCode('INVALID_PREVIEW_TOKEN'));
  assert.throws(() => confirmCheckout(m, { cart }), errCode('MISSING_PREVIEW_TOKEN'));
  assert.equal(m.points, 1000);
});

test('HTTP: preview then confirm end-to-end', async (t) => {
  const id = '7R-TEST-0001';
  MEMBERS.set(id, { id, firstName: 'Test', lastName: 'Member', tier: 'Gold', points: 2840, homeStore: '', redemptions: [] });
  const server = createServer(handle).listen(0);
  t.after(() => { server.close(); MEMBERS.delete(id); });
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = async (path, body) => {
    const res = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Member-Id': id }, body: typeof body === 'string' ? body : JSON.stringify(body) });
    return { status: res.status, body: await res.json() };
  };
  const cart = [{ sku: 'PZA-PEP-LG', quantity: 1 }, { sku: 'SLP-COKE-M', quantity: 1 }, { sku: 'CHP-DOR-NCH', quantity: 1 }];

  const preview = await post('/checkout/preview', { cart });
  assert.equal(preview.status, 200);
  assert.equal(MEMBERS.get(id).points, 2840);

  const stale = await post('/checkout/confirm', { cart: cart.slice(1), previewToken: preview.body.previewToken });
  assert.equal(stale.status, 409);
  assert.equal(stale.body.error, 'CART_CHANGED');

  const confirm = await post('/checkout/confirm', { cart, previewToken: preview.body.previewToken });
  assert.equal(confirm.status, 200);
  assert.equal(confirm.body.total, preview.body.total);
  assert.equal(confirm.body.remainingPoints, 2840 - preview.body.totalPointsCost);

  const replay = await post('/checkout/confirm', { cart, previewToken: preview.body.previewToken });
  assert.equal(replay.body.replayed, true);
  assert.equal(MEMBERS.get(id).points, confirm.body.remainingPoints);

  const bad = await post('/checkout/preview', '{not json');
  assert.equal(bad.status, 400);
  assert.equal(bad.body.error, 'INVALID_REQUEST');

  for (const path of ['/checkout/preview', '/checkout/confirm']) {
    const nullBody = await post(path, 'null');
    assert.equal(nullBody.status, 400);
    assert.equal(nullBody.body.error, 'INVALID_REQUEST');
  }

  const huge = await post('/checkout/preview', { cart, pad: 'x'.repeat(70 * 1024) });
  assert.equal(huge.status, 413);
  assert.equal(huge.body.error, 'PAYLOAD_TOO_LARGE');
});
