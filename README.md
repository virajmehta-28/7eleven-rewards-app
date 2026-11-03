# 7-Eleven iOS + 7REWARDS API

Native SwiftUI 7-Eleven app (Home, Deals, 7REWARDS, 7NOW Order, Account) backed by the `7rewards-api` Node service.

## Run

```bash
# API (Node 20+, no dependencies)
cd backend && npm start            # http://localhost:8787
npm test

# iOS app (Xcode 15+, XcodeGen)
cd ios && xcodegen generate
xcodebuild -project SevenRewards.xcodeproj -scheme SevenRewards \
  -destination 'platform=iOS Simulator,name=iPhone 16 Pro' -derivedDataPath build build
xcrun simctl install booted build/Build/Products/Debug-iphonesimulator/7-Eleven.app
xcrun simctl launch booted com.sei.ios.demo
```

## Alerting

Unhandled API errors return `500 { incidentId }` to the client and are reported to Devin On-Call:

| Env var | Purpose |
| --- | --- |
| `ONCALL_WEBHOOK_URL` | Devin On-Call webhook responder URL |
| `ONCALL_WEBHOOK_SECRET` | Sent as `X-Webhook-Secret` |
| `ONCALL_NOTIFY_SLACK_USER` | Slack user ID to notify |
