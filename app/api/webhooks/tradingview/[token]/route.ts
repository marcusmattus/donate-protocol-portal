import { NextRequest, NextResponse } from "next/server"
import { ingestTradingViewWebhook } from "@/lib/tradingview"

type RouteContext = { params: Promise<{ token: string }> }

/**
 * POST /api/webhooks/tradingview/:token
 * Token-scoped TradingView alert webhook ingestion.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params
    const payload = await request.json()

    const result = ingestTradingViewWebhook({
      token,
      payload,
      source: "webhook",
    })

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, event: result.event },
        { status: result.status }
      )
    }

    return NextResponse.json(
      {
        success: true,
        signal: result.signal,
        donation: result.donation,
        tradeSignal: result.tradeSignal,
        connection: result.connection,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("TradingView webhook error:", error)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { token } = await context.params
  return NextResponse.json({
    ok: true,
    endpoint: `/api/webhooks/tradingview/${token}`,
    message: "POST TradingView alert JSON to this URL",
  })
}
