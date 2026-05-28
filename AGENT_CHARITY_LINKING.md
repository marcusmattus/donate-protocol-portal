# Agent Dashboard & Charity Linking System

## Overview

The Agent Dashboard is the central hub for connecting traders with charities through automated donation routing. It combines:

- **Trading Signals** from TradingView/OpenClaw
- **Risk Analysis** via the agent
- **Simulated Execution** for demo purposes
- **Automatic Charity Routing** to selected organizations
- **Real-time Impact Tracking** on the dashboard

---

## Key Components

### 1. Agent Signal Processing

**Flow:**
```
TradingView Signal
    → OpenClaw Agent receives webhook
    → Analyzes trading opportunity
    → Calculates risk metrics
    → Simulates trade execution
    → Determines profit/loss
    → Triggers donation if profitable
    → Routes to linked charity
    → Updates dashboard
    → Sends Telegram notification
```

**Signal Webhook:**
```json
{
  "symbol": "SOLUSDT",
  "side": "BUY",
  "price": "181.20",
  "strategy": "Momentum Alpha",
  "timestamp": "2026-05-17T17:30:41Z"
}
```

### 2. Charity Linking Interface

Users can link charities to their account in multiple ways:

#### A. Primary Charity Selection
```
Dashboard → Settings → Select Primary Charity
- Set default donation destination
- All auto-donations route here
- Can be changed anytime
```

#### B. Strategy-Specific Charity Routing
```
Strategy Setup → Choose Charity
- Each strategy links to 1-3 charities
- Profits split among linked charities
- Custom percentage allocation
```

#### C. Portfolio Diversification
```
Charity Portfolio → Add Multiple Charities
- Follow multiple organizations
- Distribute donations across charities
- Track impact per charity
```

### 3. Agent-Charity Integration

The agent analyzes each signal and:

1. **Receives Signal** from TradingView
2. **Validates Strategy** against user settings
3. **Gets Linked Charities** from user profile
4. **Calculates Donation Amount** (% of profit)
5. **Creates Transaction** on Solana devnet
6. **Routes to Charity Wallet** via SPL transfer
7. **Updates Dashboard** with impact metrics
8. **Notifies User** via Telegram

---

## Building the Dashboard

### Dashboard Architecture

```
/dashboard
├── Hero Section
│   └── "Your Impact This Week"
├── Stats Cards
│   ├── Total Traded
│   ├── Profit Generated
│   ├── Donations Made
│   └── Lives Impacted
├── Active Strategies
│   ├── Strategy Card
│   ├── Current Status
│   ├── Linked Charity
│   └── Donation Rate
├── Charity Links
│   ├── Primary Charity
│   ├── Backup Charities
│   └── Link New Charity
├── Transaction History
│   ├── Trade Executed
│   ├── Profit Amount
│   ├── Donation Triggered
│   └── Charity Received
├── Impact Timeline
│   ├── This Week
│   ├── This Month
│   └── All Time
└── Quick Actions
    ├── Connect Charity
    ├── Adjust Settings
    ├── View Details
    └── Share Impact
```

### Charity Linking Workflow

```
User Views Dashboard
    ↓
Sees "Link Your First Charity" CTA
    ↓
Clicks "Connect Charity"
    ↓
Presented with Charity List
    ├── Solar Future Foundation
    ├── Kids First DAO
    ├── Open Water Relief
    └── Web3 Education Collective
    ↓
User Selects Charity
    ↓
Confirm Linking
    ↓
Set as Primary (Optional)
    ↓
Set Donation Percentage
    ↓
Success! Charity Linked
    ↓
Updated Dashboard Shows:
    - Primary Charity
    - Donation Rate
    - Impact Goals
```

---

## Agent-Linked Actions

### When User Executes a Trade

1. **Signal Received**
   ```
   TradingView → OpenClaw → /api/agent/signal
   ```

2. **Agent Analysis**
   ```
   GET /api/agent/analyze
   Body: { strategyId, symbol, side, price }
   Response: { riskScore, recommendation, estimatedProfit }
   ```

3. **Charity Lookup**
   ```
   GET /api/agent/charities?userId=USER_ID
   Response: { primaryCharity, backupCharities, donationRate }
   ```

4. **Donation Calculation**
   ```
   profit = estimatedProfit
   donationAmount = profit * donationRate
   charityWallet = primaryCharity.walletAddress
   ```

5. **Execute Transfer**
   ```
   POST /api/donations
   Body: {
     userId,
     charityId,
     amount,
     sourceTransaction,
     timestamp
   }
   ```

6. **Update Dashboard**
   ```
   WebSocket: /ws/dashboard
   Emit: { type: 'TRADE_COMPLETE', data: tradeData }
   ```

---

## API Integration Points

### Agent Endpoints

```bash
# Get agent status
GET /api/agent/status

# Receive TradingView signal
POST /api/agent/signal
{ symbol, side, price, strategy }

# Analyze trading opportunity
POST /api/agent/analyze
{ strategyId, symbol, side, price }

# Get user's linked charities
GET /api/agent/charities?userId=USER_ID

# Process donation
POST /api/agent/donate
{ charityId, amount, sourceTradeId }

# Get donation history
GET /api/agent/donations?userId=USER_ID

# Get impact metrics
GET /api/agent/impact?userId=USER_ID&period=week|month|allTime
```

### Charity Endpoints

```bash
# List all charities
GET /api/charities

# Filter charities
GET /api/charities?category=climate

# Get single charity
GET /api/charities/[id]

# Get charity stats
GET /api/charities/[id]/stats

# Get charity donation history
GET /api/charities/[id]/donations
```

### Dashboard Endpoints

```bash
# Get user dashboard data
GET /api/dashboard?userId=USER_ID

# Get user portfolio
GET /api/portfolio?userId=USER_ID

# Get trading signals
GET /api/signals?userId=USER_ID&limit=10

# Get donation history
GET /api/donations?userId=USER_ID
```

---

## Linking Charities to Strategies

### Strategy Setup Flow

```
1. User creates new strategy in dashboard
2. Strategy wizard shows "Choose Impact Partner"
3. User sees charity cards:
   - Name
   - Mission
   - Impact score
   - Followers
   - Recent donations
4. User selects 1-3 charities
5. System assigns donation percentages:
   - 1 charity: 100%
   - 2 charities: 50% each
   - 3 charities: 33% each
6. User confirms strategy
7. Strategy activates
8. All future profits → linked charities
```

### Dashboard Display

```
Strategy: "Momentum Alpha"
├── Status: ACTIVE
├── Win Rate: 73%
├── Monthly Profit: +$2,432
├── Donation Rate: 2%
├── Linked Charities:
│   ├── Solar Future Foundation (50%)
│   ├── Kids First DAO (50%)
│   └── Change Charity ↗
└── Impact This Month: $48.64
```

---

## Real-time Dashboard Updates

### WebSocket Events

```javascript
// Dashboard connects to WebSocket
ws.connect('wss://api.donate.local/ws/dashboard')

// Agent sends signal processed
ws.send({
  type: 'SIGNAL_PROCESSED',
  data: {
    signal: { symbol: 'SOLUSDT', side: 'BUY' },
    analysis: { confidence: 0.92, riskScore: 'LOW' },
    simulatedProfit: 145.32
  }
})

// Charity receives donation
ws.send({
  type: 'DONATION_RECEIVED',
  data: {
    charityId: 'solar-future',
    charityName: 'Solar Future Foundation',
    amount: 2.91,
    sourceTradeId: 'TRADE-123',
    impactMetric: 'Solar panels funded: 0.05'
  }
})

// Dashboard updates
ws.send({
  type: 'DASHBOARD_UPDATE',
  data: {
    totalTraded: 15234.50,
    totalProfit: 1523.45,
    totalDonated: 45.32,
    impactScore: 892,
    chartData: [...],
    recentActivity: [...]
  }
})
```

---

## Building the Connection UI

### Charity Connection Modal

```tsx
<CharityConnectionModal>
  <Header>Select Your Impact Partner</Header>
  
  <SearchBar 
    placeholder="Search charities..."
    onSearch={filterCharities}
  />
  
  <CategoryFilter>
    {categories.map(cat => (
      <FilterChip 
        key={cat}
        label={cat}
        onClick={() => filterByCategory(cat)}
      />
    ))}
  </CategoryFilter>
  
  <CharityGrid>
    {charities.map(charity => (
      <CharityCard
        key={charity.id}
        charity={charity}
        onSelect={() => selectCharity(charity)}
        isSelected={selectedCharity?.id === charity.id}
      >
        <Name>{charity.name}</Name>
        <Mission>{charity.mission}</Mission>
        <Stats>
          <Stat label="Followers" value={charity.followers} />
          <Stat label="Raised" value={formatCurrency(charity.totalRaised)} />
        </Stats>
        <Badge variant="verified" />
      </CharityCard>
    ))}
  </CharityGrid>
  
  <Actions>
    <Button variant="secondary" onClick={onCancel}>
      Cancel
    </Button>
    <Button 
      variant="primary" 
      onClick={() => confirmSelection(selectedCharity)}
      disabled={!selectedCharity}
    >
      Link Charity
    </Button>
  </Actions>
</CharityConnectionModal>
```

---

## Agent-Powered Recommendations

### Smart Charity Suggestions

The agent can recommend charities based on:

1. **User Trading Behavior**
   ```
   User trades: Solana/Web3 assets
   → Recommend: Web3 Education Collective
   ```

2. **Profit Patterns**
   ```
   User profits most from: Climate tech trades
   → Recommend: Solar Future Foundation
   ```

3. **Donation History**
   ```
   User previously donated to: Education
   → Recommend: Similar charities
   ```

4. **Community Interest**
   ```
   Popular with traders similar to user:
   → Recommend: Top charities in community
   ```

### Recommendation Engine

```typescript
async function getCharityRecommendations(userId: string) {
  const user = await getUser(userId)
  const tradeHistory = await getTradeHistory(userId)
  const donations = await getDonationHistory(userId)
  
  // Analyze patterns
  const preferredCategories = analyzeTradePatterns(tradeHistory)
  const previousCharities = extractCharityPreferences(donations)
  
  // Get charities matching preferences
  const recommendations = await queryCharities({
    categories: preferredCategories,
    excludeIds: previousCharities,
    sortBy: 'impact_score',
    limit: 5
  })
  
  return recommendations
}
```

---

## Testing the Integration

### Test Scenario 1: Connect Charity

```bash
# 1. User loads dashboard
GET /dashboard

# 2. Clicks "Link Charity"
# 3. Modal opens with charity list
GET /api/charities?limit=12

# 4. User selects charity
# 5. System confirms
POST /api/user/primary-charity
{
  "charityId": "solar-future",
  "donationRate": 0.02
}

# 6. Dashboard updates
GET /api/dashboard
# Response includes: primaryCharity: { id, name, wallet, ... }
```

### Test Scenario 2: Agent Processes Signal

```bash
# 1. TradingView sends signal
POST /api/agent/signal
{
  "symbol": "SOLUSDT",
  "side": "BUY",
  "price": "181.20",
  "strategy": "Momentum Alpha"
}

# 2. Agent analyzes
# Analysis: confidence 92%, estimated profit $145.32

# 3. Get user's linked charity
GET /api/agent/charities?userId=user123
# Response: { primaryCharity: { id: "solar-future", wallet: "..." } }

# 4. Calculate donation
# $145.32 * 2% = $2.91

# 5. Process donation
POST /api/donations
{
  "userId": "user123",
  "charityId": "solar-future",
  "amount": 2.91,
  "sourceTransaction": "TRADE-456"
}

# 6. WebSocket update sent to dashboard
# { type: 'DONATION_RECEIVED', data: { charityId: '...', amount: 2.91, ... } }

# 7. Dashboard refreshes with new stats
```

---

## Quick Start

### For Dashboard Development

```bash
# Start dev server
npm run dev

# Navigate to dashboard
# http://localhost:3000/dashboard

# Connect wallet (required)
# Select a charity to link
# View real-time agent updates
```

### For Agent Integration

```bash
# Check agent status
curl http://localhost:3000/api/agent/status

# Send test signal
curl -X POST http://localhost:3000/api/agent/signal \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "SOLUSDT",
    "side": "BUY",
    "price": "181.20",
    "strategy": "Momentum Alpha"
  }'

# Get recommendations
curl http://localhost:3000/api/agent/charities?userId=demo123
```

---

## Summary

✅ **Agent Dashboard** - Real-time trading & impact metrics
✅ **Charity Linking** - Connect 1-3 organizations per strategy
✅ **Automated Routing** - Profits automatically flow to charities
✅ **Real-time Updates** - WebSocket dashboard synchronization
✅ **Smart Recommendations** - Agent suggests charities based on behavior
✅ **Donation Tracking** - Full transparency on where money goes
✅ **Telegram Notifications** - Instant alerts on trades & donations

**All systems are integrated and ready for testing!** 🚀
