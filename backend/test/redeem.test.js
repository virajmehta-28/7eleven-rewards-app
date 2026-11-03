import { test } from 'node:test';
import assert from 'node:assert/strict';
import { redeemReward, RedemptionError } from '../src/redeem.js';

const member = () => ({ id: 't', points: 1000, redemptions: [] });

test('redeems a reward and deducts points', () => {
  const m = member();
  const r = redeemReward(m, 1042);
  assert.equal(r.pointsSpent, 400);
  assert.equal(m.points, 600);
  assert.equal(m.redemptions.length, 1);
});

test('rejects redemption with insufficient points', () => {
  const m = member();
  assert.throws(() => redeemReward(m, 1072), RedemptionError);
  assert.equal(m.points, 1000);
});

test('redeems when the reward id arrives as a string (URL path param)', () => {
  const m = member();
  const r = redeemReward(m, '1042');
  assert.equal(r.rewardId, 1042);
  assert.equal(r.pointsSpent, 400);
  assert.equal(m.points, 600);
});

test('rejects an unknown reward id with REWARD_NOT_FOUND', () => {
  const m = member();
  assert.throws(() => redeemReward(m, '9999'), (err) => err instanceof RedemptionError && err.code === 'REWARD_NOT_FOUND' && err.status === 404);
  assert.equal(m.points, 1000);
});
