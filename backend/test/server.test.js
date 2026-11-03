import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { handle } from '../src/server.js';
import { MEMBERS } from '../src/catalog.js';

// Exercises the real request path the iOS app uses: the reward id arrives as a
// string path parameter, not a number.
const server = createServer(handle);
await new Promise((resolve) => server.listen(0, resolve));
const base = `http://localhost:${server.address().port}`;
after(() => server.close());

const MEMBER_ID = '7R-00418892';
const headers = { 'Content-Type': 'application/json', 'X-Member-Id': MEMBER_ID, 'User-Agent': '7-Eleven-iOS/8.42.0' };
const body = JSON.stringify({ channel: 'ios', storeId: '35187' });

test('POST /api/rewards/:id/redeem redeems with a string path param', async () => {
  const before = MEMBERS.get(MEMBER_ID).points;
  const res = await fetch(`${base}/api/rewards/1042/redeem`, { method: 'POST', headers, body });
  const json = await res.json();
  assert.equal(res.status, 200, JSON.stringify(json));
  assert.equal(json.rewardId, 1042);
  assert.equal(json.pointsSpent, 400);
  assert.equal(json.remainingPoints, before - 400);
  assert.match(json.confirmationCode, /^7R/);
});

test('POST /api/rewards/:id/redeem returns 404 REWARD_NOT_FOUND for an unknown id', async () => {
  const res = await fetch(`${base}/api/rewards/9999/redeem`, { method: 'POST', headers, body });
  const json = await res.json();
  assert.equal(res.status, 404);
  assert.equal(json.error, 'REWARD_NOT_FOUND');
});

test('POST /api/rewards/:id/redeem returns 409 INSUFFICIENT_POINTS', async () => {
  const m = MEMBERS.get(MEMBER_ID);
  const saved = m.points;
  m.points = 10;
  try {
    const res = await fetch(`${base}/api/rewards/1072/redeem`, { method: 'POST', headers, body });
    const json = await res.json();
    assert.equal(res.status, 409);
    assert.equal(json.error, 'INSUFFICIENT_POINTS');
    assert.equal(m.points, 10);
  } finally {
    m.points = saved;
  }
});
