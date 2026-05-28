# Donate Protocol - Terminal Launch Guide

**Last Updated:** May 17, 2026

---

## Quick Start

### 1. Start the Application
```bash
cd /Users/marcusmattus/donate-protocol-portal
npm run dev
```

Application launches at: **http://localhost:3000**

---

## Navigation Flow

### Home Page (`/`)
**Entry Point** - Introduces the protocol

**Key Components:**
- Hero section with "Dashboard" primary button
- Strategy leaderboard preview
- Charity marketplace preview
- Impact ticker
- Call-to-action

**Navigation Options:**
- ✅ **[Dashboard]** → Main hub (/dashboard)
- [New User] → Authentication (/auth)

---

## Main Dashboard Hub (`/dashboard`)

The **central control center** - all features are accessible from here.

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│ HOME / DASHBOARD / [Charity Name]                       │
│                                          [Navigation]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  TRADING TERMINAL (Header)                              │
│  ├─ Real-time portfolio tracking                       │
│  └─ Agent-powered impact routing                        │
│                                                         │
│  ACCOUNT SELECTOR                                       │
│  ├─ Marcus Alpha (7XYDemo111)                           │
│  ├─ Sarah Quant (7XYDemo222) ← Default                  │
│  └─ CryptoNova (7XYDemo333)                             │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ AGENT IMPACT ROUTER PANEL                          ││
│  ├─ Status: ACTIVE (pulsing green dot)                ││
│  ├─ Current Route: [Selected Charity]                 ││
│  ├─ Routing Efficiency: 97.3%                         ││
│  └─ [Change Charity Destination]                      ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  PORTFOLIO STATS (4-column grid)                        │
│  ├─ Total Volume: $XXXX                                │
│  ├─ Total PnL: $XXXX                                   │
│  ├─ Total Donated: $XXXX                               │
│  └─ Active Strategies: N                               │
│                                                         │
│  IMPACT ROUTING SECTION                                 │
│  ├─ Agent Route Status: ACTIVE                         │
│  ├─ Estimated Monthly Impact: $XXXX                    │
│  └─ Charity Wallet: [Verified]                         │
│                                                         │
│  RECENT TRADES (scrollable list)                        │
│  ├─ BUY SOL/USDT @ $181.20 → +$144 pnl               │
│  ├─ SELL ETH/USDT @ $2,850 → -$22 pnl                │
│  └─ [View All Trades]                                  │
│                                                         │
│  DONATION HISTORY (scrollable list)                     │
│  ├─ $4.32 → Solar Future Foundation (5%)              │
│  ├─ $2.10 → Open Water Relief (3%)                    │
│  └─ [View Impact Dashboard]                            │
│                                                         │
│  QUICK ACTIONS (3 buttons)                              │
│  ├─ [Manual Donation] → /live-donation               │
│  ├─ [Strategy Marketplace] → /marketplace             │
│  └─ [All Charities] → /charities                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Dashboard Navigation Bar (Top Right)

From dashboard, quickly access:
- **[Charities]** → /charities (Browse all charities)
- **[Marketplace]** → /marketplace (Copy strategies)
- **[Donate]** → /live-donation (Manual donation)
- **[Wallet]** → /private-wallet (Auto-donation setup)
- **[Impact]** → /transparency (Full impact dashboard)

---

## Dashboard to All Features

### 1. **Charity Marketplace** (`/marketplace`)

**Purpose:** Discover and browse verified charities

**Flow:**
1. From Dashboard, click **[Marketplace]** or **[Browse All Causes]**
2. Browse charity cards with:
   - Name, category, verified badge
   - Raised amount, followers, impact score
   - Direct donation button
3. Click on charity for details
4. [Donate Now] button triggers → /live-donation with pre-selected charity

**Key Features:**
- Filter by category (Climate, Healthcare, Education, etc.)
- Sort by raised, followers, or impact score
- View trending charities
- Follow/Subscribe to charities

---

### 2. **Live Wallet Donation** (`/live-donation`)

**Purpose:** Make real testnet transactions to verify wallet integration

**Flow:**
1. From Dashboard/Marketplace, click **[Donate]** or **[Donate Now]**
2. User sees:
   - Wallet connection status (Phantom/Solflare)
   - Amount input
   - Selected charity destination
   - Transaction preview
3. Click **[Confirm Transaction]**
4. Wallet signs transaction
5. TX sent to Solana testnet
6. Impact confirmed with TX hash
7. Return to Dashboard

**Testnet Details:**
- Network: Solana Devnet
- Gas: Devnet SOL (free)
- Charities receive mock donations
- Full TX verification on-chain

---

### 3. **Private Wallet Setup** (`/private-wallet`)

**Purpose:** Enable auto-donation from exchange or private wallet

**Flow:**
1. From Dashboard, click **[Wallet]**
2. Import options:
   - Private key (paste)
   - Seed phrase (12/24 words)
   - Exchange API (Binance, Kraken, etc.)
3. Configure:
   - Default charity destination
   - Donation percentage (1-100%)
   - Min/max trade sizes to trigger
   - Auto-execute settings
4. Save configuration
5. Agent monitors trades, auto-donates

---

### 4. **Private Wallet Login** (`/private-wallet-login`)

**Purpose:** Quick login to auto-donation system

**Flow:**
1. Access `/private-wallet-login`
2. Enter:
   - Wallet address or email
   - Password
3. Verify 2FA if enabled
4. Redirect to private wallet dashboard

---

### 5. **Charity Profile Detail** (`/charities/[id]`)

**Purpose:** Deep-dive into a specific charity

**Shows:**
- Full mission statement
- Donation breakdown
- Impact metrics
- Recent donors
- Verified badges
- Social links
- [Follow] [Subscribe] [Donate] buttons

---

### 6. **Transparency & Impact** (`/transparency`)

**Purpose:** View all donations and impact dashboard

**Shows:**
- Total raised across all users
- Donation timeline
- Charity leaderboard
- Impact scores
- User leaderboard (anon)
- Export data (CSV/PDF)
- On-chain verification links

---

### 7. **Charity Onboarding** (`/partner`)

**Purpose:** Charities apply to join the marketplace

**Flow:**
1. Click [Institutional Access] from home
2. Fill application:
   - Organization name
   - Website, email
   - Wallet address (Solana)
   - Mission description
   - Category selection
   - Social links
   - Country, team size
   - Media uploads
3. Submit application
4. Verification process
5. If approved → `/partner/confirmation`
6. Onboarded to marketplace

---

### 8. **Charity Confirmation** (`/partner/confirmation`)

**Purpose:** Charity verification complete screen

**Shows:**
- ✅ Organization verified
- 📊 Analytics dashboard access
- 💰 Donation wallet setup
- 🔔 Notification settings
- [Go to Partner Dashboard]

---

### 9. **Authentication** (`/auth`)

**Purpose:** Initial user login/signup

**Flow:**
1. New user lands here
2. Choose:
   - [Connect Phantom Wallet]
   - [Connect Solflare]
   - [Email/Password signup]
3. Create profile
4. Onboarding questions (interests, trading style)
5. Redirect → `/dashboard`

**Onboarding** (`/auth/onboarding`)
- Select favorite charities
- Configure auto-donation %
- Set risk preferences
- Choose strategies to follow

---

### 10. **Waitlist** (`/waitlist`)

**Purpose:** Early access signup

**Flow:**
1. User clicks [New User] from home
2. Enters email
3. Gets confirmation → `/waitlist/confirmation`
4. Receives early access email

---

## Agent Integration

The **Agent Impact Router** is visible in:

### Dashboard Agent Panel
```
┌─ AGENT ACTIVE (pulsing indicator)
├─ Impact Router
├─ "Automatically routes X% of profits..."
├─ Current Route: [Charity Name]
├─ Routing Efficiency: 97.3%
├─ Agent Mode: PASSIVE/ACTIVE
└─ [Change Charity Destination]
```

### Agent Flow

1. **User connects wallet** → Dashboard shows Agent panel
2. **Select charity destination** → Agent learns preference
3. **TradingView signal received** → Agent queues trade
4. **Trade executed** → Profit calculated
5. **Profit event triggered** → Donation automatically routed
6. **Charity receives funds** → Impact logged on-chain
7. **User sees update** → Dashboard updates in real-time

### Agent with Charities

When user selects a charity:
- **Agent learns preference** over time
- **Automatically routes % of profits** to that charity
- **Can set default destination** in private wallet
- **Can configure by strategy** (different charities per strategy)
- **Can set ranges** (min/max donation amounts)

---

## API Endpoints

All accessible from the dashboard:

```
GET /api/portfolio?wallet=XXX                 # User portfolio
GET /api/charities                            # All charities
GET /api/charities/[id]                       # Charity details
POST /api/charities/donate                    # Create donation
POST /api/charities/follow                    # Follow charity
GET /api/strategies                           # All strategies
GET /api/marketplace                          # Marketplace data
GET /api/transactions                         # TX history
POST /api/transactions                        # Create TX
POST /api/webhooks/tradingview                # TradingView signal
GET /api/demo/data                            # All seed data
```

---

## Demo Data Access

### Get All Demo Data

```bash
curl http://localhost:3000/api/demo/data
```

Returns:
- All charities
- All strategies
- All mock users
- Sample transactions
- Test wallets

### Demo Users

**User 1: Marcus Alpha**
- Wallet: `7XYDemo111`
- PnL: +$5,932
- Donated: $217
- Charity: Solar Future Foundation

**User 2: Sarah Quant**
- Wallet: `7XYDemo222` (DEFAULT in dashboard)
- PnL: +$19,102
- Donated: $1,100
- Charity: Open Water Relief

**User 3: CryptoNova**
- Wallet: `7XYDemo333`
- PnL: +$2,240
- Donated: $77
- Charity: Kids First DAO

### Demo Charities

1. **Solar Future Foundation** (Climate)
   - Wallet: `SoLx234future987abc`
   - Raised: $410,000
   - Followers: 12,045
   - Impact: 98/100

2. **Kids First DAO** (Children)
   - Wallet: `KiDS8alpha123beta`
   - Raised: $180,000
   - Followers: 8,332
   - Impact: 94/100

3. **Open Water Relief** (Humanitarian)
   - Wallet: `OpWatr567demo`
   - Raised: $1.4M
   - Followers: 25,101
   - Impact: 99/100

---

## Testing Workflows

### Workflow 1: Browse & Donate

```
1. Start: npm run dev
2. Open: http://localhost:3000
3. Click: [Dashboard]
4. See: Dashboard with Sarah Quant's portfolio
5. Click: [Marketplace]
6. Browse: Charity cards
7. Click: [Donate Now] on charity
8. Redirect: /live-donation
9. Connect: Phantom wallet (testnet)
10. Confirm: Transaction
11. Return: To dashboard with updated stats
```

### Workflow 2: Agent Auto-Donation

```
1. Dashboard: Open
2. Agent Panel: "Change Charity Destination"
3. Select: Different charity
4. Agent: Now routes to new charity
5. Trades: Simulate trade activity
6. Donation: Auto-routed percentage
7. History: Updated donation list
```

### Workflow 3: Private Wallet Setup

```
1. Dashboard: Click [Wallet]
2. Import: Private key or seed phrase
3. Configure: Charity, donation %, min trade
4. Save: Configuration
5. Future: All trades auto-donate per config
```

### Workflow 4: Charity Onboarding

```
1. Home: Click [Institutional Access]
2. Fill: Application form
3. Submit: Application
4. Verify: Email confirmation
5. Approved: /partner/confirmation
6. Access: Analytics dashboard
```

---

## Keyboard Shortcuts

None configured yet, but planned:
- `CMD/CTRL + /` - Command palette
- `G + D` - Go to Dashboard
- `G + M` - Go to Marketplace
- `G + C` - Go to Charities

---

## Troubleshooting

### Dashboard Not Loading
```bash
# Check API is working
curl http://localhost:3000/api/demo/data

# Check portfolio endpoint
curl http://localhost:3000/api/portfolio?wallet=7XYDemo222
```

### Wallet Connection Issues
- Ensure Phantom/Solflare extension is installed
- Check browser console for errors
- Verify testnet is selected in wallet
- Check `/live-donation` page for detailed error

### Donations Not Appearing
- Verify TX was actually sent (check Solana testnet explorer)
- Wait for TX confirmation (typically 10-30 seconds)
- Refresh dashboard page
- Check `/transparency` for all donations

---

## Environment Variables

Create `.env.local` in root:

```env
# Solana
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_HELIUS_API_KEY=your_key_here

# API
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Telegram (optional)
TELEGRAM_BOT_TOKEN=your_token_here

# OpenClaw (optional)
OPENCLAW_API_KEY=your_key_here
```

---

## Build for Production

```bash
npm run build
npm run start
```

---

## Deployment

See `DEPLOYMENT.md` for full instructions on:
- Docker setup
- Railway deployment
- Vercel deployment
- Environment configuration

---

## Key Files & Directories

```
app/
├── page.tsx                 # Home page
├── dashboard/page.tsx       # Main hub ← START HERE
├── marketplace/page.tsx     # Charity browse
├── charities/page.tsx       # All charities
├── live-donation/page.tsx   # Testnet donations
├── private-wallet/page.tsx  # Auto-donation setup
├── auth/
│   ├── page.tsx             # Login
│   └── onboarding/page.tsx  # Initial setup
├── transparency/page.tsx    # Impact dashboard
├── partner/page.tsx         # Charity onboarding
└── api/                     # All endpoints

components/
├── dashboard/               # Dashboard components
├── marketplace/             # Marketplace components
├── wallet/                  # Wallet components
└── ui/                      # shadcn/ui components

lib/
├── types/                   # TypeScript types
├── store/                   # Zustand stores
├── utils/                   # Utilities
└── solana/                  # Solana integration
```

---

## Next Steps

After launching:

1. **Verify Dashboard** - Check all stats load
2. **Test Marketplace** - Browse charities
3. **Test Donation** - Make testnet TX
4. **Test Agent Panel** - Change charity destination
5. **Check API** - Verify all endpoints work
6. **View Transparency** - Check impact dashboard

---

## Support

**Documentation:**
- APP_STRUCTURE.md - Full app architecture
- DASHBOARD_GUIDE.md - Dashboard deep-dive
- AGENT_WALKTHROUGH.md - Agent integration guide
- LIVE_WALLET.md - Wallet setup guide
- PRIVATE_WALLET.md - Auto-donation setup

**Issues?**
- Check browser console for errors
- Check terminal for API logs
- Verify `.env.local` is configured
- Clear cache: `npm run build && npm run dev`

---

**Version:** 2.4.0  
**Last Updated:** May 17, 2026  
**Status:** Production Ready
