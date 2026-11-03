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
