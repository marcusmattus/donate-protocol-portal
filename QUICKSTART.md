# Quick Start Guide - Donate Protocol Demo

## Prerequisites

- Node.js 18+ or npm/pnpm
- curl or Postman (for testing)
- Optional: Telegram Bot Token (for bot testing)

## Installation

```bash
# Clone or navigate to repository
cd /Users/marcusmattus/donate-protocol-portal

# Install dependencies
npm install
# or
pnpm install
```

## Running the Demo

### 1. Start the Development Server

```bash
npm run dev
```

Server will start at `http://localhost:3000`

### 2. Access the Application

**Homepage**: http://localhost:3000
- View hero section with trading overview
- See strategy leaderboard
- Browse charity marketplace preview

**Dashboard**: http://localhost:3000/dashboard
- Select demo accounts (Marcus Alpha, Sarah Quant, CryptoNova)
- View portfolio statistics
- See recent trades and donation history

**Charities**: http://localhost:3000/charities
- Browse all verified charities
- Filter by impact category
- View fundraising and follower metrics

## Testing the APIs

### 1. Get All Demo Data

```bash
curl http://localhost:3000/api/demo/data | jq
```

Returns: charities, strategies, users, timestamp

### 2. Get Charities

```bash
# All charities
curl http://localhost:3000/api/charities | jq

# Filter by category
curl "http://localhost:3000/api/charities?category=climate" | jq
```

### 3. Get Strategies

```bash
curl http://localhost:3000/api/strategies | jq

# Get trending only
curl "http://localhost:3000/api/strategies?trending=true" | jq
```

### 4. Get User Portfolio

```bash
curl "http://localhost:3000/api/portfolio?wallet=7XYDemo222" | jq
```

Response includes:
- Total volume and PnL
- Active strategies
- Recent trades
- Donation history

### 5. Send TradingView Signal (Webhook)

```bash
curl -X POST http://localhost:3000/api/webhooks/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "SOLUSDT",
    "side": "BUY",
    "price": "181.20",
    "strategy": "momentum-alpha",
    "timestamp": "2026-05-16T21:47:59Z"
  }' | jq
```

Response includes:
- Trade signal with simulated PnL
- Donation event (if profitable)
- Transaction details

### 6. Check Webhook History

```bash
curl http://localhost:3000/api/webhooks/tradingview | jq
```

Shows:
- Recent signals processed
- Recent donations triggered
- Total counts

## Running Full Test Suite

```bash
npm run test:demo
```

Tests all 9 endpoints:
1. ✅ Get Demo Data
2. ✅ Get Charities
3. ✅ Get Charities by Category
4. ✅ Get Strategies
5. ✅ Get Portfolio
6. ✅ Send TradingView Signal
7. ✅ Get Webhook History
8. ✅ Invalid Signal Rejection
9. ✅ Missing Portfolio Error

## Demo Accounts

| Name | Wallet | PnL | Status |
|------|--------|-----|--------|
| Marcus Alpha | 7XYDemo111 | +$5,932 | ✅ Live |
| Sarah Quant | 7XYDemo222 | +$19,102 | ✅ Live |
| CryptoNova | 7XYDemo333 | +$2,240 | ✅ Live |

## Demo Charities

```
1. Solar Future Foundation
   - Category: Climate
   - Raised: $410K
   - Impact: 98/100

2. Open Water Relief
   - Category: Humanitarian
   - Raised: $1.4M
   - Impact: 99/100

3. Kids First DAO
   - Category: Children
   - Raised: $180K
   - Impact: 94/100

+ 3 more verified charities
```

## Demo Strategies

```
1. Momentum Alpha (trending: no)
   - Win Rate: 73%
   - Followers: 8,321
   - Donation Rate: 2%

2. Meme Rotator (trending: yes ⭐)
   - Win Rate: 82%
   - Followers: 18,932
   - Donation Rate: 3%

3. Whale Tracker (trending: no)
   - Win Rate: 68%
   - Followers: 5,231
   - Donation Rate: 1%

+ 1 more strategy
```

## Flow Demo (Step by Step)

### Complete Trading → Donation Flow

```bash
# Step 1: Check portfolio before
curl "http://localhost:3000/api/portfolio?wallet=7XYDemo222" | jq '.totalPnL'

# Step 2: Send TradingView signal
curl -X POST http://localhost:3000/api/webhooks/tradingview \
  -H "Content-Type: application/json" \
  -d '{"symbol":"SOLUSDT","side":"BUY","price":"181.20","strategy":"momentum-alpha"}' | jq '.signal.pnl, .donation.amount'

# Step 3: Check webhook history
curl http://localhost:3000/api/webhooks/tradingview | jq '.totalSignalsProcessed, .totalDonationsTriggered'

# Step 4: Verify donation
curl http://localhost:3000/api/webhooks/tradingview | jq '.recentDonations[0]'
```

## Telegram Bot (Optional)

### Setup

```bash
export TELEGRAM_BOT_TOKEN="your-bot-token-here"
export WEBHOOK_URL="http://localhost:3000"
npm run bot:telegram
```

### Test Bot Commands

In Telegram chat with your bot:
```
/start            - Start bot
/portfolio        - View portfolio
/pnl              - Check profit/loss
/donations        - Donation history
/charities        - Browse charities
/leaderboard      - Global rankings
/demo             - Send demo notification
```

## Production Build

```bash
npm run build
npm start
```

Build output shows all generated routes:
- ○ Static routes
- ƒ Dynamic API routes

## Troubleshooting

**Port 3000 already in use?**
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

**API not responding?**
```bash
# Check server health
curl http://localhost:3000/health || echo "Server not running"

# Check specific endpoint
curl -v http://localhost:3000/api/demo/data
```

**Build errors?**
```bash
# Clear cache
rm -rf .next
npm run build
```

## Performance Notes

- **Demo Data**: In-memory (resets on restart)
- **Devnet Simulation**: Mock Solana responses (no real transaction cost)
- **Webhook**: Instant processing with realistic random PnL
- **Response Time**: <50ms average

## Next Steps

1. **Add Telegram Mini App**: `yarn add telegram-web-app`
2. **Connect Real Solana**: Update `lib/solana-utils.ts`
3. **Deploy to Vercel**: `vercel deploy`
4. **Build Anchor Programs**: See `solana-programs/` folder (TBD)
5. **Backend Database**: Migrate to PostgreSQL + Redis (TBD)

## Support

For issues or questions:
- Check `DEMO_README.md` for architecture
- Review `lib/types.ts` for data structures
- See `app/api/` for endpoint implementations

---

**Last Updated**: May 2026
**Status**: ✅ Demo Ready
**Version**: 0.1.0
