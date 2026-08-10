import { NextRequest, NextResponse } from "next/server"
import {
  activateTradingViewConnection,
  getTradingViewSnapshot,
  markSetupStep,
  resetTradingViewConnection,
  simulateTradingViewTestSignal,
  type TradingViewSetupStepId,
} from "@/lib/tradingview"

/**
 * GET /api/tradingview/connection
 * Dashboard + connect-page source of truth snapshot.
 */
export async function GET() {
  return NextResponse.json(getTradingViewSnapshot())
}

/**
 * POST /api/tradingview/connection
 * Actions: test | activate | mark_step | reset | track_action
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body?.action as string | undefined

    if (action === "test" || action === "simulate") {
      const result = simulateTradingViewTestSignal(body?.payload)
      return NextResponse.json(
        {
          success: result.ok,
          signal: result.signal,
          donation: result.donation,
          connection: result.connection,
          event: result.event,
          error: result.error,
        },
        { status: result.ok ? 200 : result.status }
      )
    }

    if (action === "activate") {
      const connection = activateTradingViewConnection()
      return NextResponse.json({ success: true, connection, snapshot: getTradingViewSnapshot() })
    }

    if (action === "mark_step") {
      const stepId = body?.stepId as TradingViewSetupStepId | undefined
      if (!stepId) {
        return NextResponse.json({ error: "stepId required" }, { status: 400 })
      }
      const connection = markSetupStep(stepId, body?.completed !== false)
      return NextResponse.json({ success: true, connection, snapshot: getTradingViewSnapshot() })
    }

    if (action === "reset") {
      const connection = resetTradingViewConnection()
      return NextResponse.json({ success: true, connection, snapshot: getTradingViewSnapshot() })
    }

    return NextResponse.json(
      { error: "Unknown action. Use test | activate | mark_step | reset" },
      { status: 400 }
    )
  } catch (error) {
    console.error("TradingView connection API error:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
