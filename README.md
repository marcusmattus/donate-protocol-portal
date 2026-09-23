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
| `/dashboard/tradingview` | TradingView Intelligence — connection, explorer, screener, calendars, alerts |
| `/dashboard/ramp` | Charity Swap Ramp — yield-bearing stables, yield streamed to charity |
| `/dashboard/strategies` | Copy-trading strategy marketplace |
| `/dashboard/portfolio` | SPL balances + receipts |
| `/dashboard/donations` | Donation impact dashboard |
| `/dashboard/leaderboard` | Top traders, strategies, charities |
| `/dashboard/settings` | Donation routing + Telegram link |
| `/marketplace` | Charity marketplace |
| `/marketplace/[id]` | Charity profile |
| `/onboard` … `/onboard/dashboard` | 7-step charity onboarding |

## TradingView official MCP integration

TradingView is wired in as the **market intelligence** layer, through the
official MCP server and its OAuth 2.1 flow. Donate Protocol never asks for a
TradingView password and there is no scraping layer.

The separation the whole design turns on:

| Layer | Owns |
| --- | --- |
| TradingView MCP | market data, screening, technical, news, fundamentals, calendars, watchlists, alerts |
| Donate Protocol | strategy orchestration, **risk**, copy trading, donations, audit |
| CCXT / exchanges | execution venue |

TradingView produces intelligence. Donate Protocol's Risk Engine — which has no
TradingView dependency — decides whether a signal is eligible and at what size.
A TradingView recommendation is one input to that decision and can only ever
*reduce* confidence; it never authorizes a trade on its own.

```
TradingView MCP → Market Intelligence → Strategy → Signal Normalizer
  → Risk Engine → Execution Intent → Paper / Approved Live
  → Exchange Connector → Reconciliation → Donation → Audit → Telegram
```

### Modules

| Path | Role |
| --- | --- |
| `lib/tradingview/catalog.ts` | **the only file naming remote MCP tools** — capability → tool name, cache TTL, priority, verification state |
| `lib/tradingview/oauth.ts` | OAuth 2.1 + PKCE, RFC 8414/9728 discovery, refresh, revocation |
| `lib/tradingview/mcp-client.ts` | Streamable HTTP transport (JSON-RPC + SSE), session, 401/429 semantics |
| `lib/tradingview/connector.ts` | cache → rate limit → single-flight → invoke → retry → audit → degrade |
| `lib/tradingview/rate-limit.ts` | per-user token bucket (~100/min) with a priority queue |
| `lib/tradingview/cache.ts` | TTL cache, single-flight, stale-while-broken |
| `lib/tradingview/symbols.ts` | `EXCHANGE:TICKER` normalization and interval coercion |
| `lib/pipeline/audit.ts` | append-only hash-chained ledger, correlation IDs, credential redaction |
| `lib/pipeline/signal.ts` | Signal Normalizer — one shape for every signal source |
| `lib/pipeline/risk-engine.ts` | independent risk decision and sizing |
| `lib/pipeline/execution-intent.ts` | the only object an exchange connector accepts |
| `lib/pipeline/webhook-security.ts` | token, HMAC, timestamp window, replay suppression |
| `lib/agent-tools/market-intelligence.ts` | the permissioned agent tools |

### Setup

1. Set `TRADINGVIEW_OAUTH_CLIENT_ID` and `TRADINGVIEW_OAUTH_REDIRECT_URI`.
2. Visit `/dashboard/tradingview` and connect. You authorize on TradingView.
3. Reconcile the catalog against the live server:

```bash
TRADINGVIEW_ACCESS_TOKEN=... npm run tv:reconcile
```

   This is **required before production**. The catalog's remote tool names are
   a documented expectation until `tools/list` confirms them — every entry
   ships `verified: false`. Fix any mismatch in `catalog.ts` alone, flip the
   entries to `verified: true`, then set
   `TRADINGVIEW_REQUIRE_VERIFIED_TOOLS=true` so the connector refuses anything
   unreconciled.

### Alert webhook

Set `TRADINGVIEW_ALERT_TOKENS` (comma-separated), optionally
`TRADINGVIEW_ALERT_SIGNING_SECRET`, and point a TradingView alert at
`/api/webhooks/tradingview/alert/<token>`:

```
verify (token · optional HMAC · timestamp window) → deduplicate by payload digest
  → normalize → audit → enrich with market context → Risk Engine
  → execution intent (paper or live per policy)
```

An alert never reaches an exchange directly. Rejections are recorded, replays
answer 200 so TradingView stops retrying, and unknowns — a calendar that could
not be fetched — are treated as risk rather than as an all-clear.

```bash
npm run test:tradingview   # 31 assertions against a running server
```

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
- `POST /api/tradingview/oauth/start` — begin OAuth 2.1 + PKCE
- `GET /api/tradingview/oauth/callback` — code exchange, then catalog reconciliation
- `GET|POST /api/tradingview/connection` — status, health, capabilities; refresh or disconnect
- `POST /api/tradingview/intelligence` — read-only market intelligence ops
- `POST /api/webhooks/tradingview/alert/:token` — secure alert ingestion
- `GET /api/audit` — audit ledger; `?correlationId=` traces one signal end to end
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
