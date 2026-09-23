# Donate Protocol — Solana Demo

A Solana-native demo of an agentic trading + automated giving protocol:

> Trading activity creates automated impact. Users trade, copy strategies, automate execution, and route value into charities through Solana infrastructure.

```
TradingView Signal → OpenClaw Agent → Risk Engine → Simulated Solana Trade
  → Profit Event → Donation Trigger → Charity Marketplace → Impact Dashboard
```

Plus a second, non-directional path — give without trading at all:

```
Deposit → Jupiter swap (ramped in tranches) → Yield venue → Harvest
  → Yield split → Charity wallet + re-compound → Principal untouched
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
| `/dashboard/signals` | Live signal feed with TradingView chart + signal injector |
| `/dashboard/ramp` | Charity Swap Ramp — yield-bearing stables, yield streamed to charity |
| `/dashboard/strategies` | Copy-trading strategy marketplace |
| `/dashboard/portfolio` | SPL balances + receipts |
| `/dashboard/donations` | Donation impact dashboard |
| `/dashboard/leaderboard` | Top traders, strategies, charities |
| `/dashboard/settings` | Donation routing + Telegram link |
| `/marketplace` | Charity marketplace |
| `/marketplace/[id]` | Charity profile |
| `/onboard` … `/onboard/dashboard` | 7-step charity onboarding |

## Charity Swap Ramp

`/dashboard/ramp` is the give-the-yield tool. It swaps a deposit into a yield
venue, keeps the principal, and streams a chosen share of the **yield only** to
a charity wallet on every harvest.

The stable leg is never flat: idle USDC is lent out (Kamino, marginfi), held as
a yield-bearing stable (PYUSD), or LP'd into a tight stable pair (Orca), so a
dollar-denominated position still throws off a harvestable stream. Liquid
staking venues (JitoSOL, Marinade) are available for anyone who wants the
principal to ride SOL instead.

"Ramping" means the swap in is split into N tranches spaced over time rather
than one market order. That cuts price impact but deploys capital later, so the
console reports both sides of the trade-off and the net.

- `lib/yield-venues.ts` — venue catalog (APY, compounding, risk, depth, fees)
- `lib/charity-ramp.ts` — pure, deterministic projection engine: tranche
  quoting, square-root price impact, day-by-day accrual, harvest-time donation
  skim (donated yield stops compounding), ramp-vs-lump-sum comparison
- `lib/ramp-store.ts` — in-memory position store (swap for Prisma before real custody)

APY and depth figures are demo values. Wire each venue to its own rate API
before mainnet.

### Security regression

```bash
npm run dev            # or next start
npm run test:security  # BASE_URL=http://localhost:3000 by default
```

`ramp-security-test.js` pins the properties that keep the ramp webhook safe:
the token gate (including case, whitespace and traversal variants), bounded
fills so replayed alerts cannot deploy past the schedule, input clamping on
`/api/ramp`, malformed bodies failing closed with 400 rather than 500, and no
secret-shaped keys in responses.

**Known pre-existing gap:** `POST /api/webhooks/tradingview` (the untokenized
route, distinct from `/:token`) has no authentication and will simulate a trade
and a donation for any caller. It predates the ramp work and is untouched by
it; the suite asserts only that it cannot reach the ramp machinery. It needs a
token gate or removal before any deployment that matters.

## API

- `POST /api/webhooks/tradingview/:token` — TradingView webhook ingestion.
  Send `{"action":"ramp"}` instead of a trade payload and each alert deploys the
  next Charity Ramp tranche, so DCA follows your chart rather than a clock.
- `GET /api/ramp` — venue catalog, charities, open positions
- `POST /api/ramp` — `{"action":"quote"}` for a projection, `{"action":"execute"}` to open a position
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
