import { NextRequest, NextResponse } from "next/server"
import { CHARITIES, RECENT_SIGNALS, STRATEGIES, TradeSignal, findCharity } from "@/lib/demo-data"
import { runRiskCheck, simulateTradeAndDonation, generateDemoTx } from "@/lib/solana"
import { findRampPosition, openRamps, recordRampFill } from "@/lib/ramp-store"
import { buildRampSchedule } from "@/lib/charity-ramp"

const VALID_TOKENS = new Set(["demo123", "demo456"])

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params
  if (!VALID_TOKENS.has(token)) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 })
  }

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 })
  }

  // A TradingView alert can drive the Charity Swap Ramp instead of a trade:
  // set {"action":"ramp"} on the alert and each fire deploys the next tranche,
  // so the DCA schedule follows your chart signal rather than a wall clock.
  if (String(payload.action ?? "trade").toLowerCase() === "ramp") {
    return NextResponse.json(handleRampAlert(payload))
  }

  const symbol = String(payload.symbol ?? "SOLUSDT").toUpperCase()
  const side = (String(payload.side ?? "BUY").toUpperCase() === "SELL" ? "SELL" : "BUY") as "BUY" | "SELL"
  const price = Number(payload.price ?? 180)
  const size = Number(payload.size ?? 10)
  const strategyName = String(payload.strategy ?? "Momentum Alpha")
  const strategy = STRATEGIES.find((s) => s.name.toLowerCase() === strategyName.toLowerCase()) ?? STRATEGIES[0]

  const risk = runRiskCheck({ symbol, side, size, price })
  const charity = CHARITIES[Math.floor(Math.random() * CHARITIES.length)]

  const signal: TradeSignal = {
    id: `sig-${Date.now()}`,
    ts: Date.now(),
    symbol,
    side,
    price,
    size,
    strategy: strategy.name,
    source: "tradingview",
    status: "queued",
  }

  if (!risk.ok) {
    signal.status = "failed"
    RECENT_SIGNALS.unshift(signal)
    return NextResponse.json({ ok: false, risk, signal })
  }

  const result = simulateTradeAndDonation({
    symbol,
    side,
    price,
    size,
    donationRatePct: strategy.donationRate,
    charityName: charity.name,
    charityWallet: charity.wallet,
  })

  signal.status = "complete"
  signal.pnl = result.pnl
  signal.donationAmount = result.donationAmount
  signal.donationDestination = result.donationDestination
  signal.txSignature = result.txSignature

  RECENT_SIGNALS.unshift(signal)

  return NextResponse.json({
    ok: true,
    risk,
    signal,
    trade: result,
    donation: {
      txSignature: result.txSignature,
      to: charity.name,
      wallet: charity.wallet,
      amount: result.donationAmount,
    },
    correlationId: generateDemoTx("Corr"),
  })
}

/**
 * Advance a ramp position by one tranche.
 *
 * Targets `payload.rampId` when given, otherwise the oldest position still
 * ramping in. Returns ok:false (not an error status) when there is nothing to
 * fill, so a recurring TradingView alert on a finished ramp stays quiet.
 */
function handleRampAlert(payload: Record<string, unknown>) {
  const requestedId = payload.rampId ? String(payload.rampId) : undefined
  const target = requestedId ? findRampPosition(requestedId) : openRamps()[0]

  if (!target) {
    return {
      ok: false,
      action: "ramp",
      reason: requestedId ? `no ramp position ${requestedId}` : "no ramp position is still ramping in",
    }
  }

  const filled = recordRampFill(target.id)
  if (!filled) {
    return { ok: false, action: "ramp", reason: `ramp ${target.id} is already fully deployed` }
  }

  const schedule = buildRampSchedule(filled.config)
  const tranche = schedule[filled.filled - 1] ?? schedule[schedule.length - 1]
  const charity = findCharity(filled.config.charityId)

  return {
    ok: true,
    action: "ramp",
    rampId: filled.id,
    status: filled.status,
    tranche: {
      index: filled.filled,
      of: filled.config.tranches,
      sizeUsd: tranche?.sizeUsd ?? 0,
      deployedUsd: tranche?.deployedUsd ?? 0,
      priceImpactPct: tranche?.priceImpactPct ?? 0,
      route: tranche?.route ?? [],
    },
    venue: filled.venueName,
    txSignature: filled.depositSignatures[filled.depositSignatures.length - 1],
    beneficiary: { name: filled.charityName, wallet: charity?.wallet ?? filled.charityWallet },
    correlationId: generateDemoTx("Corr"),
  }
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  return NextResponse.json({ webhook: token, accepts: "POST application/json", validTokens: [...VALID_TOKENS] })
}
