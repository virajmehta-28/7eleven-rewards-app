import { randomBytes } from 'node:crypto';
import { REWARDS } from './catalog.js';

export class RedemptionError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function findReward(rewardId) {
  return REWARDS.find((r) => r.id === rewardId);
}

export function assertCanAfford(member, cost) {
  if (member.points < cost) {
    throw new RedemptionError('INSUFFICIENT_POINTS', `Not enough points: need ${cost}, have ${member.points}`, 409);
  }
}

function newConfirmationCode() {
  return `7R${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString('hex').toUpperCase()}`;
}

// Deducts points and records the redemption on the member. Callers must check affordability first.
export function applyRedemption(member, reward, extra = {}) {
  member.points -= reward.pointsCost;
  const redemption = {
    confirmationCode: newConfirmationCode(),
    rewardId: reward.id,
    rewardName: reward.name,
    pointsSpent: reward.pointsCost,
    remainingPoints: member.points,
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    ...extra
  };
  member.redemptions.push(redemption);
  return redemption;
}

export function redeemReward(member, rewardId) {
  const reward = findReward(rewardId);
  const cost = reward.pointsCost;
  assertCanAfford(member, cost);
  return applyRedemption(member, reward);
}
