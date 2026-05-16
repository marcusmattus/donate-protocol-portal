# Donate Protocol — Solana Demo Walkthrough

Total runtime: ~6 minutes. Everything is simulated; no real funds move.

## 0. Pre-flight

```bash
pnpm install
pnpm dev
# open http://localhost:3000
```

Optional services:

```bash
docker compose up                 # web + postgres + redis + telegram bot + mcp server
BOT_TOKEN=… pnpm tsx services/telegram-bot/index.ts
pnpm tsx services/mcp-server/index.ts
```

## 1. Hero (30s)

Open `/`. The headline reads "Trade Smarter. Give Auto." Point out:

* Trader stats: $1.4B volume, $12.8M impact, 48k agents
* Live agent terminal card in the hero — narrate the SOL → Jupiter → Solar Future flow

## 2. Connect Wallet → TradingView → OpenClaw (60s)

1. Click **Connect_Wallet** in the nav → `/connect`
2. Pick **Phantom** — the demo wallet `7XYDemo111…` connects in ~1s
3. Auto-routes to `/connect/tradingview` — copy the webhook URL
4. Continue to `/connect/openclaw` — authorize the agent (checkboxes pre-checked)
5. Land in `/dashboard`

## 3. Dashboard Overview (45s)

`/dashboard` shows:

* KPI grid: Realized PnL, Auto-donations, Active strategies, Signals in-flight
* Live signal feed (left), Agent Terminal (right)
* My Strategies + Routed Charities

Highlight: every fill on the right pane is a Solana devnet tx that triggers a `DonationEvent`.

## 4. Inject a Live Signal (45s)

Open `/dashboard/signals` → click **Inject Signal**.

Behind the scenes this hits `POST /api/webhooks/tradingview/demo123`:

```bash
curl -X POST http://localhost:3000/api/webhooks/tradingview/demo123 \
  -H 'content-type: application/json' \
  -d '{"symbol":"SOLUSDT","side":"BUY","price":181.20,"size":50,"strategy":"Momentum Alpha"}'
```

You'll get back risk score → simulated trade → donation event with a tx signature.

## 5. OpenClaw Agent Pipeline (45s)

Hit `/api/openclaw/run` directly to show the full pipeline:

```bash
curl -X POST http://localhost:3000/api/openclaw/run \
  -H 'content-type: application/json' \
  -d '{"symbol":"BONKUSDT","side":"BUY","price":0.000022,"size":1000000,"strategyId":"sol-meme","charityId":"kids-first"}'
```

Returns ordered steps: `ingest_signal → risk_check → jupiter_quote → submit_trade → trigger_donation → publish_dashboard → notify_telegram`.

## 6. Strategies & Copy Trading (30s)

Open `/dashboard/strategies`. Three strategies seeded: Momentum Alpha (73% win), Whale Tracker (68%), Solana Meme Rotation (82%, trending). One-click follow.

## 7. Portfolio & Donation Impact (45s)

* `/dashboard/portfolio` — SPL balances, recent trades, donation receipts with tx hashes.
* `/dashboard/donations` — allocation bars by charity, full on-chain donation log.

## 8. Charity Marketplace (45s)

* `/marketplace` — 8 seeded verified charities across all categories
* Filter by Climate, Children, Healthcare, etc.
* Click **Solar Future Foundation** to see the full profile (`/marketplace/solar-future`), with donation history, on-chain wallet, social links, follow/donate/set-default actions

## 9. Charity Onboarding (45s)

* `/onboard` lists the 7-step flow: Apply → Verification → Wallet → Profile → Media → Analytics → Dashboard
* Walk through Apply → Submit → Continue to Verify

## 10. Telegram (30s)

In a separate terminal:

```bash
pnpm tsx services/telegram-bot/index.ts
```

Without `BOT_TOKEN`, it prints simulated `/start` output. With a real token:

```
/start
/portfolio
/pnl
/signals
/donations
/charities
/leaderboard
```

## 11. MCP Server (30s)

OpenClaw (or any MCP-capable agent) can call:

* `list_charities`, `get_charity`
* `list_strategies`, `list_signals`, `list_donations`
* `simulate_signal` — full pipeline as a single tool call

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | pnpm tsx services/mcp-server/index.ts
```

## 12. Anchor Program (10s, optional)

`programs/donate_protocol/src/lib.rs` contains:

* `DonationVault` PDA (vault_id, donation_bps, strategy_id)
* `StrategyVault` PDA
* `CharityRegistry` PDA
* `record_trade_and_donate` instruction emits `DonationEvent`

```bash
anchor build
anchor deploy --provider.cluster devnet
```

## Demo Reset

Restart `pnpm dev` — seed data is in-memory in `lib/demo-data.ts`.
