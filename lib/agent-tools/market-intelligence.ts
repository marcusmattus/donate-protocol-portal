/**
 * Donate Protocol agent tools over TradingView MCP.
 *
 * These are the higher-level, permissioned tools the agent layer exposes. They
 * orchestrate official TradingView capabilities — they do not reimplement
 * TradingView's data infrastructure, and they do not cache or store market data
 * beyond the connector's own TTL cache.
 *
 * Every tool takes a correlation ID so its MCP calls land in the audit trail of
 * the signal or request that caused them. None of these tools can place an
 * order; `build_market_context` and `research_instrument` return context for
 * the Risk Engine to judge, never a decision.
 */

import { invoke, InvokeResult, TradingViewUnavailableError } from "@/lib/tradingview/connector"
import { PRIORITY } from "@/lib/tradingview/catalog"
import { normalizeSymbol, normalizeInterval, TvInterval } from "@/lib/tradingview/symbols"
import type { CalendarEvent } from "@/lib/pipeline/risk-engine"
import * as audit from "@/lib/pipeline/audit"

export interface ToolContext {
  userId: string
  correlationId: string
  /** Why the agent is calling; recorded in the audit trail. */
  reason?: string
}

/** Uniform envelope so agents can always tell live data from degraded data. */
export interface ToolResult<T> {
  ok: boolean
  data: T | null
  source: "live" | "cache" | "stale" | "unavailable"
  ageMs?: number
  error?: string
  correlationId: string
}

function wrap<T>(r: InvokeResult<T>): ToolResult<T> {
  return { ok: true, data: r.data, source: r.source, ageMs: r.ageMs, correlationId: r.correlationId }
}

function fail<T>(e: unknown, correlationId: string): ToolResult<T> {
  const message =
    e instanceof TradingViewUnavailableError ? e.message : e instanceof Error ? e.message : "unknown error"
  return { ok: false, data: null, source: "unavailable", error: message, correlationId }
}

// ── Market data ─────────────────────────────────────────────────────────────

export async function search_market_symbols(
  ctx: ToolContext,
  params: { query: string; instrumentType?: string; limit?: number }
): Promise<ToolResult<unknown>> {
  try {
    return wrap(
      await invoke(ctx.userId, "search_symbols", {
        query: params.query,
        type: params.instrumentType,
        limit: Math.min(100, params.limit ?? 20),
      }, { correlationId: ctx.correlationId, reason: ctx.reason, priority: PRIORITY.INTERACTIVE })
    )
  } catch (e) {
    return fail(e, ctx.correlationId)
  }
}

export async function get_market_bars(
  ctx: ToolContext,
  params: { symbol: string; interval?: string; bars?: number }
): Promise<ToolResult<unknown>> {
  const symbol = normalizeSymbol(params.symbol)
  const interval: TvInterval = normalizeInterval(params.interval)
  try {
    return wrap(
      await invoke(ctx.userId, "get_bars", {
        symbol: symbol.tv,
        interval,
        // Bounded so a runaway agent cannot request an unbounded history.
        n_bars: Math.min(5_000, Math.max(1, params.bars ?? 300)),
      }, { correlationId: ctx.correlationId, reason: ctx.reason, priority: PRIORITY.STRATEGY })
    )
  } catch (e) {
    return fail(e, ctx.correlationId)
  }
}

// ── Screener ────────────────────────────────────────────────────────────────

export interface ScreenerQuery {
  market?: string
  filters?: { column: string; operation: string; value: unknown }[]
  sortBy?: { column: string; ascending?: boolean }
  columns?: string[]
  limit?: number
  preset?: string
}

/**
 * Run a screener query.
 *
 * The exact query is returned alongside the rows and written to the audit
 * trail: when a screener result later becomes a signal, the parameters that
 * produced it have to be reconstructable, not merely plausible.
 */
export async function screen_markets(
  ctx: ToolContext,
  query: ScreenerQuery
): Promise<ToolResult<unknown> & { query: ScreenerQuery }> {
  const bounded: ScreenerQuery = { ...query, limit: Math.min(500, Math.max(1, query.limit ?? 50)) }
  try {
    const r = await invoke(ctx.userId, "screen", {
      market: bounded.market ?? "crypto",
      filters: bounded.filters ?? [],
      sort: bounded.sortBy,
      columns: bounded.columns,
      range: [0, bounded.limit],
      preset: bounded.preset,
    }, { correlationId: ctx.correlationId, reason: ctx.reason, priority: PRIORITY.STRATEGY })

    audit.append({
      correlationId: ctx.correlationId,
      stage: "market_intelligence",
      outcome: r.source === "stale" ? "degraded" : "ok",
      userId: ctx.userId,
      summary: `screener returned results for ${bounded.market ?? "crypto"}`,
      detail: { query: bounded, source: r.source },
    })

    return { ...wrap(r), query: bounded }
  } catch (e) {
    return { ...fail(e, ctx.correlationId), query: bounded }
  }
}

export async function get_screener_columns(
  ctx: ToolContext,
  params: { instrumentType?: string } = {}
): Promise<ToolResult<unknown>> {
  try {
    return wrap(
      await invoke(ctx.userId, "screener_columns", { type: params.instrumentType ?? "crypto" }, {
        correlationId: ctx.correlationId, reason: ctx.reason, priority: PRIORITY.INTERACTIVE,
      })
    )
  } catch (e) {
    return fail(e, ctx.correlationId)
  }
}

// ── Technical ───────────────────────────────────────────────────────────────

export async function get_technical_context(
  ctx: ToolContext,
  params: { symbol: string; interval?: string }
): Promise<ToolResult<unknown>> {
  const symbol = normalizeSymbol(params.symbol)
  try {
    return wrap(
      await invoke(ctx.userId, "technical_rating", {
        symbol: symbol.tv,
        interval: normalizeInterval(params.interval, "60"),
      }, { correlationId: ctx.correlationId, reason: ctx.reason, priority: PRIORITY.RISK })
    )
  } catch (e) {
    return fail(e, ctx.correlationId)
  }
}

// ── News ────────────────────────────────────────────────────────────────────

export async function get_market_news(
  ctx: ToolContext,
  params: { symbol: string; limit?: number }
): Promise<ToolResult<unknown>> {
  const symbol = normalizeSymbol(params.symbol)
  try {
    return wrap(
      await invoke(ctx.userId, "news_list", {
        symbol: symbol.tv,
        limit: Math.min(50, params.limit ?? 10),
      }, { correlationId: ctx.correlationId, reason: ctx.reason, priority: PRIORITY.RESEARCH })
    )
  } catch (e) {
    return fail(e, ctx.correlationId)
  }
}

export async function get_news_story(
  ctx: ToolContext,
  params: { storyId: string }
): Promise<ToolResult<unknown>> {
  try {
    return wrap(
      await invoke(ctx.userId, "news_story", { id: params.storyId }, {
        correlationId: ctx.correlationId, reason: ctx.reason, priority: PRIORITY.RESEARCH,
      })
    )
  } catch (e) {
    return fail(e, ctx.correlationId)
  }
}

// ── Fundamentals and forecasts ──────────────────────────────────────────────

export async function get_fundamentals(
  ctx: ToolContext,
  params: { symbol: string }
): Promise<ToolResult<unknown>> {
  try {
    return wrap(
      await invoke(ctx.userId, "fundamentals", { symbol: normalizeSymbol(params.symbol).tv }, {
        correlationId: ctx.correlationId, reason: ctx.reason, priority: PRIORITY.RESEARCH,
      })
    )
  } catch (e) {
    return fail(e, ctx.correlationId)
  }
}

export async function get_forecasts(
  ctx: ToolContext,
  params: { symbol: string }
): Promise<ToolResult<unknown>> {
  try {
    return wrap(
      await invoke(ctx.userId, "forecasts", { symbol: normalizeSymbol(params.symbol).tv }, {
        correlationId: ctx.correlationId, reason: ctx.reason, priority: PRIORITY.RESEARCH,
      })
    )
  } catch (e) {
    return fail(e, ctx.correlationId)
  }
}

// ── Calendars ───────────────────────────────────────────────────────────────

function coerceCalendar(raw: unknown, kind: CalendarEvent["kind"]): CalendarEvent[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((row): CalendarEvent[] => {
    if (!row || typeof row !== "object") return []
    const r = row as Record<string, unknown>
    const atRaw = Number(r.date ?? r.time ?? r.timestamp ?? r.at)
    if (!Number.isFinite(atRaw)) return []
    const at = atRaw > 1e12 ? atRaw : atRaw * 1000
    const imp = String(r.importance ?? r.impact ?? "").toLowerCase()
    return [{
      title: String(r.title ?? r.event ?? r.name ?? "event"),
      at,
      importance: imp.includes("high") || imp === "3" ? "high" : imp.includes("med") || imp === "2" ? "medium" : "low",
      kind,
    }]
  })
}

export async function get_economic_events(
  ctx: ToolContext,
  params: { from?: number; to?: number; countries?: string[] } = {}
): Promise<ToolResult<CalendarEvent[]>> {
  try {
    const r = await invoke<unknown>(ctx.userId, "economic_calendar", {
      from: params.from ?? Date.now(),
      to: params.to ?? Date.now() + 7 * 86_400_000,
      countries: params.countries,
    }, { correlationId: ctx.correlationId, reason: ctx.reason, priority: PRIORITY.RISK })
    return { ...wrap(r), data: coerceCalendar(r.data, "economic") }
  } catch (e) {
    return fail(e, ctx.correlationId)
  }
}

export async function get_earnings_events(
  ctx: ToolContext,
  params: { symbol?: string; from?: number; to?: number } = {}
): Promise<ToolResult<CalendarEvent[]>> {
  try {
    const r = await invoke<unknown>(ctx.userId, "earnings_calendar", {
      symbol: params.symbol ? normalizeSymbol(params.symbol).tv : undefined,
      from: params.from ?? Date.now(),
      to: params.to ?? Date.now() + 7 * 86_400_000,
    }, { correlationId: ctx.correlationId, reason: ctx.reason, priority: PRIORITY.RISK })
    return { ...wrap(r), data: coerceCalendar(r.data, "earnings") }
  } catch (e) {
    return fail(e, ctx.correlationId)
  }
}

// ── Watchlists ──────────────────────────────────────────────────────────────

export async function get_tradingview_watchlists(ctx: ToolContext): Promise<ToolResult<unknown>> {
  try {
    return wrap(
      await invoke(ctx.userId, "watchlist_list", {}, {
        correlationId: ctx.correlationId, reason: ctx.reason, priority: PRIORITY.INTERACTIVE,
      })
    )
  } catch (e) {
    return fail(e, ctx.correlationId)
  }
}

// ── Alerts ──────────────────────────────────────────────────────────────────

export async function get_tradingview_alerts(ctx: ToolContext): Promise<ToolResult<unknown>> {
  try {
    return wrap(
      await invoke(ctx.userId, "alert_list", {}, {
        correlationId: ctx.correlationId, reason: ctx.reason, priority: PRIORITY.INTERACTIVE,
      })
    )
  } catch (e) {
    return fail(e, ctx.correlationId)
  }
}

export async function create_tradingview_alert(
  ctx: ToolContext,
  params: { symbol: string; condition: Record<string, unknown>; message?: string; webhookUrl?: string }
): Promise<ToolResult<unknown>> {
  const symbol = normalizeSymbol(params.symbol)
  try {
    const r = await invoke(ctx.userId, "alert_create", {
      symbol: symbol.tv,
      condition: params.condition,
      message: params.message,
      webhook_url: params.webhookUrl,
    }, { correlationId: ctx.correlationId, reason: ctx.reason, priority: PRIORITY.INTERACTIVE })

    audit.append({
      correlationId: ctx.correlationId,
      stage: "tradingview.mcp_call",
      outcome: "ok",
      userId: ctx.userId,
      summary: `created TradingView alert on ${symbol.tv}`,
      // webhookUrl can embed the webhook token, so record only whether one was set.
      detail: { symbol: symbol.tv, hasWebhook: Boolean(params.webhookUrl) },
    })

    return wrap(r)
  } catch (e) {
    return fail(e, ctx.correlationId)
  }
}

// ── Composites ──────────────────────────────────────────────────────────────

export interface MarketContext {
  symbol: string
  technical: unknown | null
  calendar: CalendarEvent[]
  calendarUnavailable: boolean
  news: unknown | null
  degraded: boolean
  sources: Record<string, string>
}

/**
 * Assemble everything the Risk Engine wants about one instrument.
 *
 * Partial failure is normal and is reported rather than thrown: the Risk Engine
 * treats a missing calendar as risk (see `calendarUnavailable`), so returning
 * "we could not check" is strictly more useful than returning nothing.
 */
export async function build_market_context(
  ctx: ToolContext,
  params: { symbol: string; interval?: string; includeNews?: boolean }
): Promise<MarketContext> {
  const symbol = normalizeSymbol(params.symbol)

  const [technical, economic, earnings, news] = await Promise.all([
    get_technical_context(ctx, { symbol: symbol.tv, interval: params.interval }),
    get_economic_events(ctx, {}),
    symbol.instrumentType === "stock"
      ? get_earnings_events(ctx, { symbol: symbol.tv })
      : Promise.resolve({ ok: true, data: [] as CalendarEvent[], source: "live" as const, correlationId: ctx.correlationId }),
    params.includeNews ? get_market_news(ctx, { symbol: symbol.tv, limit: 5 }) : Promise.resolve(null),
  ])

  const calendar = [...(economic.data ?? []), ...(earnings.data ?? [])]
  const calendarUnavailable = !economic.ok && !earnings.ok
  const degraded =
    technical.source === "stale" || economic.source === "stale" || earnings.source === "stale"

  const context: MarketContext = {
    symbol: symbol.tv,
    technical: technical.data,
    calendar,
    calendarUnavailable,
    news: news?.data ?? null,
    degraded,
    sources: {
      technical: technical.source,
      economic: economic.source,
      earnings: earnings.source,
      ...(news ? { news: news.source } : {}),
    },
  }

  audit.append({
    correlationId: ctx.correlationId,
    stage: "market_intelligence",
    outcome: calendarUnavailable ? "degraded" : degraded ? "degraded" : "ok",
    userId: ctx.userId,
    summary: `built market context for ${symbol.tv}`,
    detail: { symbol: symbol.tv, sources: context.sources, calendarEvents: calendar.length, calendarUnavailable },
  })

  return context
}

/** Deeper, slower research bundle. Produces notes, never a trade. */
export async function research_instrument(
  ctx: ToolContext,
  params: { symbol: string }
): Promise<{
  symbol: string
  fundamentals: unknown | null
  forecasts: unknown | null
  news: unknown | null
  technical: unknown | null
  disclaimer: string
}> {
  const symbol = normalizeSymbol(params.symbol)
  const [fundamentals, forecasts, news, technical] = await Promise.all([
    get_fundamentals(ctx, { symbol: symbol.tv }),
    get_forecasts(ctx, { symbol: symbol.tv }),
    get_market_news(ctx, { symbol: symbol.tv, limit: 10 }),
    get_technical_context(ctx, { symbol: symbol.tv }),
  ])

  audit.append({
    correlationId: ctx.correlationId,
    stage: "market_intelligence",
    outcome: "ok",
    userId: ctx.userId,
    summary: `research bundle for ${symbol.tv}`,
    detail: {
      symbol: symbol.tv,
      sources: {
        fundamentals: fundamentals.source, forecasts: forecasts.source,
        news: news.source, technical: technical.source,
      },
    },
  })

  return {
    symbol: symbol.tv,
    fundamentals: fundamentals.data,
    forecasts: forecasts.data,
    news: news.data,
    technical: technical.data,
    disclaimer:
      "TradingView market intelligence. Narrative and analyst material is research context, not a deterministic strategy rule, and confers no execution authority.",
  }
}
