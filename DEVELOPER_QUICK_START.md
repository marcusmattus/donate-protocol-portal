# Developer Quick Start Guide

**For:** Project team, investors, hackathon judges  
**Time to first launch:** 2 minutes  
**Time to understand system:** 10 minutes

---

## TL;DR - Start Here

```bash
# 1. Install & start (from repo root)
npm install
npm run dev

# 2. Open browser
http://localhost:3000

# 3. Click [Dashboard] button

# That's it! You're in the system.
```

---

## 30-Second Overview

**What is this?**
- A Solana application that automatically routes trading profits to charities
- Users connect wallets, select strategies, system handles everything

**How does it work?**
1. User connects wallet (Phantom/Solflare)
2. Selects favorite charity from marketplace
3. Agent monitors trades
4. When profit happens → automatically donates % to charity
5. Impact tracked on-chain

**What can you do?**
- Browse charities on marketplace
- Make testnet donations
- Change charity destinations
- Setup auto-donations
- View impact dashboard

---

## 5-Minute Tour

### Step 1: View Home (10 seconds)
```
URL: http://localhost:3000
See: Hero with "Trade Smarter. Give Automatically."
Click: [Dashboard] (primary button)
```

### Step 2: Explore Dashboard (2 minutes)
```
URL: Auto-redirects to /dashboard
See: 
  ├─ Your portfolio stats (top left)
  ├─ Agent panel (top right) - ACTIVE status
  ├─ Recent trades list
  ├─ Donation history
  └─ Quick action buttons

Interact:
  ├─ Switch users: Account dropdown → Try other users
  ├─ Change charity: Agent panel → [Change Charity Destination]
  └─ Click any quick action button below
```

### Step 3: Try Marketplace (2 minutes)
```
Navigation:
  Dashboard → Click [Marketplace] (top right)
  OR Click [Browse All Causes] quick action

See:
  ├─ 3 charity cards
  ├─ Each shows stats
  └─ [Donate Now] buttons

Try:
  ├─ Click [Donate Now]
  └─ Redirects to /live-donation (but no wallet yet)
```

### Step 4: Test Agent Panel (1 minute)
```
Action:
  ├─ Back on Dashboard
  ├─ Agent panel on right side
  ├─ Click "[Change Charity Destination]"
  ├─ Modal opens with 3 charities
  ├─ Click different charity
  ├─ Modal closes
  └─ "Current Route" updates

Impact:
  └─ All future profits route to NEW charity
```

---

## 10-Minute Deep Dive

### Core Architecture
```
FRONTEND (Next.js React)
  ├─ Pages (routes)
  ├─ Components (UI)
  ├─ Stores (Zustand state)
  └─ Hooks (logic)

BACKEND (Next.js API)
  ├─ /api/charities
  ├─ /api/portfolio
  ├─ /api/transactions
  └─ /api/demo/data

BLOCKCHAIN (Solana)
  ├─ Devnet RPC
  ├─ Wallet adapter
  └─ SPL tokens
```

### Key Concepts

**1. Dashboard = Hub**
- Central point for everything
- All routes are accessible from here
- Shows real-time portfolio + agent status

**2. Agent = Automation**
- Learns user's charity preference
- Automatically routes profits
- Shows routing efficiency %

**3. Marketplace = Discovery**
- Browse verified charities
- See stats (raised, followers, impact)
- Direct donation button

**4. Live Donation = Real Transactions**
- Connect wallet
- Send testnet SOL to charity
- See TX confirmation
- Impact appears on dashboard

---

## API Quick Reference

### Get All Data
```bash
curl http://localhost:3000/api/demo/data
# Returns: charities, strategies, users, transactions
```

### Get Portfolio for User
```bash
curl http://localhost:3000/api/portfolio?wallet=7XYDemo222
# Returns: pnl, volume, donated, trades, donations
```

### Get All Charities
```bash
curl http://localhost:3000/api/charities
# Returns: array of charity objects
```

### Get Specific Charity
```bash
curl http://localhost:3000/api/charities/solar-future
# Returns: detailed charity data
```

### All Endpoints
```
GET  /api/charities
GET  /api/charities/[id]
GET  /api/portfolio?wallet=XXX
GET  /api/strategies
GET  /api/marketplace
GET  /api/transactions?wallet=XXX
POST /api/transactions
POST /api/charities/donate
GET  /api/demo/data
```

---

## File Structure (What to Edit)

### Pages (Routes)
```
app/page.tsx                    # Home
app/dashboard/page.tsx          # ← MAIN HUB (what users see)
app/marketplace/page.tsx        # Charity browse
app/charities/page.tsx          # All charities list
app/live-donation/page.tsx      # Wallet + donate
app/private-wallet/page.tsx     # Auto-donation setup
app/transparency/page.tsx       # Impact dashboard
```

### API Routes
```
app/api/
├── charities/route.ts          # Charity endpoints
├── portfolio/route.ts          # Portfolio data
├── transactions/route.ts       # TX endpoints
├── strategies/route.ts         # Strategy endpoints
└── demo/data/route.ts          # Demo data seed
```

### Components
```
components/
├── dashboard/                  # Dashboard UI
├── marketplace/                # Marketplace UI
├── wallet/                     # Wallet components
└── ui/                         # shadcn/ui
```

### Styles
```
styles/globals.css              # Tailwind + animations
```

---

## Demo Data

### Users (Pick One)
```
1. Marcus Alpha: wallet=7XYDemo111
   PnL: +$5,932
   Donated: $217

2. Sarah Quant: wallet=7XYDemo222 ← DEFAULT
   PnL: +$19,102
   Donated: $1,100

3. CryptoNova: wallet=7XYDemo333
   PnL: +$2,240
   Donated: $77
```

### Charities
```
1. Solar Future Foundation
   Wallet: SoLx234future987abc
   Raised: $410,000
   
2. Kids First DAO
   Wallet: KiDS8alpha123beta
   Raised: $180,000
   
3. Open Water Relief
   Wallet: OpWatr567demo
   Raised: $1.4M
```

### Strategies
```
1. Momentum Alpha - 73% win rate
2. Meme Rotator - 82% win rate (TRENDING)
3. Whale Tracker - 68% win rate
```

---

## Common Tasks

### Change Demo Data
```
File: app/api/demo/data/route.ts

Edit:
  - Charities array
  - Strategies array
  - Users array
  - Mock transactions

Restart: npm run dev
```

### Add New Charity
```
1. Edit: app/api/demo/data/route.ts
2. Add to charities array:
   {
     id: "new-charity",
     name: "Charity Name",
     category: "category",
     walletAddress: "SoLxxx...",
     ...
   }
3. Restart dev server
4. Appears on marketplace instantly
```

### Modify Dashboard
```
File: app/dashboard/page.tsx

Main sections:
  - Line 94: Navigation/breadcrumb
  - Line 148: Agent panel
  - Line 237: Stats grid
  - Line 389: Quick actions

Edit, save, refresh browser → See changes
```

### Test API
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Test endpoints
curl http://localhost:3000/api/charities
curl http://localhost:3000/api/portfolio?wallet=7XYDemo222
curl http://localhost:3000/api/demo/data
```

---

## Key Features to Understand

### 1. Agent Panel
**Where:** Dashboard, top right  
**What:** Shows automation status  
**Click:** [Change Charity Destination]  
**Result:** Agent learns new preference

### 2. Account Selector
**Where:** Dashboard, top left  
**What:** Switch between demo users  
**Do:** Select different user → Portfolio updates

### 3. Quick Actions
**Where:** Dashboard, bottom  
**Do:** [Manual Donation] / [Marketplace] / [All Charities]

### 4. Donation History
**Where:** Dashboard, middle  
**Shows:** All donations from this account

### 5. Navigation Bar
**Where:** Top of dashboard  
**Links:** Charities, Marketplace, Donate, Wallet, Impact

---

## Testing Checklist

- [ ] Home page loads (/)
- [ ] Dashboard loads (/dashboard)
- [ ] Portfolio stats display
- [ ] Agent panel visible
- [ ] Account dropdown works
- [ ] [Change Charity] opens modal
- [ ] Charity selection updates agent
- [ ] [Marketplace] button works
- [ ] Marketplace shows 3 charities
- [ ] [Donate Now] redirects correctly
- [ ] API endpoints respond
- [ ] Demo data loads

---

## Troubleshooting

### App won't start?
```bash
# Clear cache
rm -rf .next
npm install
npm run dev
```

### Page shows 404?
```bash
# Check URL matches routes in app/
# Verify dev server is running on port 3000
lsof -i :3000
```

### Data not loading?
```bash
# Test API directly
curl http://localhost:3000/api/demo/data

# Check browser console for errors
# Inspect Network tab in DevTools
```

### Styles look wrong?
```bash
# Rebuild Tailwind
npm run build
npm run dev
```

---

## Next Level: Making Changes

### Add a Feature
```
1. Create new file in appropriate folder
2. Import components needed
3. Add route in app/ if needed
4. Update navigation links
5. Test thoroughly
6. Commit to git
```

### Edit Dashboard Stats
```
File: app/dashboard/page.tsx
Line: 237 (Portfolio Stats Grid)

Change stat labels, colors, values
Refresh browser to see changes
```

### Add New Route
```
1. Create folder in app/: app/my-route/
2. Create file: page.tsx
3. Add "use client" at top
4. Add navigation link
5. Works automatically
```

---

## Performance Notes

- **Dev mode reload:** ~2 seconds
- **API response time:** < 100ms (local)
- **Page load time:** < 1 second
- **Animation frame rate:** 60fps

---

## Browser DevTools Tips

### Console
- Shows errors
- Test API: `fetch('/api/charities').then(r => r.json())`

### Network
- Watch API calls
- Check response times
- Verify TX submissions

### Application
- View stored data
- Check cookies/tokens
- Debug state

### Elements
- Inspect styles
- Check CSS classes
- Verify HTML structure

---

## Production Considerations

### Before Mainnet
- [ ] Real wallet integration
- [ ] Helius RPC instead of devnet
- [ ] Database setup (PostgreSQL)
- [ ] Proper authentication
- [ ] Rate limiting on APIs
- [ ] Error logging
- [ ] Monitoring setup
- [ ] Security audit

### Environment Variables
```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
DATABASE_URL=postgresql://...
```

---

## Getting Help

### Documentation
- `APP_STRUCTURE.md` - Full architecture
- `TERMINAL_LAUNCH_GUIDE_UPDATED.md` - Navigation guide
- `IMPLEMENTATION_COMPLETE.md` - Technical details
- `DEPLOYMENT.md` - Production setup

### Code Comments
- Key functions have comments
- Look in components/ for examples

### Type Hints
- All functions typed in TypeScript
- Hover over in VS Code for details

---

## Quick Links

| Action | Command |
|--------|---------|
| Start dev | `npm run dev` |
| Build prod | `npm run build` |
| Run tests | `npm test` (when available) |
| Lint code | `npm run lint` |
| View logs | Console in browser + terminal |

---

**Time to mastery: 30 minutes**  
**Happy hacking! 🚀**
