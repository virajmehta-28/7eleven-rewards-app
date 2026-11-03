import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { handle } from '../src/server.js';
import { MEMBERS } from '../src/catalog.js';

let server;
let base;

before(async () => {
  server = createServer(handle);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

async function redeem(id, memberId = '7R-00418892') {
  const res = await fetch(`${base}/api/rewards/${id}/redeem`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Member-Id': memberId,
      'User-Agent': '7-Eleven/8.42.0 (iPhone; iOS 18.0) CFNetwork'
    },
    body: '{}'
  });
  return { status: res.status, body: await res.json() };
}

test('POST /api/rewards/:id/redeem succeeds with the string id from the URL path', async () => {
  const member = MEMBERS.get('7R-00418892');
  const before = member.points;
  const { status, body } = await redeem(1042);
  assert.equal(status, 200);
  assert.equal(body.rewardId, 1042);
  assert.equal(body.pointsSpent, 400);
  assert.equal(body.remainingPoints, before - 400);
  assert.equal(member.points, before - 400);
});

test('POST /api/rewards/:id/redeem returns 404 for an unknown reward id', async () => {
  const { status, body } = await redeem(9999);
  assert.equal(status, 404);
  assert.equal(body.error, 'REWARD_NOT_FOUND');
});
