import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findReward, redeemReward, RedemptionError } from '../src/redeem.js';

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

test('finds a reward by string id (as parsed from the URL path)', () => {
  assert.equal(findReward('1042')?.id, 1042);
  assert.equal(findReward('9999'), undefined);
});

test('rejects an unknown reward with REWARD_NOT_FOUND instead of crashing', () => {
  const m = member();
  assert.throws(() => redeemReward(m, '9999'), (e) => e instanceof RedemptionError && e.code === 'REWARD_NOT_FOUND' && e.status === 404);
  assert.equal(m.points, 1000);
});
