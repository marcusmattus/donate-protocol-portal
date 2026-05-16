import { NextRequest, NextResponse } from "next/server"
import { CHARITIES, STRATEGIES, findStrategy } from "@/lib/demo-data"
import { mockJupiterQuote, runRiskCheck, simulateTradeAndDonation } from "@/lib/solana"

// OpenClaw agent simulation endpoint.
// Accepts a signal payload and walks the full agent pipeline,
// returning each step's output for live dashboard streaming.

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const symbol = String(body.symbol ?? "SOLUSDT").toUpperCase()
  const side = (String(body.side ?? "BUY").toUpperCase() === "SELL" ? "SELL" : "BUY") as "BUY" | "SELL"
  const price = Number(body.price ?? 180)
  const size = Number(body.size ?? 10)
  const strategyId = String(body.strategyId ?? "momentum-alpha")
  const charityId = String(body.charityId ?? "solar-future")

  const strategy = findStrategy(strategyId) ?? STRATEGIES[0]
  const charity = CHARITIES.find((c) => c.id === charityId) ?? CHARITIES[0]

  const steps: { step: string; status: "ok" | "warn" | "fail"; data: unknown }[] = []

  steps.push({ step: "ingest_signal", status: "ok", data: { symbol, side, price, size, strategy: strategy.name } })

  const risk = runRiskCheck({ symbol, side, size, price })
  steps.push({ step: "risk_check", status: risk.ok ? "ok" : "fail", data: risk })
  if (!risk.ok) {
    return NextResponse.json({ ok: false, steps })
  }

  const quote = mockJupiterQuote({ inMint: "So11111111111111111111111111111111111111112", outMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", inAmount: size })
  steps.push({ step: "jupiter_quote", status: "ok", data: quote })

  const trade = simulateTradeAndDonation({ symbol, side, price, size, donationRatePct: strategy.donationRate, charityName: charity.name, charityWallet: charity.wallet })
  steps.push({ step: "submit_trade", status: "ok", data: trade })

  steps.push({
    step: "trigger_donation",
    status: "ok",
    data: {
      amount: trade.donationAmount,
      to: charity.name,
      wallet: charity.wallet,
      txSignature: trade.txSignature,
    },
  })

  steps.push({
    step: "publish_dashboard",
    status: "ok",
    data: { broadcasted: true, room: "global", topic: "trade.completed" },
  })

  steps.push({
    step: "notify_telegram",
    status: "ok",
    data: {
      message: `Trade executed: ${symbol} ${side} · profit $${trade.pnl.toFixed(2)} · donated $${trade.donationAmount.toFixed(2)} → ${charity.name}`,
    },
  })

  return NextResponse.json({ ok: true, steps, trade, donation: { to: charity.name, amount: trade.donationAmount, wallet: charity.wallet, tx: trade.txSignature } })
}
