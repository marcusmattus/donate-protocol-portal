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
| `/login` | Privy sign-in |
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

## Login (Privy)

Sign-in runs through [Privy](https://privy.io). Email or a social account
creates an embedded Solana wallet, so someone can donate without already owning
one; bring-your-own-wallet also works. Donate Protocol never sees a Privy
password.

```
browser → Privy sign-in → Privy access token (ES256 JWT)
  → POST /api/auth/privy → verified against Privy's JWKS
  → httpOnly session cookie (HS256, our key) → currentUserIdAsync()
```

The two halves are kept distinct on purpose. Privy's hooks say whether the
*browser* is signed in; the session cookie says whether the *server* verified
it. They can legitimately disagree — a live Privy session with an expired
cookie — so the UI shows both, and the dot next to your name goes green only
once the server has verified.

| Path | Role |
| --- | --- |
| `lib/privy/config.ts` | browser-safe config; never references the app secret |
| `lib/privy/verify.ts` | verifies the Privy token against Privy's JWKS using `jose` |
| `lib/privy/session.ts` | mints and reads the httpOnly session cookie |
| `app/api/auth/privy/route.ts` | POST exchange · GET session · DELETE logout |
| `app/login/page.tsx` | the login page |
| `hooks/use-privy-auth.ts` | client login synced to the server session |

### Setup

```bash
NEXT_PUBLIC_PRIVY_APP_ID=...   # from the Privy dashboard
SESSION_SECRET=...             # 16+ chars, generate one; no in-repo fallback
```

With either unset, `/login` says which is missing and the exchange returns 503.
It fails closed: an unreachable JWKS is reported as 503 rather than treated as a
passing token, and there is no dev fallback signing key — one that shipped in
the repo would let anyone forge a session.

Verification uses `jose` against Privy's public JWKS rather than
`@privy-io/server-auth`, which adds no dependency and runs under the edge
runtime. `PRIVY_APP_SECRET` is **not** required: it is for Privy's management
API, not for validating a token.

> **If you have a `PRIVY_APP_SECRET` anywhere in your deployment, delete it.**
> This app never reads it, so nothing breaks, and one less copy of a credential
> is one less place it can leak. An app secret was previously committed to this
> repository in eight documentation files; it has been removed from the working
> tree, but **git history still contains it**, so that value must be treated as
> public and rotated in the Privy dashboard. `npm run test:privy` now fails if a
> secret-shaped literal reappears in a tracked file.

### Sign up and sign in

Privy has one authentication call: `login()` creates an account for a new user
and signs in an existing one. So `/signup` and `/login` share a single component
(`components/auth-panel.tsx`) and differ only in copy; which of the two actually
happened is decided **server-side**, by whether `lib/privy/accounts.ts` has seen
the DID before. Privy's own `isNewUser` flag is reported by the browser, which is
why the routing does not read it.

That record is for greeting and routing only, never authorization — it is
in-memory, so a restart makes a returning user look new, and that is tolerable
precisely because nothing is gated on it. Only a verified token exchange writes
to it; reading a session never creates an account.

Both pages are `force-dynamic`. As static pages the "is Privy configured" gate
was evaluated once at build time and frozen into the HTML, so a deployment that
supplied `NEXT_PUBLIC_PRIVY_APP_ID` only at runtime served "Privy is not
configured" permanently. The root layout now passes the app id into
`PrivyWalletProvider` as a prop, and client components gate on that provider's
context rather than on an inlined env var — which also removes a crash where the
provider did not mount but client code still called `usePrivy()`.

```bash
npm run test:privy   # 44 assertions against a running server
```

### Exchange connections

Exchange API credentials are stored sealed, scoped to the signed-in user, and
revocable. `POST /api/exchanges` seals the key, secret and (where the exchange
issues one) passphrase; `GET` returns a masked view; `DELETE ?id=` revokes and
drops the sealed material rather than flagging it.

Sealing lives in `lib/exchanges/crypto.ts` and is **not**
`lib/wallet-encryption.ts`, which falls back to a key committed in this repo and
derives its AES key by `padEnd(32, "0")` — padding is not a KDF. The credential
path instead uses HKDF-SHA256 with a random per-record salt, AES-256-GCM with a
12-byte IV and a retained auth tag, and binds user + record + exchange + field
into both the HKDF `info` and the GCM AAD. A ciphertext therefore cannot be
replayed as another user's record, or as a different field of the same record,
even by someone holding the master key.

```bash
EXCHANGE_ENCRYPTION_KEY=...   # 32+ chars; no fallback, unset means 503
npm run test:exchange-crypto  # 22 assertions, no server needed
npm run test:exchange         # 27 assertions against a running server
```

Three deliberate properties: every verb needs a verified session (`requireUserId`,
not the demo-fallback helper, so a live secret is never filed under a shared demo
identity); an unknown id and someone else's id get the same 404, so revocation
cannot be used to probe for other users' connections; and storing a credential
is not permission to trade — nothing places an order, and execution would still
pass the Risk Engine and the user's own policy.

Connections are in-memory, like the other stores here, so they do not survive a
restart. For credentials that fails safe, and the accessor surface is narrow so
the Map can become a table without the sealing boundary moving.

The suite covers what matters: forged, unsigned, expired, wrong-audience and
HS256-where-ES256-is-required tokens are all rejected and issue no cookie;
session cookies signed with the wrong key (including the repo's old JWT default)
are not accepted; a byte-flip invalidates a valid one; and logging in actually
changes the acting user — `/api/tradingview/connection` is scoped to the
session DID with a cookie and falls back to the demo identity without one.

### What a login does and does not grant

Signing in establishes *identity*. It confers no trading authority: execution
still passes the Risk Engine and the user's own policy, exactly as an
unauthenticated signal would. `currentUserIdAsync()` is the single seam every
TradingView and ramp route reads, so a login takes effect everywhere at once.

The TradingView **alert webhook** is deliberately excluded — TradingView posts
from its own servers with no cookie, so it authenticates by webhook token and
attributes alerts to the demo identity. Mapping token → user is its own change.

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
npm run test:security      # 30 assertions against a running server
npm run test:tradingview   # 42 assertions against a running server
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

### Webhook authentication

All three webhook routes take their tokens from one place,
`lib/pipeline/webhook-tokens.ts`:

| Source | Notes |
| --- | --- |
| `TRADINGVIEW_ALERT_TOKENS` | comma-separated, the documented setting |
| `WEBHOOK_SECRET` | single token, the repo's older setting |
| `demo123` / `demo456` | **non-production only** — what keeps `npm run test:demo` and the curl snippets below working locally |

**In production with neither variable set, every webhook request is rejected
with 503.** The demo tokens are unavailable once `NODE_ENV=production`, so a
deployment cannot inherit a credential that is published in this README.

`POST /api/webhooks/tradingview` has no `:token` path segment, so it accepts the
token as an `x-webhook-token` header, an `Authorization: Bearer` value, or a
`?token=` query parameter (the header is preferred; a query parameter lands in
access logs). Its `GET` history is gated too — that response carries wallet
addresses and donation amounts.

Prefer `/api/webhooks/tradingview/alert/:token` for anything new: it runs the
full verify → deduplicate → normalize → risk → intent pipeline.

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
- `POST /api/auth/privy` — verify a Privy token and mint the session; `GET` reads it, `DELETE` clears it
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
