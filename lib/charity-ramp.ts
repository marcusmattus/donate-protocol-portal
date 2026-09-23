// Charity Swap Ramp — the math behind "keep the principal, give the yield".
//
// Flow: source token -> Jupiter swap -> yield venue -> yield accrues -> each
// harvest skims `donationRatePct` of the *yield only* to a charity wallet and
// re-compounds the rest. Principal is never donated.
//
// "Ramping" means the swap in is split into N tranches spaced over time (DCA)
// instead of one market order. That cuts price impact but delays yield, and
// `compareRampToLumpSum` below reports both sides of that trade honestly.
//
// Every function here is pure and deterministic — no Math.random, no Date.now
// in the math path — so a projection rendered on the server matches the client
// byte for byte and React never flags a hydration mismatch.

import { YieldVenue, findVenue } from "@/lib/yield-venues"

export type HarvestCadence = "daily" | "weekly" | "monthly" | "quarterly"

export const HARVEST_DAYS: Record<HarvestCadence, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  quarterly: 91,
}

export interface RampConfig {
  /** Notional to deploy, in USD. */
  principalUsd: number
  /** Token the user is ramping in from. */
  sourceToken: "USDC" | "USDT" | "SOL"
  venueId: string
  /** Number of DCA tranches. 1 == lump sum. */
  tranches: number
  /** Hours between tranches. */
  intervalHours: number
  /** Share of harvested yield routed to charity, 0-100. */
  donationRatePct: number
  charityId: string
  harvestCadence: HarvestCadence
  /** Projection window. */
  horizonDays: number
}

export const DEFAULT_RAMP: RampConfig = {
  principalUsd: 10_000,
  sourceToken: "USDC",
  venueId: "kamino-usdc",
  tranches: 6,
  intervalHours: 24,
  donationRatePct: 100,
  charityId: "solar-future",
  harvestCadence: "weekly",
  horizonDays: 365,
}

export interface TrancheQuote {
  index: number
  /** Hours from ramp start. */
  offsetHours: number
  /** Day index the tranche lands on, used by the accrual loop. */
  dayIndex: number
  sizeUsd: number
  priceImpactPct: number
  venueFeeUsd: number
  /** Notional actually working in the venue after impact + fees. */
  deployedUsd: number
  route: string[]
}

export interface HarvestRow {
  dayIndex: number
  /** Yield harvested this period, in USD. */
  yieldUsd: number
  donationUsd: number
  compoundedUsd: number
  /** Position value right after the harvest. */
  balanceUsd: number
}

export interface RampProjection {
  config: RampConfig
  venue: YieldVenue
  schedule: TrancheQuote[]
  harvests: HarvestRow[]
  /** Sum of tranche sizes before impact/fees. */
  principalUsd: number
  /** Capital actually working after swap costs. */
  deployedUsd: number
  totalSwapCostUsd: number
  grossYieldUsd: number
  donatedUsd: number
  retainedYieldUsd: number
  finalBalanceUsd: number
  /** Yield as a share of principal over the horizon, annualised. */
  effectiveApyPct: number
  /** Days from first tranche to fully deployed. */
  rampDurationDays: number
}

const USD = (n: number) => Math.round(n * 1e6) / 1e6
/** Aggregates are money the UI prints, so they settle at cent precision. */
const CENTS = (n: number) => Math.round(n * 100) / 100

/**
 * Price impact for a single market order, as a percentage.
 *
 * Square-root impact against venue depth — the standard AMM approximation.
 * Stable pairs are an order of magnitude tighter than volatile ones, which is
 * exactly why the stable leg makes a good ramp target.
 */
export function priceImpactPct(sizeUsd: number, stable: boolean): number {
  if (sizeUsd <= 0) return 0
  const depth = stable ? 4_000_000 : 250_000
  const raw = 100 * Math.sqrt(Math.max(0, sizeUsd) / depth) * (stable ? 0.02 : 0.09)
  return Math.round(Math.min(raw, 5) * 1e4) / 1e4
}

/** Per-day growth rate implied by an APY and its compounding frequency. */
export function dailyRate(apyPct: number, compoundsPerYear: number): number {
  const apy = apyPct / 100
  if (compoundsPerYear <= 0) return apy / 365
  return Math.pow(1 + apy / compoundsPerYear, compoundsPerYear / 365) - 1
}

function routeFor(sourceToken: string, venue: YieldVenue): string[] {
  if (sourceToken === venue.asset) return ["direct-deposit"]
  if (venue.stable) return ["Jupiter", "Orca Whirlpool"]
  return ["Jupiter", "Meteora", venue.protocol]
}

/** Split the principal into evenly spaced tranches and quote each one. */
export function buildRampSchedule(config: RampConfig): TrancheQuote[] {
  const venue = findVenue(config.venueId)
  if (!venue) return []

  const tranches = Math.max(1, Math.floor(config.tranches))
  const intervalHours = Math.max(0, config.intervalHours)
  const slice = config.principalUsd / tranches
  const route = routeFor(config.sourceToken, venue)

  return Array.from({ length: tranches }, (_, i) => {
    const offsetHours = i * intervalHours
    const impact = priceImpactPct(slice, venue.stable)
    const impactCost = (slice * impact) / 100
    const venueFeeUsd = USD((slice * venue.depositFeeBps) / 10_000)
    return {
      index: i,
      offsetHours,
      dayIndex: Math.floor(offsetHours / 24),
      sizeUsd: USD(slice),
      priceImpactPct: impact,
      venueFeeUsd,
      deployedUsd: USD(slice - impactCost - venueFeeUsd),
      route,
    }
  })
}

/**
 * Day-by-day accrual over the horizon.
 *
 * Donations are skimmed at each harvest, so the donated share stops compounding
 * from that day on — the projection reflects the real cost of giving, it does
 * not quietly credit the user with yield they gave away.
 */
export function projectRamp(config: RampConfig): RampProjection | null {
  const venue = findVenue(config.venueId)
  if (!venue) return null

  const schedule = buildRampSchedule(config)
  const horizon = Math.max(1, Math.floor(config.horizonDays))
  const rate = dailyRate(venue.apy, venue.compoundsPerYear)
  const harvestEvery = HARVEST_DAYS[config.harvestCadence]
  const donationShare = Math.min(100, Math.max(0, config.donationRatePct)) / 100

  const depositsByDay = new Map<number, number>()
  for (const t of schedule) {
    depositsByDay.set(t.dayIndex, (depositsByDay.get(t.dayIndex) ?? 0) + t.deployedUsd)
  }

  let balance = 0
  let unharvested = 0
  let grossYield = 0
  let donated = 0
  let retained = 0
  const harvests: HarvestRow[] = []

  for (let day = 0; day <= horizon; day++) {
    balance += depositsByDay.get(day) ?? 0

    if (day > 0) {
      const earned = balance * rate
      unharvested += earned
      grossYield += earned
    }

    const isHarvestDay = day > 0 && day % harvestEvery === 0
    if ((isHarvestDay || day === horizon) && unharvested > 0) {
      const donation = unharvested * donationShare
      const compounded = unharvested - donation
      donated += donation
      retained += compounded
      balance += compounded
      harvests.push({
        dayIndex: day,
        yieldUsd: USD(unharvested),
        donationUsd: USD(donation),
        compoundedUsd: USD(compounded),
        balanceUsd: USD(balance),
      })
      unharvested = 0
    }
  }

  const principalUsd = schedule.reduce((s, t) => s + t.sizeUsd, 0)
  const deployedUsd = schedule.reduce((s, t) => s + t.deployedUsd, 0)
  const lastTranche = schedule[schedule.length - 1]

  return {
    config,
    venue,
    schedule,
    harvests,
    principalUsd: CENTS(principalUsd),
    deployedUsd: CENTS(deployedUsd),
    totalSwapCostUsd: CENTS(principalUsd - deployedUsd),
    grossYieldUsd: CENTS(grossYield),
    donatedUsd: CENTS(donated),
    retainedYieldUsd: CENTS(retained),
    finalBalanceUsd: CENTS(balance),
    effectiveApyPct:
      principalUsd > 0
        ? Math.round((grossYield / principalUsd) * (365 / horizon) * 100 * 100) / 100
        : 0,
    rampDurationDays: lastTranche ? Math.round((lastTranche.offsetHours / 24) * 100) / 100 : 0,
  }
}

export interface RampComparison {
  ramped: RampProjection
  lumpSum: RampProjection
  /** Swap cost saved by splitting the order (positive = ramp is cheaper). */
  impactSavedUsd: number
  /** Yield given up by deploying late (positive = ramp earns less). */
  yieldForgoneUsd: number
  /** Net of the two. Positive means ramping wins over this horizon. */
  netAdvantageUsd: number
}

/** The honest ramp-vs-lump-sum tradeoff: cheaper fills against delayed yield. */
export function compareRampToLumpSum(config: RampConfig): RampComparison | null {
  const ramped = projectRamp(config)
  const lumpSum = projectRamp({ ...config, tranches: 1, intervalHours: 0 })
  if (!ramped || !lumpSum) return null

  const impactSavedUsd = CENTS(lumpSum.totalSwapCostUsd - ramped.totalSwapCostUsd)
  const yieldForgoneUsd = CENTS(lumpSum.grossYieldUsd - ramped.grossYieldUsd)
  return {
    ramped,
    lumpSum,
    impactSavedUsd,
    yieldForgoneUsd,
    netAdvantageUsd: CENTS(impactSavedUsd - yieldForgoneUsd),
  }
}

/** What the charity receives per period, for the impact readout. */
export function donationCadence(projection: RampProjection) {
  const perYear = projection.donatedUsd * (365 / projection.config.horizonDays)
  return {
    perHarvest: projection.harvests.length
      ? CENTS(projection.donatedUsd / projection.harvests.length)
      : 0,
    perMonth: CENTS(perYear / 12),
    perYear: CENTS(perYear),
    harvestCount: projection.harvests.length,
  }
}

export function formatUsd(n: number, digits = 2): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}
