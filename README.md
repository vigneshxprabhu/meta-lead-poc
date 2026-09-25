# Meta Lead Ads PoC

A proof-of-concept demonstrating real-time Meta Lead Ads ingestion into a React Native (Expo) app via webhook and WebSocket.

## Architecture

```
Meta Lead Testing Tool
        │
        ▼
Meta Lead Webhook (POST /webhook)
        │
        ▼
Cloudflare Quick Tunnel (localhost:3000)
        │
        ▼
Node.js + Express Backend (port 3000)
        │
        ├── GET /webhook  → webhook verification
        ├── POST /webhook → fetch lead from Meta Graph API → broadcast via WebSocket
        └── POST /test-lead → manual test broadcast
        │
        ▼
WebSocket Server (port 8080)
        │
        ▼
React Native + Expo App (Android emulator)
        │
        ▼
Live lead display (no refresh needed)
```

## Setup & Run Order

### Prerequisites
- Node.js ≥ 18 (for global `fetch`)
- Android Studio + Pixel emulator (or physical device)
- Meta Developer account with a Page and Lead Access permission
- `cloudflared` CLI (for Quick Tunnel)

### 1. Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your values:
# META_PAGE_ACCESS_TOKEN=<from Meta Graph API Explorer>
# WEBHOOK_VERIFY_TOKEN=<any random string, e.g. unque-test-token>
npm install
npm start
# Runs on http://localhost:3000 (webhook) and ws://localhost:8080 (WebSocket)
```

### 2. Android Emulator
- Start a Pixel emulator from Android Studio
- Note: the emulator reaches the host at `10.0.2.2` (not `localhost`)

### 3. Expo App
```bash
# From repo root
npm install
npx expo start
# Press 'a' to open on Android emulator
```

### 4. Cloudflare Quick Tunnel
```bash
# In a new terminal
cloudflared tunnel --url http://localhost:3000
# Copy the https://<random>.trycloudflare.com URL
```

### 5. Configure Meta Webhook
- Go to Meta App Dashboard → Products → Webhooks → Lead Ads
- Callback URL: `https://<your-tunnel>.trycloudflare.com/webhook`
- Verify Token: same value as `WEBHOOK_VERIFY_TOKEN` in `.env`
- Subscribe to `leadgen` events for your Page

## Testing with Meta Lead Testing Tool

1. In Meta Business Manager → Page → Leads → **Lead Testing Tool**
2. Select your Page and the form
3. Fill in test data (name, email, phone)
4. Click **Create Lead**
5. The lead appears instantly in the open Expo app on the emulator

**Alternative (no Meta):** POST directly to the test endpoint:
```bash
curl -X POST http://localhost:3000/test-lead \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","phone":"+15551234567"}'
```

## Environment Variables

| Variable | Location | Description |
|----------|----------|-------------|
| `META_PAGE_ACCESS_TOKEN` | `backend/.env` | Page access token with `leads_retrieval` permission. Get from Graph API Explorer. |
| `WEBHOOK_VERIFY_TOKEN` | `backend/.env` | Random string for webhook verification. Must match Meta webhook config. |

## Assumptions & Limitations

- **Testing Tool substitution:** Uses Meta Lead Testing Tool instead of a live ad. The webhook payload and Graph API flow are identical to production.
- **Hardcoded ports:** Backend HTTP on 3000, WebSocket on 8080. Not configurable via env (PoC scope).
- **Hardcoded WS URL in app:** `src/app/index.tsx` connects to `ws://172.24.198.235:8080` (host LAN IP). For emulator, change to `ws://10.0.2.2:8080`.
- **No reconnect:** If the WebSocket disconnects, the app must be restarted to reconnect.
- **No deduplication:** Meta webhook retries or repeated test submissions create duplicate cards.
- **No authentication on endpoints:** `/webhook` (POST) and `/test-lead` are open; relies on Cloudflare tunnel URL secrecy.
- **Single lead per webhook:** Only `entry[0].changes[0]` is processed.
- **No persistence:** Leads exist only in app memory; lost on app restart.
- **Android emulator only tested:** iOS/physical device not verified.