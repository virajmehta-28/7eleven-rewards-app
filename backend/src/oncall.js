// Reports unhandled production errors to Devin On-Call (webhook responder).
import { randomBytes } from 'node:crypto';

export function newIncidentId() {
  return `INC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

export async function reportToOncall({ incidentId, error, req, context }) {
  const url = process.env.ONCALL_WEBHOOK_URL;
  const secret = process.env.ONCALL_WEBHOOK_SECRET;
  const payload = {
    title: `[7rewards-api] ${req.method} ${req.path} failed: ${error.name}: ${error.message} (${incidentId})`,
    incident_id: incidentId,
    severity: 'SEV-2',
    service: '7rewards-api',
    environment: process.env.APP_ENV || 'production',
    client: req.headers['user-agent'] || 'unknown',
    endpoint: `${req.method} ${req.path}`,
    error: { name: error.name, message: error.message, stack: error.stack },
    context,
    repository: 'https://github.com/virajmehta-28/7eleven-rewards-app',
    notify_slack_user: process.env.ONCALL_NOTIFY_SLACK_USER || '',
    occurred_at: new Date().toISOString()
  };
  console.error(`[oncall] ${payload.title}\n${error.stack}`);
  if (!url || !secret) {
    console.error('[oncall] ONCALL_WEBHOOK_URL / ONCALL_WEBHOOK_SECRET not set; alert not sent');
    return { sent: false };
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Webhook-Secret': secret },
      body: JSON.stringify(payload)
    });
    console.error(`[oncall] alert ${incidentId} -> HTTP ${res.status}`);
    return { sent: res.ok, status: res.status };
  } catch (e) {
    console.error(`[oncall] failed to send alert ${incidentId}: ${e.message}`);
    return { sent: false };
  }
}
