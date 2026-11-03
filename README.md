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

## Checkout with automatic 7REWARDS savings

The Order tab's cart checks out through two endpoints (header `X-Member-Id`, body `{ "cart": [{ "sku", "quantity" }] }`):

| Endpoint | Behavior |
| --- | --- |
| `POST /checkout/preview` | Read-only. Picks the reward combination that saves the most without exceeding the member's points (each qualifying unit takes at most one reward) and returns subtotal, `appliedRewards`, `rewardSavings`, `totalPointsCost`, `total` and a signed `previewToken` (15 min). |
| `POST /checkout/confirm` | Body adds `previewToken`. Applies exactly the previewed rewards, deducts points and records `member.redemptions`. Returns codes and `remainingPoints`. Replaying a confirmed token returns the same order (`replayed: true`). Errors: `409 CART_CHANGED`, `409 INSUFFICIENT_POINTS`, `409 PREVIEW_EXPIRED`, `409 INVALID_REWARD`, `409 ORDER_ALREADY_PLACED`, `400 INVALID_PREVIEW_TOKEN`, `400 INVALID_REQUEST`, `413 PAYLOAD_TOO_LARGE`. |

Set `CHECKOUT_TOKEN_SECRET` to keep preview tokens valid across restarts.

## Alerting

Unhandled API errors return `500 { incidentId }` to the client and are reported to Devin On-Call:

| Env var | Purpose |
| --- | --- |
| `ONCALL_WEBHOOK_URL` | Devin On-Call webhook responder URL |
| `ONCALL_WEBHOOK_SECRET` | Sent as `X-Webhook-Secret` |
| `ONCALL_NOTIFY_SLACK_USER` | Slack user ID to notify |
