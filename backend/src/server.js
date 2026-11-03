import { createServer } from 'node:http';
import { REWARDS, MEMBERS } from './catalog.js';
import { redeemReward, RedemptionError } from './redeem.js';
import { newIncidentId, reportToOncall } from './oncall.js';

const PORT = Number(process.env.PORT || 8787);
const DEFAULT_MEMBER = '7R-00418892';

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

export async function handle(req, res) {
  const { pathname } = new URL(req.url, 'http://localhost');
  req.path = pathname;
  const memberId = req.headers['x-member-id'] || DEFAULT_MEMBER;
  const member = MEMBERS.get(memberId);
  try {
    if (req.method === 'GET' && pathname === '/health') return send(res, 200, { ok: true });
    if (!member) return send(res, 404, { error: 'MEMBER_NOT_FOUND' });

    if (req.method === 'GET' && pathname === '/api/member') return send(res, 200, member);
    if (req.method === 'GET' && pathname === '/api/rewards') return send(res, 200, REWARDS);

    const m = pathname.match(/^\/api\/rewards\/([^/]+)\/redeem$/);
    if (req.method === 'POST' && m) {
      await readJson(req);
      const redemption = redeemReward(member, m[1]);
      return send(res, 200, redemption);
    }
    return send(res, 404, { error: 'NOT_FOUND' });
  } catch (err) {
    if (err instanceof RedemptionError) return send(res, err.status, { error: err.code, message: err.message });
    const incidentId = newIncidentId();
    send(res, 500, { error: 'REDEMPTION_FAILED', message: "We couldn't complete your redemption. Please try again.", incidentId });
    await reportToOncall({ incidentId, error: err, req, context: { memberId, memberTier: member?.tier, memberPoints: member?.points } });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createServer(handle).listen(PORT, () => console.log(`7rewards-api listening on :${PORT}`));
}
