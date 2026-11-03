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

export function redeemReward(member, rewardId) {
  const reward = findReward(rewardId);
  const cost = reward.pointsCost;

  if (member.points < cost) {
    throw new RedemptionError('INSUFFICIENT_POINTS', `Not enough points: need ${cost}, have ${member.points}`, 409);
  }

  member.points -= cost;
  const redemption = {
    confirmationCode: `7R${Date.now().toString(36).toUpperCase()}`,
    rewardId: reward.id,
    rewardName: reward.name,
    pointsSpent: cost,
    remainingPoints: member.points,
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
  };
  member.redemptions.push(redemption);
  return redemption;
}
