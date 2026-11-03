import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { handle } from '../src/server.js';
import { MEMBERS } from '../src/catalog.js';

const server = createServer(handle);
await new Promise((resolve) => server.listen(0, resolve));
const base = `http://localhost:${server.address().port}`;
after(() => server.close());

const redeem = (id) =>
  fetch(`${base}/api/rewards/${id}/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Member-Id': '7R-00418892', 'User-Agent': '7-Eleven-iOS/8.42.0' },
    body: '{}'
  });

test('POST /api/rewards/:id/redeem redeems via the string path param', async () => {
  const member = MEMBERS.get('7R-00418892');
  const before = member.points;
  const res = await redeem('1042');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.rewardId, 1042);
  assert.equal(body.pointsSpent, 400);
  assert.equal(member.points, before - 400);
});

test('POST /api/rewards/:id/redeem returns 404 for an unknown reward', async () => {
  const res = await redeem('9999');
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.equal(body.error, 'REWARD_NOT_FOUND');
});
