import { NextRequest, NextResponse } from "next/server"
import {
  DEFAULT_RAMP,
  HARVEST_DAYS,
  HarvestCadence,
  RampConfig,
  compareRampToLumpSum,
  donationCadence,
} from "@/lib/charity-ramp"
import { YIELD_VENUES, findVenue } from "@/lib/yield-venues"
import { CHARITIES, findCharity } from "@/lib/demo-data"
import { addRampPosition, listRampPositions, RampPosition } from "@/lib/ramp-store"
import { generateDemoTx } from "@/lib/solana"

function coerceConfig(body: Record<string, unknown>): RampConfig {
  const cadence = String(body.harvestCadence ?? DEFAULT_RAMP.harvestCadence)
  const num = (v: unknown, fallback: number) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
  }
  return {
    principalUsd: Math.min(10_000_000, Math.max(1, num(body.principalUsd, DEFAULT_RAMP.principalUsd))),
    sourceToken: body.sourceToken === "SOL" || body.sourceToken === "USDT" ? body.sourceToken : "USDC",
    venueId: findVenue(String(body.venueId ?? "")) ? String(body.venueId) : DEFAULT_RAMP.venueId,
    tranches: Math.min(52, Math.max(1, Math.floor(num(body.tranches, DEFAULT_RAMP.tranches)))),
    intervalHours: Math.min(720, Math.max(0, num(body.intervalHours, DEFAULT_RAMP.intervalHours))),
    donationRatePct: Math.min(100, Math.max(0, num(body.donationRatePct, DEFAULT_RAMP.donationRatePct))),
    charityId: findCharity(String(body.charityId ?? "")) ? String(body.charityId) : DEFAULT_RAMP.charityId,
    harvestCadence: (cadence in HARVEST_DAYS ? cadence : DEFAULT_RAMP.harvestCadence) as HarvestCadence,
    horizonDays: Math.min(1825, Math.max(7, Math.floor(num(body.horizonDays, DEFAULT_RAMP.horizonDays)))),
  }
}

/** Catalog + open positions, for the ramp console to hydrate from. */
export async function GET() {
  return NextResponse.json({
    venues: YIELD_VENUES,
    charities: CHARITIES.map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      wallet: c.wallet,
      verified: c.verified,
      impactScore: c.impactScore,
    })),
    defaults: DEFAULT_RAMP,
    positions: listRampPositions(),
  })
}

/**
 * POST { action: "quote" }   -> projection + lump-sum comparison, no state change
 * POST { action: "execute" } -> opens a simulated ramp position
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 })
  }

  const action = String(body.action ?? "quote")
  const config = coerceConfig(body)
  const comparison = compareRampToLumpSum(config)
  if (!comparison) {
    return NextResponse.json({ error: "unknown venue" }, { status: 400 })
  }

  const projection = comparison.ramped

  if (action === "quote") {
    return NextResponse.json({
      ok: true,
      projection,
      cadence: donationCadence(projection),
      comparison: {
        impactSavedUsd: comparison.impactSavedUsd,
        yieldForgoneUsd: comparison.yieldForgoneUsd,
        netAdvantageUsd: comparison.netAdvantageUsd,
        lumpSumSwapCostUsd: comparison.lumpSum.totalSwapCostUsd,
        lumpSumGrossYieldUsd: comparison.lumpSum.grossYieldUsd,
      },
    })
  }

  if (action === "execute") {
    const charity = findCharity(config.charityId)
    if (!charity) {
      return NextResponse.json({ error: "unknown charity" }, { status: 400 })
    }

    const position: RampPosition = addRampPosition({
      id: `ramp-${Date.now()}`,
      createdAt: Date.now(),
      config,
      venueName: projection.venue.name,
      charityName: charity.name,
      charityWallet: charity.wallet,
      status: config.tranches > 1 ? "ramping" : "active",
      filled: 1,
      depositSignatures: [generateDemoTx("Ramp")],
      donatedToDateUsd: 0,
      projection: {
        deployedUsd: projection.deployedUsd,
        grossYieldUsd: projection.grossYieldUsd,
        donatedUsd: projection.donatedUsd,
        finalBalanceUsd: projection.finalBalanceUsd,
        effectiveApyPct: projection.effectiveApyPct,
      },
    })

    return NextResponse.json({
      ok: true,
      position,
      firstTranche: projection.schedule[0],
      nextTrancheAt:
        projection.schedule.length > 1
          ? Date.now() + projection.schedule[1].offsetHours * 3_600_000
          : null,
      projection,
      cadence: donationCadence(projection),
    })
  }

  return NextResponse.json({ error: `unknown action: ${action}` }, { status: 400 })
}
