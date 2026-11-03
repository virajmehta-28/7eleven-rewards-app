import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { handle } from '../src/server.js';
import { MEMBERS } from '../src/catalog.js';

const MEMBER_ID = '7R-00418892';
let server;
let base;

before(async () => {
  server = createServer(handle);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

// Mirrors RewardsStore.redeem in the iOS app: the reward ID arrives as a string path param.
function redeem(rewardId) {
  return fetch(`${base}/api/rewards/${rewardId}/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Member-Id': MEMBER_ID, 'User-Agent': '7-Eleven-iOS/8.42.0' },
    body: JSON.stringify({ channel: 'ios', storeId: '35187' })
  });
}

test('POST /api/rewards/:id/redeem redeems with a string path param', async () => {
  const member = MEMBERS.get(MEMBER_ID);
  const before = member.points;

  const res = await redeem('1042');
  const body = await res.json();

  assert.equal(res.status, 200, JSON.stringify(body));
  assert.equal(body.rewardId, 1042);
  assert.equal(body.pointsSpent, 400);
  assert.equal(body.remainingPoints, before - 400);
  assert.equal(member.points, before - 400);
});

test('POST /api/rewards/:id/redeem returns 404 for an unknown reward', async () => {
  const member = MEMBERS.get(MEMBER_ID);
  const before = member.points;

  const res = await redeem('9999');
  const body = await res.json();

  assert.equal(res.status, 404);
  assert.equal(body.error, 'REWARD_NOT_FOUND');
  assert.equal(member.points, before);
});
