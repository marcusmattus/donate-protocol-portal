// Solana Donate Protocol Types

export interface DemoUser {
  id: string
  name: string
  wallet: string
  pnl: number
  totalDonation: number
  joinedAt: string
  strategies: string[]
}

export interface Strategy {
  id: string
  name: string
  author: string
  winRate: number
  followers: number
  donationRate: number
  monthlyPnL: number
  trending: boolean
  accentColor: "teal" | "lime"
  chartPath: string
  description: string
}

export interface Charity {
  id: string
  name: string
  walletAddress: string
  category: "education" | "healthcare" | "climate" | "children" | "food_support" | "disaster_relief" | "web3_public_goods" | "animal_welfare" | "humanitarian"
  verified: boolean
  mission: string
  raised: number
  followers: number
  impactScore: number
  donationHistory: DonationRecord[]
  website?: string
  socialLinks?: Record<string, string>
  country?: string
  imageUrl?: string
}

export interface DonationRecord {
  id: string
  charityId: string
  fromWallet: string
  amount: number
  timestamp: string
  sourceStrategy?: string
  transactionHash?: string
}

export interface TradeSignal {
  id: string
  symbol: string
  side: "BUY" | "SELL"
  price: number
  strategy: string
  timestamp: string
  status: "pending" | "executed" | "failed"
  pnl?: number
}

export interface DonationEvent {
  id: string
  tradeId: string
  fromWallet: string
  charityId: string
  amount: number
  percentage: number
  timestamp: string
  transactionHash?: string
}

export interface Portfolio {
  walletAddress: string
  totalVolume: number
  totalPnL: number
  totalDonated: number
  activeStrategies: string[]
  followedCharities: string[]
  recentTrades: TradeSignal[]
  donationHistory: DonationEvent[]
}

export interface WebhookPayload {
  symbol: string
  side: "BUY" | "SELL"
  price: string
  strategy: string
  timestamp?: string
}

export interface TradingViewSignal {
  symbol: string
  action: "BUY" | "SELL"
  price: number
  timestamp: string
  strategy: string
}
