# Donate Protocol — Solana Demo

A Solana-native demo of an agentic trading + automated giving protocol:

> Trading activity creates automated impact. Users trade, copy strategies, automate execution, and route value into charities through Solana infrastructure.

```
TradingView Signal → OpenClaw Agent → Risk Engine → Simulated Solana Trade
  → Profit Event → Donation Trigger → Charity Marketplace → Impact Dashboard
```

Every flow in this repo is wired end-to-end with realistic dummy data. No real
funds move; all Solana interactions are simulated against devnet semantics.

## Quick start

```bash
pnpm install
pnpm dev
# http://localhost:3000
```

Optional full stack:

```bash
docker compose up
```

See [`docs/DEMO_WALKTHROUGH.md`](docs/DEMO_WALKTHROUGH.md) for the 6-minute demo
script.

## Surface area

| Route | Purpose |
| --- | --- |
| `/` | Hero / homepage |
| `/connect` → `/connect/tradingview` → `/connect/openclaw` | Wallet + signal + agent onboarding |
| `/dashboard` | Operator overview |
| `/dashboard/signals` | Live signal feed + signal injector |
| `/dashboard/strategies` | Copy-trading strategy marketplace |
| `/dashboard/portfolio` | SPL balances + receipts |
| `/dashboard/donations` | Donation impact dashboard |
| `/dashboard/leaderboard` | Top traders, strategies, charities |
| `/dashboard/settings` | Donation routing + Telegram link |
| `/marketplace` | Charity marketplace |
| `/marketplace/[id]` | Charity profile |
| `/onboard` … `/onboard/dashboard` | 7-step charity onboarding |

## API

- `POST /api/webhooks/tradingview/:token` — TradingView webhook ingestion
- `POST /api/openclaw/run` — Full agent pipeline simulation
- `GET /api/charities`, `/api/charities/:id`
- `GET /api/strategies`, `/api/signals`, `/api/donations`

## Solana program

`programs/donate_protocol` — Anchor program with:

- `DonationVault` PDA (vault_id, donation_bps, strategy_id, total_volume)
- `StrategyVault` PDA (strategy_owner, followers, pnl)
- `CharityRegistry` PDA (charity_wallet, category, verified, total_received)
- `record_trade_and_donate` instruction emits `DonationEvent`

Configured for Solana **devnet** in `Anchor.toml`.

## Services

- `services/telegram-bot/` — Telegram bot with `/start /portfolio /pnl /signals /donations /charities /leaderboard`
- `services/mcp-server/` — MCP server exposing Donate Protocol tools to OpenClaw or any MCP-compatible agent

## Stack

Next.js 16 · React 19 · Tailwind v4 · shadcn/ui · Solana devnet (Anchor) ·
Jupiter (mock) · Helius RPC · Telegram Bot API · MCP · Docker.
