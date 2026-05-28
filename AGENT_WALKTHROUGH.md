# 🎬 Complete Agent-Linked Charity Builder Walkthrough

## Terminal Launch Sequence

### Step 1: Start the System
```bash
cd /Users/marcusmattus/donate-protocol-portal
npm run dev
```

**Output:**
```
> next dev
  ▲ Next.js 14.x
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 1.2s
```

**Status:** ✅ DEV SERVER RUNNING

---

## Navigation Flow

### Step 2: Homepage (Entry Point)
```
URL: http://localhost:3000/
```

**What You See:**
- Hero section: "Trade Smarter. Give Auto."
- Subtext: "A Solana-native protocol that transforms trading activity into continuous impact."
- Two buttons:
  - `LAUNCH TERMINAL` (primary - teal)
  - `JOIN WAITLIST` (secondary)

**Action:** Click `LAUNCH TERMINAL`

---

### Step 3: Authentication Page
```
URL: http://localhost:3000/auth
```

**Left Panel (Brand)**
- Logo: "Donate.Protocol"
- Status: "Secure Connection Established"
- Welcome message: "Welcome Back, Agent."
- Live stats:
  - Agents Online: 48,201
  - Donations Today: $231,422
  - Block Height: #277,412,102

**Right Panel (Login)**
- Tab selection: LOGIN | REGISTER
- Email/password form
- **OR**
- Wallet options:
  1. **Phantom** (Solana-native, Mobile + Extension)
  2. **Solflare** (Ledger Support + DeFi Focused)
  3. **Backpack** (xNFT runtime, multi-chain)

**Action:** Click any wallet (demo will auto-connect)

---

### Step 4: Dashboard with Agent Panel
```
URL: http://localhost:3000/dashboard
```

**🎯 THIS IS THE MAIN INTERFACE**

#### **Top Navigation (Fixed Bar)**
```
HOME / DASHBOARD / {Charity Name}
    [Marketplace] [Live Donate]
```
- Shows current path (breadcrumb)
- Direct links to other sections
- Charity name updates based on selection

#### **Main Content - Two Column Layout**

##### **LEFT COLUMN: Account & Portfolio**
```
┌─────────────────────────────────────┐
│ Trading Terminal                    │
│ Real-time portfolio tracking with   │
│ agent-powered impact routing        │
│                                     │
│ ACTIVE ACCOUNT:                     │
│ [Marcus Alpha (7XYDe...)]          │
│ → Sarah Quant (7XYDe...)           │
│ → CryptoNova (7XYDe...)            │
└─────────────────────────────────────┘
```

Portfolio Stats Grid (4 boxes):
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│Total Volume  │ Total PnL    │Total Donated │Act. Strategy │
│   $1.2M      │  +$19,102    │   $1,100     │      3       │
│ [teal]       │ [lime]       │   [lime]     │   [teal]     │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

##### **RIGHT COLUMN: Agent Control Panel**
```
┌──────────────────────────────────────────┐
│ ● AGENT ACTIVE                          │
│                                          │
│ Impact Router                            │
│                                          │
│ Automatically routes 0% of profits to    │
│ your selected charity. Agent learns your │
│ preferences over time.                   │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ CURRENT ROUTE                        │ │
│ │ Solar Future Foundation              │ │
│ │ → SoLx234future987abc               │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ [Change Charity Destination]            │
│                                          │
│ Agent Mode:           PASSIVE            │
│ Routing Efficiency:   97.3%              │
└──────────────────────────────────────────┘
```

---

## 🤖 Agent Charity Selection Flow

### Step 5: Open Charity Selector
**Action:** Click "Change Charity Destination" button

**What Appears:**
```
┌─────────────────────────────────────────────────────────┐
│ Select Impact Destination                               │
│                                                         │
│  ┌─────────────┬──────────────┬─────────────────────┐  │
│  │ Solar Future│ Kids First DAO│ Open Water Relief   │  │
│  │ Foundation  │              │                     │  │
│  │            │              │                     │  │
│  │ Climate     │ Children      │ Humanitarian        │  │
│  │ Deploying... │ Education &   │ Clean water access  │  │
│  │             │ nutrition     │ to 2M+ people...    │  │
│  │             │               │                     │  │
│  │ Raised: $410K│ Raised: $180K│ Raised: $1.4M       │  │
│  │ Impact: 98/100│Impact: 94/100│Impact: 99/100      │  │
│  └─────────────┴──────────────┴─────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Charity Card Details:**
- Organization name
- Category badge
- Mission description
- Total raised + followers
- Impact score
- Wallet (verified)

### Step 6: Select Charity
**Action:** Click on "Solar Future Foundation" card

**Result:**
```
✓ Charity selected
✓ Agent initialized
✓ Charity router activated
✓ Dashboard updated with selection
```

---

## 📊 Impact Routing Section (After Selection)

```
┌──────────────────────────────────────────────────────────┐
│ Impact Routing: Solar Future Foundation  [lime highlight]│
│                                                          │
│  Agent Route Status:        ACTIVE                       │
│  Estimated Monthly Impact:  $952                         │
│  at 5% profit allocation                                │
│                                                          │
│  Charity Wallet:            SoLx234future...  [verified] │
│                                                          │
│  Profits auto-routing to Solar Future Foundation         │
└──────────────────────────────────────────────────────────┘
```

---

## 📈 Dashboard Sections

### Recent Trades Section
```
RECENT TRADES

│ BUY SOL/USDT           │ Price: $181.20        │
│ 2 min ago              │ PnL: +$412.20 [green] │
├────────────────────────┼──────────────────────┤
│ SELL BTC/USDT          │ Price: $68,500.00     │
│ 15 min ago             │ PnL: -$84.50 [red]    │
└────────────────────────┴──────────────────────┘
```

### Donation History Section
```
DONATION HISTORY  [lime highlight]

│ Donation Triggered     │ $220.50               │
│ 45 min ago             │ 5% of profit          │
├────────────────────────┼──────────────────────┤
│ Donation Triggered     │ $102.10               │
│ 2 hours ago            │ 5% of profit          │
└────────────────────────┴──────────────────────┘
```

### Quick Actions
```
┌────────────────────┬────────────────────┬────────────────────┐
│ Manual Donation    │ Strategy           │ Browse All         │
│                    │ Marketplace        │ Charities          │
│ Donate directly to │ Copy verified      │ View complete list │
│ your selected      │ strategies from    │ of verified impact │
│ charity            │ top traders        │ destinations       │
│ → /live-donation   │ → /marketplace     │ → /charities       │
└────────────────────┴────────────────────┴────────────────────┘
```

---

## 🔄 Full Navigation Graph

```
         ┌─────────┐
         │ HOME    │
         └────┬────┘
              │
              ▼
         ┌─────────────┐
         │  AUTH PAGE  │
         └────┬────────┘
              │
              ▼
    ┌─────────────────────┐
    │   DASHBOARD ★       │
    │ (Agent Initialized) │
    └────┬──────────┬─────┘
         │          │
         ▼          ▼
    ┌──────────┐ ┌──────────────────┐
    │   LIVE   │ │   MARKETPLACE    │
    │ DONATION │ └──────────────────┘
    └──────────┘ 
         │
         ▼
    ┌──────────┐
    │ CHARITIES│
    └──────────┘
```

---

## 🎮 Demo Walkthrough Scenario

### Scenario: Marcus Alpha Donates via Agent

**Starting State:**
- Account: Marcus Alpha
- Portfolio: +$5,932 PnL
- Prior Donations: $217

**Steps:**

1. **Launch Terminal**
   - Click "LAUNCH TERMINAL" on homepage
   - Connect Phantom wallet (auto-demo)

2. **Select Account**
   - Dropdown: Marcus Alpha selected
   - Loads portfolio: $1.2M volume, +$5,932 PnL

3. **Select Charity**
   - Click "Change Charity Destination"
   - Modal opens with 3 charities
   - Select "Solar Future Foundation"
   - Agent initializes impact router

4. **Monitor Impact**
   - Agent shows: "ACTIVE"
   - Routing efficiency: 97.3%
   - Monthly impact estimate: $297 (5% of $5,932)

5. **View Recent Donations**
   - Donation history populated
   - Shows $220.50 donated
   - 5% of recent +$4,410 trade

6. **Take Action**
   - Option 1: "Manual Donation" → direct transfer
   - Option 2: "Strategy Marketplace" → copy strategy
   - Option 3: "Browse Charities" → change destination

---

## 💻 Real-Time Updates

### What Updates in Real-Time:
1. **Portfolio Stats** - Fetched from `/api/portfolio`
2. **Recent Trades** - Updated every 5 seconds
3. **Donation History** - New donations appear instantly
4. **Agent Status** - Shows ACTIVE/PASSIVE
5. **Monthly Impact** - Recalculated on each trade

### Data Flow:
```
User Action (Change Account / Select Charity)
    ↓
API Call (/api/portfolio?wallet={address})
    ↓
Agent Processes Selection
    ↓
Dashboard Re-renders with New Data
    ↓
UI Updates (Animations, Calculations)
```

---

## 🚀 Next Steps from Dashboard

### From Dashboard, User Can:

1. **Make Manual Donation**
   - Click "Manual Donation" button
   - Navigate to `/live-donation`
   - Donate directly to selected charity

2. **Copy Trading Strategy**
   - Click "Strategy Marketplace" button
   - Navigate to `/marketplace`
   - Browse top strategies
   - Click "Copy Strategy"

3. **Browse All Charities**
   - Click "All Charities" button
   - Navigate to `/charities`
   - View complete list
   - Switch impact destination

4. **Switch Accounts**
   - Use account dropdown
   - Select different demo account
   - Dashboard refreshes with new portfolio

5. **Make Direct Donation**
   - Agent auto-routes profits
   - Manual donation via live donation page
   - Recurring donation setup (future)

---

## 🔐 Agent Security

### What the Agent Does:
- ✅ Monitors wallet for trade signals
- ✅ Calculates profit on each trade
- ✅ Automatically deducts donation %
- ✅ Routes to selected charity wallet
- ✅ Logs all transactions
- ✅ On-chain verified

### What the Agent Does NOT Do:
- ❌ Never touches principal
- ❌ Never initiates trades
- ❌ Never accesses private keys
- ❌ Never stores credentials
- ❌ Never executes without permission

---

## 📱 Mobile Experience

### Responsive Breakpoints:
- **Desktop (1024px+):** Full 2-column layout
- **Tablet (768px-1023px):** Stacked panels
- **Mobile (< 768px):** Full-width, single column

### Mobile Optimizations:
- Charity selector: Full-screen modal
- Navigation: Hamburger menu (coming soon)
- Portfolio stats: Horizontal scroll
- Agent panel: Sticky header

---

## 📊 Key Metrics Displayed

### Portfolio Level:
- Total Volume: $1.2M
- Total PnL: +$19,102
- Total Donated: $1,100
- Active Strategies: 3

### Agent Level:
- Route Status: ACTIVE
- Monthly Impact: $952
- Efficiency: 97.3%
- Selected Charity: Solar Future Foundation

### Trade Level:
- Symbol, Side, Price
- Individual PnL per trade
- Timestamp

### Donation Level:
- Amount donated
- % of profit
- Charity destination
- Timestamp

---

## 🎯 Features to Try

### 1. **Switch Accounts**
Watch how portfolio data changes instantly

### 2. **Change Charities**
See impact router initialize for new destination

### 3. **Hover Effects**
Portfolio stats highlight on hover

### 4. **Quick Actions**
Navigate to marketplace, live donation, charities

### 5. **Mobile Responsive**
Resize browser to see responsive layout

---

## ✨ Visual Design

### Color Scheme:
- **Teal** (#14b8a6): Primary actions, portfolio stats
- **Lime** (#84cc16): Impact/donations, success
- **Dark** (#020617): Background, focus
- **Slate** (#64748b): Text, secondary

### Typography:
- **Headers:** Inter (bold, uppercase)
- **Body:** JetBrains Mono (terminal aesthetic)
- **Sizes:** 6px-48px for hierarchy

### Effects:
- Scanline overlay (animate)
- Glow effects on focus
- Hover transitions
- Float animations
- Pulse indicators

---

## 🔗 URL Reference

| Page | URL | Purpose |
|------|-----|---------|
| Home | `/` | Landing page |
| Auth | `/auth` | Wallet connection |
| Dashboard | `/dashboard` | Main interface |
| Live Donate | `/live-donation` | Manual donations |
| Marketplace | `/marketplace` | Strategy browsing |
| Charities | `/charities` | Charity list |
| Private Wallet | `/private-wallet` | Private key management |

---

## 🎬 Demo Flow Summary

```
START
  ↓
LAUNCH TERMINAL (/)
  ↓
CONNECT WALLET (/auth)
  ↓
DASHBOARD LOADED (/dashboard)
  ↓
SELECT CHARITY
  ↓
AGENT INITIALIZED
  ↓
MONITOR TRADES
  ↓
AUTO DONATIONS
  ↓
IMPACT GENERATED
  ↓
CHARITY RECEIVES FUNDS
  ↓
REPEAT
```

---

## 🚀 Launch Command

```bash
npm run dev
# Opens: http://localhost:3000
# Dev reload: Automatic on file changes
# HMR: Enabled
```

---

**Dashboard Status: ✅ LIVE & READY**
**Agent Status: ✅ INITIALIZED**
**Charity Routing: ✅ ACTIVE**
**Impact Generation: ✅ LIVE**

---

**Next Step:** 
1. Run `npm run dev`
2. Open http://localhost:3000
3. Click "LAUNCH TERMINAL"
4. Connect wallet
5. Select charity
6. Watch agent route profits

🎉 **System Ready for Demo!**
