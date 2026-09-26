import { NextRequest, NextResponse } from "next/server"
import { WebhookPayload } from "@/lib/types"
import { DEMO_PORTFOLIOS, getStrategyById, getCharityById } from "@/lib/seed-data"
import { authorizeWebhook } from "@/lib/pipeline/webhook-tokens"
import * as audit from "@/lib/pipeline/audit"

// This route has no `:token` path segment, so the token arrives as the
// x-webhook-token header, an Authorization: Bearer value, or ?token=.
// It previously had no authentication at all: any caller could post a payload
// and it would simulate a trade and emit a donation event.
//
// Prefer /api/webhooks/tradingview/alert/:token for anything new — it runs the
// full verify → deduplicate → normalize → risk → intent pipeline. This route is
// kept because demo-test.js and the quickstart docs target it, and it is now
// gated by the same tokens as its siblings.

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
  const correlationId = audit.newCorrelationId("tv_legacy")

  const auth = authorizeWebhook(request)
  if (!auth.ok) {
    audit.append({
      correlationId,
      stage: "tradingview.webhook",
      outcome: "rejected",
      userId: "unauthenticated",
      summary: `legacy webhook rejected: ${auth.rejection}`,
      detail: { route: "/api/webhooks/tradingview", rejection: auth.rejection },
    })
    return NextResponse.json(
      { error: auth.message, rejected: auth.rejection },
      { status: auth.status ?? 401 }
    )
  }

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

    audit.append({
      correlationId,
      stage: "tradingview.webhook",
      outcome: "ok",
      userId: "legacy-webhook",
      summary: `legacy webhook processed ${payload.symbol} ${payload.side}`,
      detail: {
        route: "/api/webhooks/tradingview",
        symbol: payload.symbol,
        side: payload.side,
        strategy: payload.strategy,
        donationTriggered: Boolean((result as { donation?: unknown }).donation),
      },
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

/**
 * Signal and donation history.
 *
 * Gated too: the response carries wallet addresses and donation amounts, so an
 * open GET leaked the activity of everyone the route had processed.
 */
export async function GET(request: NextRequest) {
  const auth = authorizeWebhook(request)
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.message, rejected: auth.rejection },
      { status: auth.status ?? 401 }
    )
  }

  return NextResponse.json({
    recentSignals: tradeSignals.slice(-10).reverse(),
    recentDonations: donationEvents.slice(-10).reverse(),
    totalSignalsProcessed: tradeSignals.length,
    totalDonationsTriggered: donationEvents.length,
  })
}
