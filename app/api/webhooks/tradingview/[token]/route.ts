import { NextRequest, NextResponse } from "next/server"
import { CHARITIES, RECENT_SIGNALS, STRATEGIES, TradeSignal } from "@/lib/demo-data"
import { runRiskCheck, simulateTradeAndDonation, generateDemoTx } from "@/lib/solana"

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

export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  return NextResponse.json({ webhook: token, accepts: "POST application/json", validTokens: [...VALID_TOKENS] })
}
