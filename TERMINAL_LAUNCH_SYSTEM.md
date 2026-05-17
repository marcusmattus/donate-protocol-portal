# Donate Protocol — Terminal Launch System

## Quick Start

```bash
npm run dev
```

Then visit: **http://localhost:3000**

---

## Navigation Map

### Core Flows

**Landing → Wallet → Dashboard → Action**

```
HOME (/)
├── Connect Wallet (Phantom/Solflare)
├── Connect Privy.io
├── Connect TradingView
└── Connect OpenClaw Agent

DASHBOARD (/dashboard)
├── Portfolio Overview
│   ├── Total PnL
│   ├── Trading History
│   └── Donation History
├── Marketplace (/marketplace)
│   ├── Charities Directory
│   ├── Strategy Finder
│   └── Leaderboard
├── Live Donation (/live-donation)
│   ├── Testnet Transactions
│   ├── Real Wallet Integration
│   └── Donation Confirmation
└── Settings
    ├── Wallet Management
    ├── Exchange Connections
    └── Privacy Settings

CHARITIES (/charities)
├── Charity List
│   ├── Solar Future Foundation
│   ├── Kids First DAO
│   ├── Open Water Relief
│   └── Web3 Education Collective
├── Charity Profile (/charities/[id])
│   ├── Mission & Impact
│   ├── Donation History
│   ├── Follower Stats
│   └── Wallet Address
└── Charity Onboarding (/partner)
    ├── Application Form
    ├── Verification
    ├── Wallet Connect
    └── Analytics Dashboard

MARKETPLACE (/marketplace)
├── Charity Cards
│   ├── Filter by Category
│   ├── Sort by Impact
│   └── Search
├── Strategy Cards
│   ├── Momentum Alpha (73% win rate)
│   ├── Whale Tracker (68% win rate)
│   └── Solana Meme Rotation (82% win rate)
└── Actions
    ├── Donate
    ├── Follow
    ├── Subscribe
    └── Add to Portfolio

AGENT INTEGRATION
├── OpenClaw Agent (/api/agent)
│   ├── Strategy Analysis
│   ├── Risk Calculation
│   ├── Execution Simulation
│   └── Donation Trigger
├── TradingView Webhook
│   ├── Signal Reception
│   ├── Queue Processing
│   └── Execution Flow
└── Telegram Bot
    ├── /start - Begin
    ├── /portfolio - View holdings
    ├── /pnl - Profit/Loss
    ├── /signals - Active signals
    ├── /donations - Donation history
    ├── /charities - Available charities
    └── /leaderboard - Top traders

WALLET SYSTEMS (/private-wallet)
├── Privy.io Integration
│   ├── Auto-login
│   ├── Multi-chain Support
│   ├── Account Recovery
│   └── Device Linking
├── Private Wallet Management (/private-wallet)
│   ├── Encrypted Storage
│   ├── Key Backup
│   ├── Device Sync
│   └── Security Settings
├── Exchange Connections (/private-wallet-login)
│   ├── Kraken API Keys
│   ├── Binance API Keys
│   ├── Coinbase OAuth
│   └── TradingView Token
└── Live Wallet Testing (/live-donation)
    ├── Devnet Transactions
    ├── SPL Token Transfers
    ├── Donation Routing
    └── Transaction History

---

## Feature Routes

### Public Routes
- `/` - Home/Landing
- `/marketplace` - Charity & Strategy Marketplace
- `/charities` - Charity Directory
- `/charities/[id]` - Individual Charity Profile
- `/transparency` - Donation Transparency

### Auth Routes
- `/auth/onboarding` - User Onboarding
- `/waitlist` - Beta Waitlist
- `/waitlist/confirmation` - Waitlist Confirmation

### Protected Routes (Wallet Required)
- `/dashboard` - Main Dashboard
- `/live-donation` - Live Testnet Donations
- `/private-wallet` - Encrypted Wallet
- `/private-wallet-login` - Exchange Login
- `/partner` - Charity Onboarding
- `/partner/confirmation` - Partner Confirmation

---

## API Endpoints

### Charity APIs
```
GET  /api/charities              # List all charities
GET  /api/charities?category=    # Filter by category
GET  /api/charities/[id]         # Get single charity
```

### Donation APIs
```
GET  /api/donations              # List donations
POST /api/donations              # Create donation
```

### Demo Data
```
GET  /api/demo/data              # All seed data
```

---

## Testing the System

### 1. Wallet Connection
```
1. Visit http://localhost:3000
2. Click "Connect Wallet"
3. Select Phantom or Solflare
4. Approve connection
5. Redirect to Dashboard
```

### 2. Marketplace Browse
```
1. Navigate to /marketplace
2. View charity cards
3. Filter by category
4. View strategy metrics
```

### 3. Live Donation Test
```
1. Connect wallet to testnet
2. Go to /live-donation
3. View demo transaction
4. Connect to real Solana Devnet
5. Send test SOL
6. Confirm donation
```

### 4. Agent Flow
```
1. Connect TradingView webhook
2. Send test signal to agent
3. Agent analyzes risk
4. Simulates execution
5. Triggers donation
6. Updates dashboard
7. Notifies Telegram bot
```

### 5. Private Wallet
```
1. Go to /private-wallet
2. Set up Privy.io
3. Add exchange API keys
4. Enable auto-trading
5. Set donation destination
```

---

## Donation Flow

```
Trade Signal (TradingView)
    ↓
OpenClaw Agent Analysis
    ↓
Risk Calculation
    ↓
Simulated Execution
    ↓
Profit Generated
    ↓
Donation Trigger
    ↓
Charity Selection
    ↓
Solana Transaction
    ↓
Impact Dashboard Update
    ↓
Telegram Notification
```

---

## Key Features

✅ **Phantom/Solflare Wallet Integration**
- Real devnet wallet connection
- SPL token support
- Transaction signing

✅ **Privy.io Auth**
- Passwordless login
- Multi-chain support
- Device linking

✅ **Live Donation System**
- Testnet transactions
- Real wallet connectivity
- Donation confirmation

✅ **Agent Integration**
- OpenClaw signal processing
- Risk analysis
- Execution simulation
- Donation automation

✅ **Marketplace**
- 10+ charities with real data
- Strategy cards with metrics
- Impact scoring
- Leaderboard

✅ **Private Wallet**
- Encrypted storage
- Exchange API management
- Auto-trading setup

✅ **Terminal UI**
- Professional monospace fonts
- Color-coded status messages
- Command-line aesthetics

✅ **Telegram Bot**
- Portfolio queries
- Signal notifications
- Donation alerts
- Leaderboard updates

---

## Environment Variables

```bash
# Solana
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com

# Privy.io
NEXT_PUBLIC_PRIVY_APP_ID=cmpa0jh2w00130djxvklequ5w
PRIVY_APP_SECRET=x1ErzXRYbNxQbU5TUey6pzu1TqWiWMhTsXJx5Y3CfFwsJV2MmeDbiH9u51uMGeWifixCHET9mad2ps7AjUgp7ww

# TradingView
TRADINGVIEW_WEBHOOK_URL=https://api.demo.com/webhooks/tradingview/demo123

# Agent
OPENCLAW_API_KEY=your_api_key
```

---

## Terminal Command Reference

```bash
# Start development server
npm run dev

# Build production
npm run build

# Start production
npm start

# Run tests
npm test

# Lint code
npm run lint

# Type check
npm run typecheck
```

---

## Troubleshooting

### Wallet Not Connecting
- Check browser extension is installed
- Ensure Solana RPC endpoint is live
- Clear browser cache and reload

### 404 on Charity Routes
- Verify charity ID in URL
- Check seed data loaded correctly
- Confirm API route handler exists

### Terminal Font Issues
- Update to latest JetBrains Mono
- Clear CSS cache
- Hard refresh browser (Cmd+Shift+R)

### Testnet Transactions Failing
- Verify wallet has devnet SOL
- Check RPC endpoint is responsive
- Ensure transaction params are valid

---

## Demo Wallets (Testnet)

```
User 1: Marcus Alpha
Wallet: 7XYDemo111
Balance: ~5 SOL (devnet)
PnL: +$5,932

User 2: Sarah Quant
Wallet: 7XYDemo222
Balance: ~10 SOL (devnet)
PnL: +$19,102

User 3: CryptoNova
Wallet: 7XYDemo333
Balance: ~3 SOL (devnet)
PnL: +$2,240
```

---

## Demo Charities

| Name | Category | Wallet | Raised |
|------|----------|--------|--------|
| Solar Future Foundation | Climate | SoLx234future987abc | $410K |
| Kids First DAO | Children | KiDS8alpha123beta | $180K |
| Open Water Relief | Humanitarian | OpWatr567demo | $1.4M |
| Web3 Education Collective | Education | Web3Edu456abc | $245K |

---

## Ready to Launch?

```bash
npm run dev
# Open http://localhost:3000
# Connect wallet → Explore marketplace → Make donation
```

All systems are go! 🚀
