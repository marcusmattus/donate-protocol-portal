# Donate Protocol - App Architecture

## Directory Structure

```
donate-protocol-portal/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Home/Splash Screen
│   ├── layout.tsx               # Root layout
│   ├── api/                     # Backend API routes
│   │   ├── auth/
│   │   ├── charities/
│   │   ├── strategies/
│   │   ├── marketplace/
│   │   ├── portfolio/
│   │   ├── transactions/
│   │   ├── demo/data/
│   │   └── webhooks/
│   │       └── tradingview/
│   ├── dashboard/               # Main Dashboard (HUB)
│   ├── marketplace/             # Charity Marketplace
│   ├── charities/               # Charity Details & Profiles
│   ├── live-donation/           # Live Testnet Donations
│   ├── private-wallet/          # Private Wallet System
│   ├── private-wallet-login/    # Private Wallet Login
│   ├── auth/                    # Authentication
│   │   └── onboarding/
│   ├── partner/                 # Charity Onboarding Portal
│   │   └── confirmation/
│   ├── transparency/            # Impact Dashboard
│   └── waitlist/                # Waitlist
├── components/                  # Reusable UI Components
│   ├── dashboard/
│   ├── marketplace/
│   ├── charts/
│   ├── wallet/
│   └── ui/                      # shadcn/ui components
├── lib/                         # Utilities & Helpers
│   ├── solana/                 # Solana integration
│   ├── api/                    # API client helpers
│   ├── store/                  # Zustand stores
│   ├── types/                  # TypeScript types
│   └── utils/                  # General utilities
├── hooks/                       # Custom React Hooks
├── styles/                      # Global styles
├── public/                      # Static assets
└── telegram-bot.js              # Telegram Bot Integration
```

## Key Routes & Navigation Flow

### Entry Points
- `/` - Home/Splash Screen
- `/auth` - Authentication & Wallet Connect

### Main User Flows

#### 1. **Dashboard Hub** (Primary Navigation)
```
/dashboard
├── Overview Dashboard (Stats, PnL, Donations)
├── Quick Actions (Connect Wallet, View Strategies)
├── Agent Integration Panel
├── Recent Activity Feed
└── Navigation to all major sections
```

#### 2. **Marketplace Discovery**
```
/marketplace
├── Browse Charities (Cards with filters)
├── Strategy Marketplace
├── View Details → /charities/[id]
└── Direct Donation Action
```

#### 3. **Charity Profiles**
```
/charities/[id]
├── Charity Details
├── Donation History
├── Impact Metrics
├── Follow/Subscribe Actions
└── Back to Marketplace
```

#### 4. **Live Wallet & Donations**
```
/live-donation
├── Connect Solana Testnet Wallet
├── Select Charity to Support
├── Real Transaction Simulation
├── TX Confirmation & Impact
└── Back to Dashboard
```

#### 5. **Private Wallet System**
```
/private-wallet-login → /private-wallet
├── Import Private Key
├── Set Trading Rules
├── Link Exchange API Keys
├── Auto-Donation Config
└── Back to Dashboard
```

#### 6. **Charity Onboarding**
```
/partner
├── Apply Form (Organization Details)
├── Wallet Connection
├── Verification Status
├── Analytics Dashboard
└── /partner/confirmation
```

#### 7. **Transparency & Impact**
```
/transparency
├── All Donations Made
├── Charity Impact Tracking
├── Leaderboard
├── Export Data
```

## Central Dashboard (`/dashboard`)

The dashboard is the HUB that connects everything:

```
┌─────────────────────────────────────────────┐
│           DONATE PROTOCOL DASHBOARD         │
├─────────────────────────────────────────────┤
│                                             │
│  ┌────────────────────────────────────────┐ │
│  │ Welcome [User] | [Wallet Status]       │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  QUICK STATS                                │
│  ├─ Portfolio Value: $XXXX                  │
│  ├─ Total PnL: +$XXXX                       │
│  ├─ Donations Given: $XXXX                  │
│  └─ Impact Score: 8,234                     │
│                                             │
│  QUICK ACTIONS                              │
│  ├─ [Connect Wallet] [View Strategies]     │
│  ├─ [Browse Charities] [Make Donation]     │
│  └─ [Link Exchange API] [Settings]         │
│                                             │
│  NAVIGATION CARDS                           │
│  ├─ 🎯 Marketplace → /marketplace          │
│  ├─ 💰 Live Donation → /live-donation      │
│  ├─ 🤝 Charities → /charities              │
│  ├─ 👤 Private Wallet → /private-wallet    │
│  ├─ 📊 Transparency → /transparency        │
│  └─ 🔗 Agent Panel → Agent Integration     │
│                                             │
│  AGENT INTEGRATION PANEL                    │
│  ├─ OpenClaw Status: [Connected/Ready]     │
│  ├─ Last Signal: SOL/USDT BUY @ 181.20     │
│  ├─ Pending Trades: 2                      │
│  ├─ Auto-Donation: [Enabled/Disabled]      │
│  └─ [Configure Agent] [View Signals]       │
│                                             │
│  ACTIVITY FEED                              │
│  ├─ 14:32 - Trade executed +$144           │
│  ├─ 14:28 - Donation sent to Solar Future  │
│  ├─ 14:15 - Strategy followed (Alpha)      │
│  └─ [View All Activity] → /transparency    │
│                                             │
└─────────────────────────────────────────────┘
```

## API Routes (`/app/api`)

### Authentication
- `POST /api/auth` - Login/Register
- `GET /api/auth/me` - Current user

### Charities
- `GET /api/charities` - List all charities
- `GET /api/charities/[id]` - Charity details
- `POST /api/charities/follow` - Follow charity
- `POST /api/charities/donate` - Direct donation

### Strategies
- `GET /api/strategies` - List strategies
- `GET /api/strategies/[id]` - Strategy details
- `POST /api/strategies/copy` - Copy strategy

### Marketplace
- `GET /api/marketplace` - Marketplace data
- `GET /api/marketplace/trending` - Trending charities

### Portfolio
- `GET /api/portfolio` - User portfolio
- `GET /api/portfolio/pnl` - P&L data
- `GET /api/portfolio/transactions` - Transaction history

### Transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/[id]` - Transaction details

### Webhooks
- `POST /api/webhooks/tradingview` - TradingView signals

### Demo Data
- `GET /api/demo/data` - All seed data

## Component Organization

```
components/
├── dashboard/
│   ├── DashboardHeader.tsx
│   ├── StatsCards.tsx
│   ├── AgentPanel.tsx
│   ├── ActivityFeed.tsx
│   └── QuickActions.tsx
├── marketplace/
│   ├── CharityCard.tsx
│   ├── CharityGrid.tsx
│   ├── CharityFilter.tsx
│   └── StrategyCard.tsx
├── charts/
│   ├── PnLChart.tsx
│   ├── DonationChart.tsx
│   └── ImpactChart.tsx
├── wallet/
│   ├── WalletConnect.tsx
│   ├── WalletStatus.tsx
│   └── TransactionConfirm.tsx
└── ui/
    ├── button.tsx
    ├── card.tsx
    ├── modal.tsx
    └── ...
```

## State Management (Zustand)

```
lib/store/
├── authStore.ts           # User auth state
├── walletStore.ts         # Wallet connection state
├── portfolioStore.ts      # Portfolio & PnL data
├── charityStore.ts        # Charities & favorites
├── agentStore.ts          # Agent/signals state
└── notificationStore.ts   # Toast notifications
```

## Types

```
lib/types/
├── index.ts               # Main types
├── charity.ts
├── strategy.ts
├── transaction.ts
├── portfolio.ts
└── agent.ts
```

## Launch Sequence

```
1. User visits / (Home)
2. Splash screen with options
3. User clicks "Connect Wallet" → /auth
4. Wallet connects (Phantom/Solflare)
5. User redirected → /dashboard (HUB)
6. From dashboard, user can:
   - Browse marketplace → /marketplace
   - Make donation → /live-donation
   - View charities → /charities
   - Set up auto-donation → /private-wallet
   - View impact → /transparency
   - Agent configuration → Agent Panel
```

## Environment Variables

```
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_HELIUS_API_KEY=xxx
TELEGRAM_BOT_TOKEN=xxx
OPENCLAW_API_KEY=xxx
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

## Key Features by Route

| Route | Feature | Agent | Wallet | Demo |
|-------|---------|-------|--------|------|
| / | Splash Screen | - | - | ✅ |
| /dashboard | Hub/Stats | ✅ | ✅ | ✅ |
| /marketplace | Charity Browse | - | - | ✅ |
| /charities/[id] | Details | - | - | ✅ |
| /live-donation | Testnet TX | - | ✅ | ✅ |
| /private-wallet | Auto-Donation | ✅ | ✅ | - |
| /partner | Charity Onboard | - | ✅ | - |
| /transparency | Impact Dashboard | - | - | ✅ |
| /auth | Login | - | ✅ | ✅ |

## Getting Started

### Development
```bash
npm run dev
# Visit http://localhost:3000
# Start at Home, navigate via Dashboard
```

### Demo Mode
```bash
npm run test:demo
npm run test:webhook
npm run bot:telegram
```

### Deployment
See DEPLOYMENT.md for full instructions.

---

**Dashboard is the central hub. All routes should have easy navigation back to /dashboard.**
