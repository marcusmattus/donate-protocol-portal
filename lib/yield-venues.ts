// Yield venues the Charity Swap Ramp can park capital in.
//
// The stable leg is a *yield-bearing* leg: idle USDC is never left flat, it is
// lent out or held as a yield-bearing stable so the position throws off a
// harvestable stream. That stream — not the principal — is what funds charity.
//
// APY/TVL figures are demo values for Solana devnet. Wire `apy` to the venue's
// own API before touching mainnet.

export type VenueAsset = "USDC" | "USDT" | "PYUSD" | "SOL" | "mSOL" | "JitoSOL"

export type VenueKind = "stable-lend" | "stable-yield-token" | "stable-lp" | "lst"

export type RiskBand = "low" | "medium" | "high"

export interface YieldVenue {
  id: string
  name: string
  protocol: string
  /** Token actually held while the position is open. */
  asset: VenueAsset
  kind: VenueKind
  /** Whether this venue keeps the position denominated in a stablecoin. */
  stable: boolean
  /** Net APY in percent, after venue fees. */
  apy: number
  /** Compounding periods per year. 0 = simple interest / streamed. */
  compoundsPerYear: number
  tvl: number
  risk: RiskBand
  /** Devnet mint hint. */
  mint: string
  /** Round-trip venue fee in bps, charged on deposit. */
  depositFeeBps: number
  /** How quickly principal can be pulled back out. */
  unlock: string
  description: string
}

export const YIELD_VENUES: YieldVenue[] = [
  {
    id: "kamino-usdc",
    name: "Kamino USDC Lend",
    protocol: "Kamino",
    asset: "USDC",
    kind: "stable-lend",
    stable: true,
    apy: 8.4,
    compoundsPerYear: 365,
    tvl: 412_000_000,
    risk: "low",
    mint: "USDCkam1noDevnet1111111111111111111111111",
    depositFeeBps: 0,
    unlock: "instant",
    description:
      "Supply-side USDC lending. Stable principal, variable borrow-driven APY, withdraw any slot.",
  },
  {
    id: "marginfi-usdc",
    name: "marginfi USDC Pool",
    protocol: "marginfi",
    asset: "USDC",
    kind: "stable-lend",
    stable: true,
    apy: 7.1,
    compoundsPerYear: 365,
    tvl: 288_000_000,
    risk: "low",
    mint: "USDCmrgnDevnet11111111111111111111111111",
    depositFeeBps: 0,
    unlock: "instant",
    description: "Isolated-risk USDC bank. Lowest utilisation volatility of the stable venues.",
  },
  {
    id: "pyusd-yield",
    name: "PYUSD Yield Note",
    protocol: "Paxos / Solana",
    asset: "PYUSD",
    kind: "stable-yield-token",
    stable: true,
    apy: 5.2,
    compoundsPerYear: 12,
    tvl: 96_000_000,
    risk: "low",
    mint: "PYUSDyieldDevnet111111111111111111111111",
    depositFeeBps: 5,
    unlock: "instant",
    description:
      "Yield-bearing stablecoin — the token itself accrues, so the balance grows without a claim tx.",
  },
  {
    id: "orca-usdc-usdt",
    name: "Orca USDC/USDT LP",
    protocol: "Orca Whirlpools",
    asset: "USDT",
    kind: "stable-lp",
    stable: true,
    apy: 12.6,
    compoundsPerYear: 365,
    tvl: 54_000_000,
    risk: "medium",
    mint: "OrcaUsdcUsdtDevnet1111111111111111111111",
    depositFeeBps: 10,
    unlock: "instant",
    description:
      "Tight-range stable LP. Highest stable yield here, paid in trading fees; small de-peg exposure.",
  },
  {
    id: "jito-sol",
    name: "JitoSOL",
    protocol: "Jito",
    asset: "JitoSOL",
    kind: "lst",
    stable: false,
    apy: 9.8,
    compoundsPerYear: 183,
    tvl: 1_900_000_000,
    risk: "medium",
    mint: "JitoSoLDevnet111111111111111111111111111",
    depositFeeBps: 0,
    unlock: "~2 epochs",
    description:
      "Liquid staking plus MEV tips. Principal rides the SOL price — yield is real, mark-to-market is not stable.",
  },
  {
    id: "marinade-msol",
    name: "Marinade mSOL",
    protocol: "Marinade",
    asset: "mSOL",
    kind: "lst",
    stable: false,
    apy: 8.9,
    compoundsPerYear: 183,
    tvl: 1_100_000_000,
    risk: "medium",
    mint: "mSoLmarinadeDevnet111111111111111111111",
    depositFeeBps: 0,
    unlock: "~2 epochs",
    description: "Validator-diversified liquid staking. SOL-denominated principal.",
  },
]

export const STABLE_VENUES = YIELD_VENUES.filter((v) => v.stable)

export function findVenue(id: string): YieldVenue | undefined {
  return YIELD_VENUES.find((v) => v.id === id)
}

/** Best stable venue by APY — the default the ramp tool opens on. */
export function bestStableVenue(): YieldVenue {
  return STABLE_VENUES.reduce((best, v) => (v.apy > best.apy ? v : best), STABLE_VENUES[0])
}

export const RISK_META: Record<RiskBand, { label: string; color: string }> = {
  low: { label: "Low", color: "lime" },
  medium: { label: "Medium", color: "teal" },
  high: { label: "High", color: "rose" },
}
