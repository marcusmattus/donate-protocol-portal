import { NextRequest, NextResponse } from "next/server"
import { WebhookPayload } from "@/lib/types"
import { DEMO_PORTFOLIOS, getStrategyById, getCharityById } from "@/lib/seed-data"

// In-memory storage for demo
let tradeSignals: any[] = []
let donationEvents: any[] = []

// Simulate trade execution and donation trigger
async function processTradeSignal(payload: WebhookPayload) {
  const signal = {
    id: `trade-${Date.now()}`,
    symbol: payload.symbol,
    side: payload.side,
    price: parseFloat(payload.price),
    strategy: payload.strategy,
    timestamp: payload.timestamp || new Date().toISOString(),
    status: "pending",
  }

  tradeSignals.push(signal)

  // Simulate execution with realistic PnL
  const simulatedPnL =
    Math.random() > 0.3
      ? Math.abs(Math.random() * 2000 - 500) // Profit between 0-2000
      : -Math.abs(Math.random() * 500) // 30% chance of loss up to -500

  signal.status = simulatedPnL > 0 ? "executed" : "executed"
  signal.pnl = simulatedPnL

  // If profitable, trigger donation
  if (simulatedPnL > 0) {
    const strategy = getStrategyById(payload.strategy)
    if (strategy) {
      const donationAmount = simulatedPnL * (strategy.donationRate / 100)

      // Route to first charity followed by first portfolio user
      const firstUser = Object.values(DEMO_PORTFOLIOS)[0]
      if (
        firstUser &&
        firstUser.followedCharities &&
        firstUser.followedCharities.length > 0
      ) {
        const charityId = firstUser.followedCharities[0]
        const charity = getCharityById(charityId)

        if (charity) {
          const donation = {
            id: `donation-${Date.now()}`,
            tradeId: signal.id,
            fromWallet: firstUser.walletAddress,
            charityId: charityId,
            amount: donationAmount,
            percentage: strategy.donationRate,
            timestamp: new Date().toISOString(),
          }

          donationEvents.push(donation)

          return {
            signal,
            donation,
            success: true,
          }
        }
      }
    }
  }

  return {
    signal,
    success: true,
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload: WebhookPayload = await request.json()

    // Validate required fields
    if (!payload.symbol || !payload.side || !payload.price || !payload.strategy) {
      return NextResponse.json(
        { error: "Missing required fields: symbol, side, price, strategy" },
        { status: 400 }
      )
    }

    // Process the trade signal
    const result = await processTradeSignal(payload)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({
    recentSignals: tradeSignals.slice(-10).reverse(),
    recentDonations: donationEvents.slice(-10).reverse(),
    totalSignalsProcessed: tradeSignals.length,
    totalDonationsTriggered: donationEvents.length,
  })
}
