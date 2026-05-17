# 🚀 Launch Terminal with Agent-Linked Charity Builder

## Quick Start Flow

### 1. **Initialize the System**
```bash
npm run dev
# Terminal running at http://localhost:3000
```

### 2. **Homepage → Authentication**
- Click `LAUNCH TERMINAL` button on homepage
- Redirects to `/auth` page
- Select wallet connection (Phantom, Solflare, or Backpack)

### 3. **Wallet Authentication → Dashboard**
- Connect wallet via extension
- Redirected to `/dashboard` with breadcrumb navigation
- **Navigation shows current path:**
  ```
  HOME / DASHBOARD / {Selected Charity Name}
  ```

---

## Dashboard Features

### 🎯 **Main Dashboard Interface**

Located at: `/dashboard`

#### **Top Navigation Bar (Fixed)**
- `HOME` - Link back to homepage
- `DASHBOARD` - Current page
- `{Charity Name}` - Selected impact destination
- `Marketplace` - Browse strategies
- `Live Donate` - Make direct donations

#### **Left Panel - Account Selection**
- Switch between demo accounts (Marcus Alpha, Sarah Quant, CryptoNova)
- Shows portfolio statistics in real-time

#### **Right Panel - Agent Control**
- **STATUS:** AGENT ACTIVE (green pulse indicator)
- **Title:** Impact Router
- **Current Route:** Shows selected charity wallet
- **Button:** "Change Charity Destination"
- **Stats:**
  - Agent Mode: PASSIVE
  - Routing Efficiency: 97.3%

---

## 🤖 Agent-Powered Charity Selection

### How It Works

1. **Select Charity Destination**
   - Click "Change Charity Destination" button
   - Modal appears with 3 verified charities:
     - **Solar Future Foundation** (Climate, Impact: 98/100)
     - **Kids First DAO** (Children, Impact: 94/100)
     - **Open Water Relief** (Humanitarian, Impact: 99/100)

2. **Charity Card Details**
   - Organization name & category
   - Mission description
   - Total raised & followers
   - Impact score
   - Wallet address (verified)

3. **Agent Auto-Routes Profits**
   - Once selected, agent monitors all trades
   - Automatically deducts profit % → charity
   - Logs all routing events
   - Displays monthly impact estimate

### Agent Behavior
- **Mode:** Passive (observes trades)
- **Active:** After selection
- **Routing:** 5% of profits by default (adjustable)
- **Verification:** On-chain verified wallets

---

## 📊 Dashboard Sections

### Portfolio Stats Grid (4 columns)
```
┌─────────────┬──────────────┬─────────────────┬──────────────────┐
│Total Volume │  Total PnL   │ Total Donated   │Active Strategies │
│   $1.2M     │  +$18,342    │   $1,200        │        3         │
└─────────────┴──────────────┴─────────────────┴──────────────────┘
```

### 🎁 Impact Routing Section
When charity selected, displays:
- **Agent Route Status:** ACTIVE
- **Estimated Monthly Impact:** $892 (at 5% allocation)
- **Charity Wallet:** SoLx234future987abc...
- Verification badge

### 📈 Recent Trades
- Live trade history
- Symbol, side, price, PnL
- Sortable by timestamp
- Color-coded: green (profit), red (loss)

### 💚 Donation History
- Automated donations from profit triggers
- Amount, percentage, timestamp
- Linked to selected charity
- Real-time updates

### ⚡ Quick Actions Bar
Three contextual buttons:
1. **Manual Donation** → `/live-donation`
2. **Strategy Marketplace** → `/marketplace`
3. **Browse Charities** → `/charities`

---

## 🔗 Navigation Routes

### From Dashboard:
```
/dashboard
  ├─ /live-donation      (Make direct donations)
  ├─ /marketplace        (Browse & copy strategies)
  ├─ /charities          (View all charities)
  └─ /auth               (Switch accounts)
```

### Breadcrumb Navigation:
```
HOME → DASHBOARD → {Selected Charity}
```

All navigation persists the selected charity context.

---

## 💻 Agent Integration Points

### Data Flow
```
1. User selects charity on dashboard
   ↓
2. Agent initializes impact router
   ↓
3. Portfolio monitored for trade signals
   ↓
4. Profit detected → donation triggered
   ↓
5. Funds routed to selected charity wallet
   ↓
6. Event logged to dashboard
   ↓
7. Monthly impact displayed
```

### Agent Configuration
- **Wallet:** Auto-detected from connection
- **Charity:** User-selectable
- **Percentage:** Default 5%, customizable
- **Mode:** Passive → Active (on selection)

---

## 🎮 Demo Accounts

### Marcus Alpha
- Wallet: `7XYDemo111`
- PnL: +$5,932
- Donations: $217
- Active Strategies: 2

### Sarah Quant
- Wallet: `7XYDemo222`
- PnL: +$19,102
- Donations: $1,100
- Active Strategies: 3

### CryptoNova
- Wallet: `7XYDemo333`
- PnL: +$2,240
- Donations: $77
- Active Strategies: 1

**Try switching accounts to see different portfolios & donation histories!**

---

## 🚀 Launch Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

---

## 🔐 Verified Charities

All charities in the selector are on-chain verified:

### 1. Solar Future Foundation
```
Category:  Climate
Wallet:   SoLx234future987abc
Raised:   $410,000
Impact:   98/100
Link:     https://donate.protocol/solar-future
```

### 2. Kids First DAO
```
Category:  Children
Wallet:   KiDS8alpha123beta
Raised:   $180,000
Impact:   94/100
Link:     https://donate.protocol/kids-first
```

### 3. Open Water Relief
```
Category:  Humanitarian
Wallet:   OpWatr567demo
Raised:   $1.4M
Impact:   99/100
Link:     https://donate.protocol/open-water
```

---

## 📱 Mobile Responsive

Dashboard fully responsive:
- **Desktop:** Full 3-panel layout
- **Tablet:** Stacked panels with sidebar
- **Mobile:** Full-width with collapsible panels

---

## 🔄 Live Updates

- Portfolio data: Real-time from `/api/portfolio`
- Trade history: Auto-refreshed
- Donation events: Streamed via agent
- Impact metrics: Updated on routing

---

## 🛠️ Troubleshooting

### Dashboard not loading?
1. Check wallet connection status
2. Verify API endpoint: `/api/portfolio?wallet={address}`
3. Clear browser cache
4. Try different demo account

### Charity selector not appearing?
1. Click "Change Charity Destination" button
2. Should overlay 3-column charity grid
3. Select any charity to route profits

### Agent not routing donations?
1. Ensure active strategy with positive PnL
2. Check agent is in ACTIVE mode
3. Verify charity wallet is on-chain

---

## 📞 Next Steps

- **Simulate a trade:** Go to TradingView integration
- **Donate manually:** Click "Manual Donation" button
- **Copy a strategy:** Visit Strategy Marketplace
- **Browse all charities:** Full charity list available

---

## 🎯 System Architecture

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ├─→ /auth (Wallet Connect)
       │
       ├─→ /dashboard (Agent Initialized)
       │   ├─ Account Selector
       │   ├─ Agent Control Panel
       │   ├─ Charity Router
       │   ├─ Portfolio Stats
       │   ├─ Trade History
       │   └─ Donation Log
       │
       ├─→ /live-donation (Manual Route)
       │
       ├─→ /marketplace (Strategy Browse)
       │
       └─→ /charities (All Causes)
```

---

## ✨ Features Coming Soon

- [ ] Advanced agent customization
- [ ] Multi-charity portfolio routing
- [ ] AI-powered suggestion engine
- [ ] Real-time Solana integration
- [ ] Mobile app with push notifications
- [ ] Telegram mini-app integration

---

**Status:** ✅ Dashboard LIVE
**Version:** v2.4.0
**Network:** Solana Devnet
**Last Updated:** 2026-05-17
