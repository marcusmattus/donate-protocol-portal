// Donate Protocol — Solana demo seed data
// All values are simulated. No real funds. Devnet wallet hints only.

export type CharityCategory =
  | "climate"
  | "education"
  | "healthcare"
  | "children"
  | "food"
  | "disaster"
  | "publicgoods"
  | "animal"
  | "humanitarian"

export interface Charity {
  id: string
  name: string
  category: CharityCategory
  mission: string
  wallet: string
  verified: boolean
  followers: number
  raised: number
  impactScore: number
  country: string
  website: string
  socialLinks: { twitter?: string; telegram?: string; discord?: string }
  donationsCount: number
  recentDonations: { amount: number; from: string; ts: number }[]
}

export interface Strategy {
  id: string
  name: string
  author: string
  authorWallet: string
  winRate: number
  pnl: number
  pnlPct: number
  followers: number
  donationRate: number
  description: string
  asset: string
  trades24h: number
  trending: boolean
}

export interface DemoUser {
  id: string
  name: string
  handle: string
  wallet: string
  pnl: number
  donations: number
  followingStrategies: string[]
  defaultCharityId: string
}

export interface TradeSignal {
  id: string
  ts: number
  symbol: string
  side: "BUY" | "SELL"
  price: number
  size: number
  strategy: string
  source: "tradingview" | "openclaw" | "copy"
  status: "queued" | "executed" | "donating" | "complete" | "failed"
  pnl?: number
  donationAmount?: number
  donationDestination?: string
  txSignature?: string
}

export interface DonationEvent {
  id: string
  ts: number
  amount: number
  fromUser: string
  toCharityId: string
  toCharity: string
  sourceTrade: string
  txSignature: string
  status: "pending" | "settled"
}

export const CHARITIES: Charity[] = [
  {
    id: "solar-future",
    name: "Solar Future Foundation",
    category: "climate",
    mission:
      "Deploying off-grid solar microgrids to rural communities across sub-Saharan Africa and Southeast Asia.",
    wallet: "SoLx234future987abcDevnetXYZ1qPaQ2rS3tU4vW",
    verified: true,
    followers: 12045,
    raised: 410000,
    impactScore: 98,
    country: "Kenya",
    website: "https://solar-future.example",
    socialLinks: { twitter: "@solarfuture", telegram: "solarfuture" },
    donationsCount: 8412,
    recentDonations: [
      { amount: 217.4, from: "Marcus Alpha", ts: Date.now() - 1000 * 60 * 12 },
      { amount: 4.32, from: "CryptoNova", ts: Date.now() - 1000 * 60 * 27 },
      { amount: 88.0, from: "Sarah Quant", ts: Date.now() - 1000 * 60 * 41 },
    ],
  },
  {
    id: "kids-first",
    name: "Kids First DAO",
    category: "children",
    mission:
      "Funding meals, school supplies, and digital learning for displaced children worldwide.",
    wallet: "KiDS8alpha123betaDevnet9mN8bV7cX6zY5aW4qP",
    verified: true,
    followers: 8332,
    raised: 180000,
    impactScore: 94,
    country: "Global",
    website: "https://kidsfirst.example",
    socialLinks: { twitter: "@kidsfirstdao", discord: "kidsfirst" },
    donationsCount: 5103,
    recentDonations: [
      { amount: 14.1, from: "Marcus Alpha", ts: Date.now() - 1000 * 60 * 3 },
      { amount: 240, from: "Sarah Quant", ts: Date.now() - 1000 * 60 * 90 },
    ],
  },
  {
    id: "open-water",
    name: "Open Water Relief",
    category: "humanitarian",
    mission:
      "Drilling clean water wells and shipping desalination kits to drought-stricken regions.",
    wallet: "OpWatr567demoDevnetPq8R7s6T5u4V3w2X1y0Zaa",
    verified: true,
    followers: 25101,
    raised: 1_400_000,
    impactScore: 99,
    country: "Ethiopia",
    website: "https://openwater.example",
    socialLinks: { twitter: "@openwaterrelief" },
    donationsCount: 19_204,
    recentDonations: [
      { amount: 412.2, from: "Marcus Alpha", ts: Date.now() - 1000 * 60 * 6 },
      { amount: 77, from: "CryptoNova", ts: Date.now() - 1000 * 60 * 33 },
    ],
  },
  {
    id: "code-public-goods",
    name: "Code Public Goods",
    category: "publicgoods",
    mission:
      "Retro-funding for open-source maintainers and Web3 infrastructure libraries.",
    wallet: "CodePubGoodsDevnet3Q4r5s6t7u8v9w0x1y2z3aB",
    verified: true,
    followers: 4012,
    raised: 92_400,
    impactScore: 91,
    country: "Global",
    website: "https://codepublicgoods.example",
    socialLinks: { twitter: "@codepubgoods", discord: "cpg" },
    donationsCount: 1840,
    recentDonations: [
      { amount: 32.8, from: "Sarah Quant", ts: Date.now() - 1000 * 60 * 14 },
    ],
  },
  {
    id: "rainforest-alliance",
    name: "Rainforest Alliance Web3",
    category: "climate",
    mission: "On-chain verified reforestation across the Amazon basin.",
    wallet: "RainForestDevnetA1b2C3d4E5f6G7h8I9j0K1l2M",
    verified: true,
    followers: 16_201,
    raised: 624_000,
    impactScore: 96,
    country: "Brazil",
    website: "https://rainforest.example",
    socialLinks: { twitter: "@rainforestw3" },
    donationsCount: 7_120,
    recentDonations: [],
  },
  {
    id: "med-relief",
    name: "Med Relief Network",
    category: "healthcare",
    mission:
      "Mobile clinics and tele-medicine for under-served communities in 14 countries.",
    wallet: "MedReliefDevnetN1m2L3k4J5i6H7g8F9e0D1c2B3a",
    verified: true,
    followers: 6_932,
    raised: 251_900,
    impactScore: 93,
    country: "India",
    website: "https://medrelief.example",
    socialLinks: { twitter: "@medreliefnet" },
    donationsCount: 3_400,
    recentDonations: [],
  },
  {
    id: "food-chain",
    name: "FoodChain Mutual Aid",
    category: "food",
    mission:
      "Community kitchens and supply-chain logistics for food deserts in the US and EU.",
    wallet: "FoodChainDevnetZ9y8X7w6V5u4T3s2R1q0P9o8N7m6L",
    verified: false,
    followers: 1_204,
    raised: 18_400,
    impactScore: 78,
    country: "USA",
    website: "https://foodchain.example",
    socialLinks: {},
    donationsCount: 412,
    recentDonations: [],
  },
  {
    id: "paws-protocol",
    name: "Paws Protocol",
    category: "animal",
    mission: "Sanctuary funding and veterinary care for rescued animals.",
    wallet: "PawsProtoDevnetQ1w2E3r4T5y6U7i8O9p0A1s2D3f4G",
    verified: true,
    followers: 9_412,
    raised: 142_000,
    impactScore: 90,
    country: "Global",
    website: "https://paws.example",
    socialLinks: { twitter: "@pawsprotocol" },
    donationsCount: 5_204,
    recentDonations: [],
  },
]

export const STRATEGIES: Strategy[] = [
  {
    id: "momentum-alpha",
    name: "Momentum Alpha",
    author: "Marcus Alpha",
    authorWallet: "7XYDemo111Alpha9aBcDeFgHiJkLmNoPqRsTuVwXy",
    winRate: 73,
    pnl: 5_932,
    pnlPct: 18.4,
    followers: 8_321,
    donationRate: 2,
    description:
      "Trend-following SOL/USDT breakouts using 4h Ichimoku confluence and Helius mempool signals.",
    asset: "SOL/USDT",
    trades24h: 12,
    trending: false,
  },
  {
    id: "whale-tracker",
    name: "Whale Tracker",
    author: "Sarah Quant",
    authorWallet: "7XYDemo222Sarah9aBcDeFgHiJkLmNoPqRsTuVwXy",
    winRate: 68,
    pnl: 19_102,
    pnlPct: 11.2,
    followers: 5_231,
    donationRate: 1,
    description:
      "Tracks top-200 wallet rotations and front-runs cluster moves on Jupiter routes.",
    asset: "Multi",
    trades24h: 4,
    trending: false,
  },
  {
    id: "sol-meme",
    name: "Solana Meme Rotation",
    author: "CryptoNova",
    authorWallet: "7XYDemo333Nova9aBcDeFgHiJkLmNoPqRsTuVwXy",
    winRate: 82,
    pnl: 2_240,
    pnlPct: 245.1,
    followers: 18_932,
    donationRate: 3,
    description:
      "Rotational small-cap SPL strategy across top trending Solana memecoins with hard stops.",
    asset: "SPL",
    trades24h: 31,
    trending: true,
  },
  {
    id: "stable-arb",
    name: "Jupiter Stable Arb",
    author: "Arbiter01",
    authorWallet: "7XYDemo444Arb9aBcDeFgHiJkLmNoPqRsTuVwXyZ",
    winRate: 91,
    pnl: 4_120,
    pnlPct: 4.1,
    followers: 2_104,
    donationRate: 1,
    description:
      "Cross-route stablecoin arbitrage with Jupiter aggregator and parallel slot execution.",
    asset: "USDC/USDT",
    trades24h: 88,
    trending: false,
  },
]

export const DEMO_USERS: DemoUser[] = [
  {
    id: "marcus",
    name: "Marcus Alpha",
    handle: "@marcus",
    wallet: "7XYDemo111Alpha9aBcDeFgHiJkLmNoPqRsTuVwXy",
    pnl: 5_932,
    donations: 217,
    followingStrategies: ["momentum-alpha", "sol-meme"],
    defaultCharityId: "solar-future",
  },
  {
    id: "sarah",
    name: "Sarah Quant",
    handle: "@sarahq",
    wallet: "7XYDemo222Sarah9aBcDeFgHiJkLmNoPqRsTuVwXy",
    pnl: 19_102,
    donations: 1_100,
    followingStrategies: ["whale-tracker", "stable-arb"],
    defaultCharityId: "open-water",
  },
  {
    id: "nova",
    name: "CryptoNova",
    handle: "@cryptonova",
    wallet: "7XYDemo333Nova9aBcDeFgHiJkLmNoPqRsTuVwXy",
    pnl: 2_240,
    donations: 77,
    followingStrategies: ["sol-meme"],
    defaultCharityId: "kids-first",
  },
]

export const RECENT_SIGNALS: TradeSignal[] = [
  {
    id: "sig-001",
    ts: Date.now() - 1000 * 60 * 2,
    symbol: "SOLUSDT",
    side: "BUY",
    price: 181.2,
    size: 50,
    strategy: "Momentum Alpha",
    source: "tradingview",
    status: "complete",
    pnl: 144.3,
    donationAmount: 4.32,
    donationDestination: "Solar Future Foundation",
    txSignature: "5e6xDemoTx9k2nMomentumPnl144AbCdEf012345",
  },
  {
    id: "sig-002",
    ts: Date.now() - 1000 * 60 * 7,
    symbol: "BONKUSDT",
    side: "BUY",
    price: 0.000022,
    size: 1_000_000,
    strategy: "Solana Meme Rotation",
    source: "openclaw",
    status: "complete",
    pnl: 412.2,
    donationAmount: 12.36,
    donationDestination: "Kids First DAO",
    txSignature: "BonkDemoTx1q2w3MemeRotationPnl412XyZ9876",
  },
  {
    id: "sig-003",
    ts: Date.now() - 1000 * 60 * 12,
    symbol: "JTOUSDT",
    side: "SELL",
    price: 3.41,
    size: 200,
    strategy: "Whale Tracker",
    source: "tradingview",
    status: "donating",
    pnl: 88,
    donationAmount: 0.88,
    donationDestination: "Open Water Relief",
  },
  {
    id: "sig-004",
    ts: Date.now() - 1000 * 60 * 18,
    symbol: "SOLUSDT",
    side: "SELL",
    price: 180.4,
    size: 10,
    strategy: "Momentum Alpha",
    source: "copy",
    status: "executed",
    pnl: -22.1,
  },
]

export const DONATIONS: DonationEvent[] = [
  {
    id: "don-001",
    ts: Date.now() - 1000 * 60 * 2,
    amount: 4.32,
    fromUser: "Marcus Alpha",
    toCharityId: "solar-future",
    toCharity: "Solar Future Foundation",
    sourceTrade: "sig-001",
    txSignature: "5e6xDemoTx9k2nMomentumPnl144AbCdEf012345",
    status: "settled",
  },
  {
    id: "don-002",
    ts: Date.now() - 1000 * 60 * 7,
    amount: 12.36,
    fromUser: "CryptoNova",
    toCharityId: "kids-first",
    toCharity: "Kids First DAO",
    sourceTrade: "sig-002",
    txSignature: "BonkDemoTx1q2w3MemeRotationPnl412XyZ9876",
    status: "settled",
  },
  {
    id: "don-003",
    ts: Date.now() - 1000 * 60 * 38,
    amount: 217.4,
    fromUser: "Marcus Alpha",
    toCharityId: "solar-future",
    toCharity: "Solar Future Foundation",
    sourceTrade: "sig-prev-040",
    txSignature: "PrevAlphaDemoTx217SolarFutureZ9Y8X7W6V5",
    status: "settled",
  },
  {
    id: "don-004",
    ts: Date.now() - 1000 * 60 * 122,
    amount: 1_100,
    fromUser: "Sarah Quant",
    toCharityId: "open-water",
    toCharity: "Open Water Relief",
    sourceTrade: "sig-prev-018",
    txSignature: "PrevSarahDemoTx1100OpenWaterAa1Bb2Cc3D",
    status: "settled",
  },
]

export const CATEGORY_META: Record<CharityCategory, { label: string; color: string }> = {
  climate: { label: "Climate", color: "lime" },
  education: { label: "Education", color: "teal" },
  healthcare: { label: "Healthcare", color: "teal" },
  children: { label: "Children", color: "lime" },
  food: { label: "Food Support", color: "lime" },
  disaster: { label: "Disaster Relief", color: "teal" },
  publicgoods: { label: "Web3 Public Goods", color: "teal" },
  animal: { label: "Animal Welfare", color: "lime" },
  humanitarian: { label: "Humanitarian", color: "teal" },
}

export function findCharity(id: string): Charity | undefined {
  return CHARITIES.find((c) => c.id === id)
}

export function findStrategy(id: string): Strategy | undefined {
  return STRATEGIES.find((s) => s.id === id)
}

export function formatUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(2)}`
}

export function shortWallet(w: string): string {
  if (!w) return ""
  return `${w.slice(0, 4)}…${w.slice(-4)}`
}

export function timeAgo(ts: number): string {
  const diff = Math.max(1, Math.floor((Date.now() - ts) / 1000))
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
