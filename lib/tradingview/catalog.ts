/**
 * TradingView MCP capability catalog.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * THIS IS THE ONLY FILE THAT NAMES OFFICIAL TRADINGVIEW MCP TOOLS.
 *
 * Everything else in Donate Protocol refers to a `TvCapability` — a stable
 * internal identifier — and the connector resolves it to a concrete remote tool
 * name through this catalog. That indirection exists for one reason: the exact
 * tool names and argument shapes of the official TradingView MCP server can
 * only be confirmed by calling `tools/list` against the live endpoint after
 * OAuth, and until then they are a documented expectation, not a verified fact.
 *
 * When TradingView OAuth is authorized, run the reconciliation:
 *
 *     npm run tv:reconcile
 *
 * which calls `tools/list` and reports every catalog entry whose `remote` name
 * or argument keys do not match the live server. Fix THIS FILE; no other module
 * should need to change. `verified: false` entries are the ones to check first.
 * The connector refuses to invoke an unverified capability when
 * TRADINGVIEW_REQUIRE_VERIFIED_TOOLS=true, so a production deployment can force
 * this reconciliation to have happened.
 * ────────────────────────────────────────────────────────────────────────────
 */

export type TvCapability =
  // market data
  | "search_symbols"
  | "get_bars"
  | "get_economic_indicator"
  | "list_economic_indicators"
  // screener
  | "screen"
  | "screener_columns"
  | "screener_presets"
  | "batch_symbol_data"
  // technical
  | "technical_rating"
  // news
  | "news_list"
  | "news_story"
  // fundamentals
  | "fundamentals"
  | "forecasts"
  // documents
  | "list_documents"
  | "get_document"
  // calendars
  | "earnings_calendar"
  | "economic_calendar"
  | "dividend_calendar"
  // watchlists
  | "watchlist_list"
  | "watchlist_get"
  | "watchlist_active"
  | "watchlist_create"
  | "watchlist_add_symbols"
  | "watchlist_remove_symbols"
  | "watchlist_update"
  | "watchlist_delete"
  // alerts
  | "alert_create"
  | "alert_update"
  | "alert_pause"
  | "alert_restart"
  | "alert_delete"
  | "alert_list"
  | "alert_get"
  | "alert_fires"

/** Read capabilities are cacheable and safely retried; writes are neither. */
export type TvCapabilityKind = "read" | "write"

export interface TvCapabilitySpec {
  /** Remote MCP tool name, as exposed by the official TradingView server. */
  remote: string
  kind: TvCapabilityKind
  /** Cache TTL in ms. 0 disables caching. Writes are never cached. */
  cacheTtlMs: number
  /**
   * Scheduling priority when the per-user rate limiter is saturated.
   * Lower runs first: risk-critical reads outrank background research.
   */
  priority: number
  /** True once confirmed against a live `tools/list`. */
  verified: boolean
  /** Whether this capability needs a user-authorized (not app-level) session. */
  requiresUserAuth: boolean
  description: string
}

/** Priority bands, so call sites express intent rather than magic numbers. */
export const PRIORITY = {
  /** Blocking a risk decision or an execution intent. */
  RISK: 0,
  /** Serving an interactive dashboard request. */
  INTERACTIVE: 10,
  /** Strategy evaluation on a schedule. */
  STRATEGY: 20,
  /** Background research and enrichment. */
  RESEARCH: 30,
} as const

export const TV_CATALOG: Record<TvCapability, TvCapabilitySpec> = {
  search_symbols: { remote: "search_symbols", kind: "read", cacheTtlMs: 3_600_000, priority: PRIORITY.INTERACTIVE, verified: false, requiresUserAuth: false, description: "Symbol lookup across exchanges." },
  get_bars: { remote: "get_bars", kind: "read", cacheTtlMs: 30_000, priority: PRIORITY.STRATEGY, verified: false, requiresUserAuth: false, description: "Historical OHLCV for a symbol and interval." },
  get_economic_indicator: { remote: "get_economic_indicator", kind: "read", cacheTtlMs: 3_600_000, priority: PRIORITY.RESEARCH, verified: false, requiresUserAuth: false, description: "Economic indicator time series." },
  list_economic_indicators: { remote: "list_economic_indicators", kind: "read", cacheTtlMs: 86_400_000, priority: PRIORITY.RESEARCH, verified: false, requiresUserAuth: false, description: "Discover supported economic indicators." },

  screen: { remote: "screener", kind: "read", cacheTtlMs: 60_000, priority: PRIORITY.STRATEGY, verified: false, requiresUserAuth: false, description: "Run a screener query with filters, sorting and columns." },
  screener_columns: { remote: "screener_columns", kind: "read", cacheTtlMs: 86_400_000, priority: PRIORITY.INTERACTIVE, verified: false, requiresUserAuth: false, description: "Discover screener columns available per instrument type." },
  screener_presets: { remote: "screener_presets", kind: "read", cacheTtlMs: 86_400_000, priority: PRIORITY.INTERACTIVE, verified: false, requiresUserAuth: false, description: "Named screener presets." },
  batch_symbol_data: { remote: "batch_symbol_data", kind: "read", cacheTtlMs: 30_000, priority: PRIORITY.STRATEGY, verified: false, requiresUserAuth: false, description: "Fetch data for many symbols in one call." },

  technical_rating: { remote: "technical_rating", kind: "read", cacheTtlMs: 60_000, priority: PRIORITY.RISK, verified: false, requiresUserAuth: false, description: "Indicator snapshot and recommendation aggregate for a timeframe." },

  news_list: { remote: "get_news", kind: "read", cacheTtlMs: 300_000, priority: PRIORITY.RESEARCH, verified: false, requiresUserAuth: false, description: "News headlines for an instrument." },
  news_story: { remote: "get_news_story", kind: "read", cacheTtlMs: 3_600_000, priority: PRIORITY.RESEARCH, verified: false, requiresUserAuth: false, description: "Full story body for a news item." },

  fundamentals: { remote: "get_fundamentals", kind: "read", cacheTtlMs: 3_600_000, priority: PRIORITY.RESEARCH, verified: false, requiresUserAuth: false, description: "Valuation, margins, returns and historical financials." },
  forecasts: { remote: "get_forecasts", kind: "read", cacheTtlMs: 3_600_000, priority: PRIORITY.RESEARCH, verified: false, requiresUserAuth: false, description: "Analyst consensus, price targets, EPS and revenue forecasts." },

  list_documents: { remote: "list_documents", kind: "read", cacheTtlMs: 3_600_000, priority: PRIORITY.RESEARCH, verified: false, requiresUserAuth: false, description: "Discover company filings, transcripts and presentations." },
  get_document: { remote: "get_document", kind: "read", cacheTtlMs: 86_400_000, priority: PRIORITY.RESEARCH, verified: false, requiresUserAuth: false, description: "Retrieve a specific company document." },

  earnings_calendar: { remote: "earnings_calendar", kind: "read", cacheTtlMs: 900_000, priority: PRIORITY.RISK, verified: false, requiresUserAuth: false, description: "Upcoming and past earnings events." },
  economic_calendar: { remote: "economic_calendar", kind: "read", cacheTtlMs: 900_000, priority: PRIORITY.RISK, verified: false, requiresUserAuth: false, description: "Scheduled macroeconomic events." },
  dividend_calendar: { remote: "dividend_calendar", kind: "read", cacheTtlMs: 900_000, priority: PRIORITY.RESEARCH, verified: false, requiresUserAuth: false, description: "Dividend ex-dates and payments." },

  watchlist_list: { remote: "list_watchlists", kind: "read", cacheTtlMs: 30_000, priority: PRIORITY.INTERACTIVE, verified: false, requiresUserAuth: true, description: "List the user's watchlists." },
  watchlist_get: { remote: "get_watchlist", kind: "read", cacheTtlMs: 30_000, priority: PRIORITY.INTERACTIVE, verified: false, requiresUserAuth: true, description: "Retrieve one watchlist." },
  watchlist_active: { remote: "get_active_watchlist", kind: "read", cacheTtlMs: 30_000, priority: PRIORITY.INTERACTIVE, verified: false, requiresUserAuth: true, description: "The user's active watchlist." },
  watchlist_create: { remote: "create_watchlist", kind: "write", cacheTtlMs: 0, priority: PRIORITY.INTERACTIVE, verified: false, requiresUserAuth: true, description: "Create a watchlist." },
  watchlist_add_symbols: { remote: "add_symbols_to_watchlist", kind: "write", cacheTtlMs: 0, priority: PRIORITY.INTERACTIVE, verified: false, requiresUserAuth: true, description: "Add symbols to a watchlist." },
  watchlist_remove_symbols: { remote: "remove_symbols_from_watchlist", kind: "write", cacheTtlMs: 0, priority: PRIORITY.INTERACTIVE, verified: false, requiresUserAuth: true, description: "Remove symbols from a watchlist." },
  watchlist_update: { remote: "update_watchlist", kind: "write", cacheTtlMs: 0, priority: PRIORITY.INTERACTIVE, verified: false, requiresUserAuth: true, description: "Rename or otherwise update a watchlist." },
  watchlist_delete: { remote: "delete_watchlist", kind: "write", cacheTtlMs: 0, priority: PRIORITY.INTERACTIVE, verified: false, requiresUserAuth: true, description: "Delete a watchlist." },

  alert_create: { remote: "create_alert", kind: "write", cacheTtlMs: 0, priority: PRIORITY.INTERACTIVE, verified: false, requiresUserAuth: true, description: "Create a price-condition alert." },
  alert_update: { remote: "update_alert", kind: "write", cacheTtlMs: 0, priority: PRIORITY.INTERACTIVE, verified: false, requiresUserAuth: true, description: "Modify an existing alert." },
  alert_pause: { remote: "pause_alert", kind: "write", cacheTtlMs: 0, priority: PRIORITY.INTERACTIVE, verified: false, requiresUserAuth: true, description: "Pause an alert." },
  alert_restart: { remote: "restart_alert", kind: "write", cacheTtlMs: 0, priority: PRIORITY.INTERACTIVE, verified: false, requiresUserAuth: true, description: "Restart a paused alert." },
  alert_delete: { remote: "delete_alert", kind: "write", cacheTtlMs: 0, priority: PRIORITY.INTERACTIVE, verified: false, requiresUserAuth: true, description: "Delete an alert." },
  alert_list: { remote: "list_alerts", kind: "read", cacheTtlMs: 30_000, priority: PRIORITY.INTERACTIVE, verified: false, requiresUserAuth: true, description: "List the user's alerts." },
  alert_get: { remote: "get_alert", kind: "read", cacheTtlMs: 30_000, priority: PRIORITY.INTERACTIVE, verified: false, requiresUserAuth: true, description: "Retrieve one alert's details." },
  alert_fires: { remote: "get_alert_fires", kind: "read", cacheTtlMs: 30_000, priority: PRIORITY.INTERACTIVE, verified: false, requiresUserAuth: true, description: "Alert fire history." },
}

export const ALL_CAPABILITIES = Object.keys(TV_CATALOG) as TvCapability[]

export function capabilitySpec(cap: TvCapability): TvCapabilitySpec {
  const spec = TV_CATALOG[cap]
  if (!spec) throw new Error(`unknown TradingView capability: ${cap}`)
  return spec
}

/** Capabilities whose remote name has not yet been confirmed against tools/list. */
export function unverifiedCapabilities(): TvCapability[] {
  return ALL_CAPABILITIES.filter((c) => !TV_CATALOG[c].verified)
}

/**
 * Compare the catalog against a live `tools/list` result.
 * Used by `npm run tv:reconcile` and by the connection health readout.
 */
export function reconcileCatalog(remoteToolNames: string[]): {
  matched: TvCapability[]
  missing: { capability: TvCapability; expected: string }[]
  unmapped: string[]
} {
  const remote = new Set(remoteToolNames)
  const matched: TvCapability[] = []
  const missing: { capability: TvCapability; expected: string }[] = []

  for (const cap of ALL_CAPABILITIES) {
    const spec = TV_CATALOG[cap]
    if (remote.has(spec.remote)) matched.push(cap)
    else missing.push({ capability: cap, expected: spec.remote })
  }

  const mapped = new Set(ALL_CAPABILITIES.map((c) => TV_CATALOG[c].remote))
  const unmapped = remoteToolNames.filter((n) => !mapped.has(n))

  return { matched, missing, unmapped }
}
