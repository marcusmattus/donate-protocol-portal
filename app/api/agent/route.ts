import { NextRequest, NextResponse } from "next/server"
import { DEMO_CHARITIES, DEMO_USERS, DEMO_STRATEGIES } from "@/lib/seed-data"

/**
 * Agent Signal Processing Endpoint
 * Receives TradingView signals and processes them through the OpenClaw agent
 */

interface TradeSignal {
  symbol: string
  side: "BUY" | "SELL"
  price: string
  strategy: string
  timestamp?: string
}

interface AgentAnalysis {
  signal: TradeSignal
  riskScore: "LOW" | "MEDIUM" | "HIGH"
  confidence: number
  estimatedProfit: number
  recommendation: "EXECUTE" | "HOLD" | "ABORT"
  linkedCharity?: typeof DEMO_CHARITIES[0]
  donationAmount?: number
}

/**
 * GET /api/agent/status
 * Returns agent operational status
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get("action")
  const userId = searchParams.get("userId")

  // Status endpoint
  if (!action) {
    return NextResponse.json({
      status: "operational",
      version: "1.0.0",
      connectedStrategies: DEMO_STRATEGIES.length,
      activeChariies: DEMO_CHARITIES.length,
      lastSignalProcessed: new Date(Date.now() - 60000).toISOString(),
    })
  }

  // Get user's linked charities
  if (action === "charities" && userId) {
    const user = DEMO_USERS.find((u) => u.id === userId)
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const primaryCharity = DEMO_CHARITIES.find(
      (c) => c.id === user.followedCharities?.[0]
    )
    const backupCharities = DEMO_CHARITIES.filter((c) =>
      user.followedCharities?.includes(c.id)
    )

    return NextResponse.json({
      userId,
      primaryCharity,
      backupCharities,
      donationRate: 0.02, // 2% of profits
    })
  }

  // Get recommendations
  if (action === "recommend" && userId) {
    const charities = DEMO_CHARITIES.sort(
      (a, b) => b.followers - a.followers
    ).slice(0, 5)

    return NextResponse.json({
      userId,
      recommendations: charities,
      reason: "Popular with traders similar to you",
    })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}

/**
 * POST /api/agent/signal
 * Receive and process a trading signal
 */
export async function POST(request: NextRequest) {
  try {
    const body: TradeSignal = await request.json()

    const { symbol, side, price, strategy } = body

    // Validate signal
    if (!symbol || !side || !price || !strategy) {
      return NextResponse.json(
        { error: "Missing required fields: symbol, side, price, strategy" },
        { status: 400 }
      )
    }

    if (!["BUY", "SELL"].includes(side)) {
      return NextResponse.json(
        { error: "Invalid side: must be BUY or SELL" },
        { status: 400 }
      )
    }

    // Find strategy
    const strategyData = DEMO_STRATEGIES.find(
      (s) => s.name.toLowerCase() === strategy.toLowerCase()
    )

    if (!strategyData) {
      return NextResponse.json(
        { error: `Strategy not found: ${strategy}` },
        { status: 404 }
      )
    }

    // Simulate agent analysis
    const analysis = simulateAgentAnalysis({
      symbol,
      side,
      price,
      strategy,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      signal: body,
      analysis,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Agent signal error:", error)
    return NextResponse.json(
      { error: "Failed to process signal" },
      { status: 500 }
    )
  }
}

/**
 * Simulate OpenClaw agent analysis
 */
function simulateAgentAnalysis(signal: TradeSignal): AgentAnalysis {
  // Generate realistic metrics based on strategy
  const strategy = DEMO_STRATEGIES.find(
    (s) => s.name.toLowerCase() === signal.strategy.toLowerCase()
  )

  // Calculate risk score
  let riskScore: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM"
  let confidence = 0.75

  // Simulate based on strategy win rate
  if (strategy) {
    if (strategy.winRate > 75) {
      riskScore = "LOW"
      confidence = 0.85
    } else if (strategy.winRate < 65) {
      riskScore = "HIGH"
      confidence = 0.65
    }
  }

  // Estimate profit (range $50-$500)
  const baseProfit = Math.random() * 450 + 50
  const estimatedProfit = parseFloat(baseProfit.toFixed(2))

  // Select random charity for routing
  const linkedCharity = DEMO_CHARITIES[Math.floor(Math.random() * DEMO_CHARITIES.length)]
  const donationAmount = parseFloat((estimatedProfit * 0.02).toFixed(2)) // 2% donation rate

  return {
    signal,
    riskScore,
    confidence,
    estimatedProfit,
    recommendation:
      confidence > 0.8 && riskScore === "LOW"
        ? "EXECUTE"
        : confidence > 0.7
          ? "HOLD"
          : "ABORT",
    linkedCharity,
    donationAmount,
  }
}
