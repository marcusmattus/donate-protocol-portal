import {
  DemoUser,
  Strategy,
  Charity,
  Portfolio,
} from "./types"

export const DEMO_CHARITIES: Charity[] = [
  {
    id: "solar-future",
    name: "Solar Future Foundation",
    walletAddress: "SoLx234future987abc",
    category: "climate",
    verified: true,
    mission: "Deploying solar infrastructure to underserved communities",
    raised: 410000,
    followers: 12045,
    impactScore: 98,
    donationHistory: [],
    website: "https://solarfuture.org",
    country: "Global",
    imageUrl: "/charities/solar-future.jpg",
  },
  {
    id: "kids-first-dao",
    name: "Kids First DAO",
    walletAddress: "KiDS8alpha123beta",
    category: "children",
    verified: true,
    mission: "Education and nutrition programs for children in developing countries",
    raised: 180000,
    followers: 8332,
    impactScore: 94,
    donationHistory: [],
    website: "https://kidsfirst.dao",
    country: "Multi-regional",
    imageUrl: "/charities/kids-first.jpg",
  },
  {
    id: "open-water-relief",
    name: "Open Water Relief",
    walletAddress: "OpWatr567demo",
    category: "humanitarian",
    verified: true,
    mission: "Providing clean water solutions to 50+ countries",
    raised: 1400000,
    followers: 25101,
    impactScore: 99,
    donationHistory: [],
    website: "https://openwaterrelief.org",
    country: "Global",
    imageUrl: "/charities/open-water.jpg",
  },
  {
    id: "climate-action-accelerator",
    name: "Climate Action Accelerator",
    walletAddress: "ClimateAct123XYZ",
    category: "climate",
    verified: true,
    mission: "Funding climate tech startups and carbon removal initiatives",
    raised: 550000,
    followers: 7234,
    impactScore: 96,
    donationHistory: [],
    website: "https://climateaccelerator.io",
    country: "Global",
    imageUrl: "/charities/climate-accelerator.jpg",
  },
  {
    id: "web3-education-collective",
    name: "Web3 Education Collective",
    walletAddress: "Web3Edu456ABC",
    category: "web3_public_goods",
    verified: true,
    mission: "Building free developer education for blockchain ecosystem",
    raised: 320000,
    followers: 9821,
    impactScore: 92,
    donationHistory: [],
    website: "https://web3edu.collective",
    country: "Online",
    imageUrl: "/charities/web3-edu.jpg",
  },
  {
    id: "animal-welfare-fund",
    name: "Animal Welfare Fund",
    walletAddress: "AnimalWelfare789",
    category: "animal_welfare",
    verified: true,
    mission: "Supporting animal rescue and conservation programs",
    raised: 195000,
    followers: 6432,
    impactScore: 91,
    donationHistory: [],
    website: "https://animalwelfarefund.org",
    country: "Global",
    imageUrl: "/charities/animal-welfare.jpg",
  },
]

export const DEMO_STRATEGIES: Strategy[] = [
  {
    id: "momentum-alpha",
    name: "Momentum Alpha",
    author: "Marcus Solana",
    winRate: 73,
    followers: 8321,
    donationRate: 2.0,
    monthlyPnL: 18.4,
    trending: false,
    accentColor: "teal",
    chartPath: "M0 20 L5 18 L10 19 L15 15 L20 16 L25 10 L30 14 L35 8 L40 10 L45 5 L50 9 L55 4 L60 8 L65 3 L70 6 L75 2 L80 4 L85 0 L90 2 L95 1 L100 0 V20 H0 Z",
    description: "Momentum-based trading using RSI and MACD indicators with strict risk management",
  },
  {
    id: "meme-rotator",
    name: "Meme Rotator",
    author: "CryptoNova",
    winRate: 82,
    followers: 18932,
    donationRate: 3.0,
    monthlyPnL: 245.1,
    trending: true,
    accentColor: "lime",
    chartPath: "M0 20 L10 15 L20 18 L30 10 L40 15 L50 5 L60 12 L70 0 L80 10 L90 2 L100 5 V20 H0 Z",
    description: "Tracks emerging meme tokens and rotates positions based on social sentiment",
  },
  {
    id: "whale-tracker",
    name: "Whale Tracker",
    author: "Sarah Quant",
    winRate: 68,
    followers: 5231,
    donationRate: 1.0,
    monthlyPnL: 11.2,
    trending: false,
    accentColor: "teal",
    chartPath: "M0 20 L10 18 L20 16 L30 14 L40 12 L50 10 L60 8 L70 6 L80 4 L90 2 L100 0 V20 H0 Z",
    description: "Mirrors on-chain whale transactions and copy-trades their positions",
  },
  {
    id: "solana-grid-bot",
    name: "Solana Grid Bot",
    author: "DeFi Master",
    winRate: 76,
    followers: 12453,
    donationRate: 1.5,
    monthlyPnL: 24.3,
    trending: false,
    accentColor: "lime",
    chartPath: "M0 20 L8 16 L16 18 L24 12 L32 14 L40 8 L48 11 L56 5 L64 9 L72 3 L80 7 L88 2 L96 5 L100 0 V20 H0 Z",
    description: "Grid trading bot optimized for SOL volatility between support/resistance",
  },
]

export const DEMO_USERS: DemoUser[] = [
  {
    id: "user-1",
    name: "Marcus Alpha",
    wallet: "7XYDemo111",
    pnl: 5932,
    totalDonation: 217,
    joinedAt: "2024-01-15",
    strategies: ["momentum-alpha"],
  },
  {
    id: "user-2",
    name: "Sarah Quant",
    wallet: "7XYDemo222",
    pnl: 19102,
    totalDonation: 1100,
    joinedAt: "2024-02-10",
    strategies: ["whale-tracker", "momentum-alpha"],
  },
  {
    id: "user-3",
    name: "CryptoNova",
    wallet: "7XYDemo333",
    pnl: 2240,
    totalDonation: 77,
    joinedAt: "2024-03-05",
    strategies: ["meme-rotator"],
  },
]

export const DEMO_PORTFOLIOS: Record<string, Portfolio> = {
  "7XYDemo111": {
    walletAddress: "7XYDemo111",
    totalVolume: 125000,
    totalPnL: 5932,
    totalDonated: 217,
    activeStrategies: ["momentum-alpha"],
    followedCharities: ["solar-future", "kids-first-dao"],
    recentTrades: [
      {
        id: "trade-1",
        symbol: "SOLUSDT",
        side: "BUY",
        price: 181.2,
        strategy: "momentum-alpha",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: "executed",
        pnl: 412.2,
      },
      {
        id: "trade-2",
        symbol: "SOLUSDT",
        side: "SELL",
        price: 182.5,
        strategy: "momentum-alpha",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        status: "executed",
        pnl: 144.0,
      },
    ],
    donationHistory: [
      {
        id: "donation-1",
        tradeId: "trade-1",
        fromWallet: "7XYDemo111",
        charityId: "solar-future",
        amount: 20.61,
        percentage: 5,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
  },
  "7XYDemo222": {
    walletAddress: "7XYDemo222",
    totalVolume: 320000,
    totalPnL: 19102,
    totalDonated: 1100,
    activeStrategies: ["whale-tracker", "momentum-alpha"],
    followedCharities: ["open-water-relief", "web3-education-collective"],
    recentTrades: [
      {
        id: "trade-3",
        symbol: "SOLUSDT",
        side: "BUY",
        price: 178.5,
        strategy: "whale-tracker",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        status: "executed",
        pnl: 892.5,
      },
    ],
    donationHistory: [
      {
        id: "donation-2",
        tradeId: "trade-3",
        fromWallet: "7XYDemo222",
        charityId: "open-water-relief",
        amount: 44.625,
        percentage: 5,
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
    ],
  },
  "7XYDemo333": {
    walletAddress: "7XYDemo333",
    totalVolume: 45000,
    totalPnL: 2240,
    totalDonated: 77,
    activeStrategies: ["meme-rotator"],
    followedCharities: ["kids-first-dao"],
    recentTrades: [
      {
        id: "trade-4",
        symbol: "SOLUSDT",
        side: "BUY",
        price: 180.0,
        strategy: "meme-rotator",
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        status: "executed",
        pnl: 77.0,
      },
    ],
    donationHistory: [
      {
        id: "donation-3",
        tradeId: "trade-4",
        fromWallet: "7XYDemo333",
        charityId: "kids-first-dao",
        amount: 2.31,
        percentage: 3,
        timestamp: new Date(Date.now() - 10800000).toISOString(),
      },
    ],
  },
}

export const DEMO_WEBHOOK_URL = "https://api.donate-protocol.demo/webhooks/tradingview/demo123"

// Utility functions for demo data
export function getDemoUser(walletAddress: string): DemoUser | undefined {
  return DEMO_USERS.find((u) => u.wallet === walletAddress)
}

export function getDemoPortfolio(walletAddress: string): Portfolio | undefined {
  return DEMO_PORTFOLIOS[walletAddress]
}

export function getCharityById(charityId: string): Charity | undefined {
  return DEMO_CHARITIES.find((c) => c.id === charityId)
}

export function getStrategyById(strategyId: string): Strategy | undefined {
  return DEMO_STRATEGIES.find((s) => s.id === strategyId)
}
