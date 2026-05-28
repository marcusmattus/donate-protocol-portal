// Solana adapter scaffolding — demo-only, no real RPC calls.
// Replace `simulate()` paths with @solana/web3.js + @coral-xyz/anchor in production.

export type WalletProvider = "phantom" | "solflare" | "backpack"

export interface ConnectedWallet {
  provider: WalletProvider
  publicKey: string
  cluster: "devnet" | "mainnet"
}

const DEMO_KEYS: Record<WalletProvider, string> = {
  phantom: "7XYDemo111Alpha9aBcDeFgHiJkLmNoPqRsTuVwXy",
  solflare: "7XYDemo222Sarah9aBcDeFgHiJkLmNoPqRsTuVwXy",
  backpack: "7XYDemo333Nova9aBcDeFgHiJkLmNoPqRsTuVwXy",
}

export const HELIUS_RPC = "https://devnet.helius-rpc.com/?api-key=demo"
export const JUPITER_QUOTE_URL = "https://quote-api.jup.ag/v6/quote"

export function simulateConnect(provider: WalletProvider): ConnectedWallet {
  return {
    provider,
    publicKey: DEMO_KEYS[provider],
    cluster: "devnet",
  }
}

export function generateDemoTx(prefix = "Dx"): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ123456789"
  let s = prefix
  for (let i = 0; i < 88 - prefix.length; i++) {
    s += chars[Math.floor(Math.random() * chars.length)]
  }
  return s
}

export interface JupiterQuote {
  inMint: string
  outMint: string
  inAmount: number
  outAmount: number
  priceImpactPct: number
  route: string[]
  slippageBps: number
}

export function mockJupiterQuote(opts: {
  inMint: string
  outMint: string
  inAmount: number
}): JupiterQuote {
  const impact = +(Math.random() * 0.4).toFixed(3)
  const ratio = 0.99 - impact / 100
  return {
    inMint: opts.inMint,
    outMint: opts.outMint,
    inAmount: opts.inAmount,
    outAmount: +(opts.inAmount * ratio).toFixed(6),
    priceImpactPct: impact,
    route: ["Orca", "Raydium", "Phoenix"].slice(0, 1 + Math.floor(Math.random() * 3)),
    slippageBps: 50,
  }
}

export interface SimulatedTradeResult {
  txSignature: string
  symbol: string
  side: "BUY" | "SELL"
  filledPrice: number
  size: number
  pnl: number
  donationAmount: number
  donationDestination: string
  destinationWallet: string
  slot: number
  blockTime: number
}

export function simulateTradeAndDonation(opts: {
  symbol: string
  side: "BUY" | "SELL"
  price: number
  size: number
  donationRatePct: number
  charityName: string
  charityWallet: string
}): SimulatedTradeResult {
  const slip = (Math.random() - 0.5) * 0.01
  const raw = opts.price * (1 + slip)
  const decimals = raw < 0.01 ? 8 : raw < 1 ? 6 : 4
  const filled = +raw.toFixed(decimals)
  const pnlPct = (Math.random() * 0.06) + 0.005 // 0.5% – 6.5%
  const notional = filled * opts.size
  const pnl = +(notional * pnlPct).toFixed(2)
  const donation = +((pnl * opts.donationRatePct) / 100).toFixed(2)
  return {
    txSignature: generateDemoTx("Tx"),
    symbol: opts.symbol,
    side: opts.side,
    filledPrice: filled,
    size: opts.size,
    pnl,
    donationAmount: Math.max(0.01, donation),
    donationDestination: opts.charityName,
    destinationWallet: opts.charityWallet,
    slot: 290_000_000 + Math.floor(Math.random() * 1_000_000),
    blockTime: Math.floor(Date.now() / 1000),
  }
}

export interface RiskCheckResult {
  ok: boolean
  score: number
  reasons: string[]
}

export function runRiskCheck(opts: {
  symbol: string
  side: "BUY" | "SELL"
  size: number
  price: number
}): RiskCheckResult {
  const notional = opts.size * opts.price
  const reasons: string[] = []
  let score = 100
  if (notional > 50_000) {
    score -= 25
    reasons.push("Notional > $50k, requires elevated approval")
  }
  if (opts.symbol.endsWith("USDT") || opts.symbol.endsWith("USDC")) {
    score += 5
  }
  if (Math.random() < 0.05) {
    score -= 40
    reasons.push("Anomalous mempool activity detected")
  }
  return { ok: score >= 50, score, reasons }
}
