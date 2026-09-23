import { NextRequest, NextResponse } from "next/server"
import * as tools from "@/lib/agent-tools/market-intelligence"
import { currentUserId } from "@/lib/pipeline/current-user"
import * as audit from "@/lib/pipeline/audit"

/**
 * Read-only TradingView intelligence for the dashboard and agent layer.
 *
 * Every response says where its data came from ("live" | "cache" | "stale" |
 * "unavailable") so the UI can label degraded panels rather than presenting old
 * numbers as current.
 */
const HANDLERS = {
  search: (ctx: tools.ToolContext, p: Record<string, unknown>) =>
    tools.search_market_symbols(ctx, { query: String(p.query ?? ""), limit: Number(p.limit ?? 20) }),
  bars: (ctx: tools.ToolContext, p: Record<string, unknown>) =>
    tools.get_market_bars(ctx, { symbol: String(p.symbol ?? ""), interval: p.interval ? String(p.interval) : undefined, bars: Number(p.bars ?? 300) }),
  screen: (ctx: tools.ToolContext, p: Record<string, unknown>) =>
    tools.screen_markets(ctx, (p.query as tools.ScreenerQuery) ?? {}),
  screener_columns: (ctx: tools.ToolContext, p: Record<string, unknown>) =>
    tools.get_screener_columns(ctx, { instrumentType: p.instrumentType ? String(p.instrumentType) : undefined }),
  technical: (ctx: tools.ToolContext, p: Record<string, unknown>) =>
    tools.get_technical_context(ctx, { symbol: String(p.symbol ?? ""), interval: p.interval ? String(p.interval) : undefined }),
  news: (ctx: tools.ToolContext, p: Record<string, unknown>) =>
    tools.get_market_news(ctx, { symbol: String(p.symbol ?? ""), limit: Number(p.limit ?? 10) }),
  fundamentals: (ctx: tools.ToolContext, p: Record<string, unknown>) =>
    tools.get_fundamentals(ctx, { symbol: String(p.symbol ?? "") }),
  forecasts: (ctx: tools.ToolContext, p: Record<string, unknown>) =>
    tools.get_forecasts(ctx, { symbol: String(p.symbol ?? "") }),
  economic_calendar: (ctx: tools.ToolContext) => tools.get_economic_events(ctx, {}),
  earnings_calendar: (ctx: tools.ToolContext, p: Record<string, unknown>) =>
    tools.get_earnings_events(ctx, { symbol: p.symbol ? String(p.symbol) : undefined }),
  watchlists: (ctx: tools.ToolContext) => tools.get_tradingview_watchlists(ctx),
  alerts: (ctx: tools.ToolContext) => tools.get_tradingview_alerts(ctx),
  market_context: (ctx: tools.ToolContext, p: Record<string, unknown>) =>
    tools.build_market_context(ctx, { symbol: String(p.symbol ?? ""), interval: p.interval ? String(p.interval) : undefined, includeNews: Boolean(p.includeNews) }),
  research: (ctx: tools.ToolContext, p: Record<string, unknown>) =>
    tools.research_instrument(ctx, { symbol: String(p.symbol ?? "") }),
} as const

type Op = keyof typeof HANDLERS

export async function POST(req: NextRequest) {
  const userId = currentUserId(req)
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 })
  }

  const op = String((body as Record<string, unknown>).op ?? "") as Op
  const handler = HANDLERS[op]
  if (!handler) {
    return NextResponse.json(
      { error: `unknown op: ${op}`, supported: Object.keys(HANDLERS) },
      { status: 400 }
    )
  }

  const correlationId =
    typeof (body as Record<string, unknown>).correlationId === "string"
      ? String((body as Record<string, unknown>).correlationId)
      : audit.newCorrelationId("tv_intel")

  const ctx: tools.ToolContext = { userId, correlationId, reason: `dashboard:${op}` }
  const params = ((body as Record<string, unknown>).params as Record<string, unknown>) ?? {}

  try {
    const result = await handler(ctx, params)
    return NextResponse.json({ ok: true, op, correlationId, result })
  } catch (e) {
    return NextResponse.json(
      { ok: false, op, correlationId, error: e instanceof Error ? e.message : "intelligence request failed" },
      { status: 502 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    ops: Object.keys(HANDLERS),
    usage: 'POST { "op": "technical", "params": { "symbol": "BINANCE:BTCUSDT" } }',
  })
}
