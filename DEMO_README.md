# Donate Protocol — Solana Demo Build

A hackathon-ready, investor-ready, demo-ready Solana-native trading and donation platform that transforms trading activity into automated impact.

## 🎯 Vision

**Trade smarter. Give automatically.**

A Solana-native protocol that converts trading alpha into continuous charitable impact through automated donation routing, copy trading groups, and verified charity marketplace.

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **State Management**: Zustand
- **Wallet Integration**: Solana Wallet Adapter
- **Design**: Terminal aesthetic with teal/lime cyberpunk theme

### Backend
- **Framework**: Next.js API Routes (demo)
- **Production**: Hono or NestJS + PostgreSQL + Redis
- **Job Queue**: BullMQ

### Solana
- **Network**: Devnet (demo)
- **Smart Contracts**: Anchor programs
- **RPC**: Helius, Solana public RPC
- **Token Integration**: SPL tokens, Jupiter Aggregator mock
- **Wallets**: Phantom, Solflare

### Integrations
- **TradingView**: Webhook-based signal ingestion
- **OpenClaw**: Agentic execution simulation
- **Telegram**: Bot + Mini App
- **MCP Server**: OpenAI integration ready

## 📁 Project Structure

```
donate-protocol-portal/
├── app/
│   ├── api/
│   │   ├── demo/data/             # Demo data endpoint
│   │   ├── portfolio/             # Portfolio queries
│   │   ├── charities/             # Charity marketplace
│   │   ├── strategies/            # Strategy listings
│   │   └── webhooks/
│   │       └── tradingview/       # TradingView signals
│   ├── charities/
│   │   ├── page.tsx               # Charity marketplace
│   │   └── [id]/                  # Charity detail pages
│   ├── dashboard/
│   │   └── page.tsx               # Trading dashboard
│   └── page.tsx                   # Homepage
├── components/
│   ├── ui/                        # shadcn/ui components
│   └── nav-dark.tsx               # Navigation
├── lib/
│   ├── types.ts                   # TypeScript types
│   ├── seed-data.ts               # Demo data
│   └── solana-utils.ts            # Solana utilities
├── hooks/
├── styles/
└── public/

telegram-bot/                       # Telegram bot (separate)
solana-programs/                    # Anchor programs (separate)
```

## 🚀 Demo Flow

1. **User connects wallet** (Phantom/Solflare)
2. **Selects trading strategy** from marketplace
3. **TradingView sends signal** to webhook
4. **OpenClaw agent simulates execution**
5. **Trade generates PnL**
6. **Automatic donation triggered** to chosen charity
7. **Telegram notification sent**
8. **Dashboard updates in real-time**

## 📊 Demo Data

### Sample Charities

| Name | Category | Wallet | Raised | Impact |
|------|----------|--------|--------|--------|
| Solar Future Foundation | Climate | SoLx234future987abc | $410K | 98/100 |
| Kids First DAO | Children | KiDS8alpha123beta | $180K | 94/100 |
| Open Water Relief | Humanitarian | OpWatr567demo | $1.4M | 99/100 |

### Sample Strategies

| Strategy | Author | Win Rate | Followers | Donation % |
|----------|--------|----------|-----------|-----------|
| Momentum Alpha | Marcus Solana | 73% | 8,321 | 2% |
| Meme Rotator | CryptoNova | 82% | 18,932 | 3% |
| Whale Tracker | Sarah Quant | 68% | 5,231 | 1% |

### Demo Wallets

| User | Wallet | PnL | Donated |
|------|--------|-----|---------|
| Marcus Alpha | 7XYDemo111 | +$5,932 | $217 |
| Sarah Quant | 7XYDemo222 | +$19,102 | $1,100 |
| CryptoNova | 7XYDemo333 | +$2,240 | $77 |

## 🔌 API Endpoints

### Demo Data
```
GET /api/demo/data
Returns all demo data (charities, strategies, users)
```

### Portfolio
```
GET /api/portfolio?wallet=7XYDemo222
Returns user portfolio, trades, donations
```

### Charities
```
GET /api/charities?category=climate
Returns charities, optionally filtered by category
```

### Strategies
```
GET /api/strategies?trending=true
Returns trading strategies
```

### TradingView Webhook
```
POST /api/webhooks/tradingview
Payload: { symbol, side, price, strategy, timestamp }
Returns: { signal, donation, success }
```

## 🎮 UI Pages

- **`/`** — Homepage hero with overview
- **`/dashboard`** — Trading dashboard with real-time updates
- **`/charities`** — Charity marketplace with filtering
- **`/charities/[id]`** — Charity detail view
- **`/strategies`** — Strategy leaderboard (TBD)
- **`/portfolio`** — User portfolio (TBD)
- **`/leaderboard`** — Global leaderboard (TBD)

## 🧪 Testing the Demo

### 1. View Dashboard
```bash
npm run dev
# Visit http://localhost:3000/dashboard
# Select a demo account
```

### 2. Send TradingView Signal
```bash
curl -X POST http://localhost:3000/api/webhooks/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "SOLUSDT",
    "side": "BUY",
    "price": "181.20",
    "strategy": "momentum-alpha"
  }'
```

### 3. View Charities
```bash
npm run dev
# Visit http://localhost:3000/charities
```

## 📱 Telegram Bot Commands (Coming Soon)

```
/start              — Start bot
/portfolio          — View your trading portfolio
/pnl                — Check profit/loss
/signals            — Recent trade signals
/donations          — Your donation history
/charities          — Browse verified charities
/leaderboard        — Global leaderboard
/settings           — Configure preferences
```

## 🔐 Security Features

- ✅ Read-only wallet integration (no private keys)
- ✅ Devnet-only demo (no real capital)
- ✅ Verified charity contracts
- ✅ Transaction history immutable on Solana
- ✅ Webhook signature validation (TBD)

## 🔄 Solana Integration Details

### Devnet Configuration
```typescript
// RPC Endpoints
- https://api.devnet.solana.com
- https://devnet.helius-rpc.com/?api-key=demo

// Token Contracts
- USDC: EPjFWaLb3hgiFEUuc4sKzz6LAoqfaLdvpZm7jTcHnwvf
- USDT: Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BcJVPg
- SOL: So11111111111111111111111111111111111111112

// Jupiter Aggregator (mocked for demo)
```

### Anchor Programs (Scaffold Ready)

**DonationVault**
```rust
pub vaultId: String,
pub totalVolume: u64,
pub donationPercentage: u8,
pub strategyId: String,
```

**StrategyVault**
```rust
pub strategyOwner: Pubkey,
pub followers: u32,
pub pnl: i64,
```

**CharityRegistry**
```rust
pub charityWallet: Pubkey,
pub category: String,
pub verified: bool,
```

## 🛠️ Development

### Install Dependencies
```bash
npm install
# or
pnpm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Lint Code
```bash
npm run lint
```

## 📦 Deployment

### Vercel (Recommended for Next.js)
```bash
vercel deploy
```

### Docker
```bash
docker build -t donate-protocol .
docker run -p 3000:3000 donate-protocol
```

## 🎯 Future Enhancements

- [ ] Full Solana devnet integration
- [ ] Anchor smart contracts
- [ ] PostgreSQL + Redis backend
- [ ] Telegram mini app
- [ ] Real Jupiter routes
- [ ] OpenClaw agent system
- [ ] MCP server implementation
- [ ] Copy trading groups
- [ ] Risk engine
- [ ] On-chain donation contracts
- [ ] Multi-wallet support
- [ ] Advanced analytics

## 📝 License

MIT

## 👥 Contributors

Built by the Donate Protocol team for hackathons and investor demos.

## 🔗 Links

- Website: https://donate-protocol.demo
- Demo: https://portal.donate-protocol.demo
- Telegram: @donate_protocol_bot
- Twitter: @donateprotocol

---

**Status**: v0.1.0 (Demo Ready) ✅
Last Updated: May 2026
