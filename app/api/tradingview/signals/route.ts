import { NextRequest, NextResponse } from "next/server"
import { getRecentTradingViewSignals, getTradingViewSnapshot } from "@/lib/tradingview"

/**
 * GET /api/tradingview/signals
 * Recent TradingView-normalized signals for the dashboard feed.
 */
export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit")
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 25, 100) : 25
  const snapshot = getTradingViewSnapshot()

  return NextResponse.json({
    signals: getRecentTradingViewSignals(limit),
    connection: snapshot.connection,
    recentEvents: snapshot.recentEvents.slice(0, limit),
    recentActions: snapshot.recentActions.slice(0, limit),
  })
}
