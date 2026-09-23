"use client"

import { useCallback, useEffect, useState } from "react"
import { TradingViewChart } from "@/components/tradingview-chart"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

type Source = "live" | "cache" | "stale" | "unavailable"

interface ConnectionView {
  connection: {
    status: string
    health: string
    tokens: { present: boolean; scopes?: string[]; expiresInSec?: number; canRefresh?: boolean }
    grantedCapabilities: string[]
    unmappedRemoteTools: string[]
    connectedAt: number | null
    lastSuccessfulRequestAt: number | null
    lastErrorMessage: string | null
    consecutiveFailures: number
  }
  health: {
    endpoint: string
    oauthConfigured: boolean
    connected: boolean
    rateLimit: { availableTokens: number; capacity: number; queueDepth: number; cooldownMs: number }
    requireVerifiedTools: boolean
  }
  catalog: { total: number; unverified: string[]; note: string }
  cache: { entries: number; fresh: number; stale: number }
}

/** Every panel states its provenance, so stale data is never shown as current. */
function SourceBadge({ source, ageMs }: { source: Source; ageMs?: number }) {
  const map: Record<Source, string> = {
    live: "border-lime-500/40 text-lime-300",
    cache: "border-teal-500/40 text-teal-300",
    stale: "border-amber-500/40 text-amber-300",
    unavailable: "border-rose-500/40 text-rose-300",
  }
  return (
    <span className={`px-2 py-0.5 border text-[9px] uppercase ${map[source]}`} style={mono}>
      {source}
      {source === "stale" && ageMs ? ` · ${Math.round(ageMs / 1000)}s old` : ""}
    </span>
  )
}

function Panel({
  title,
  source,
  ageMs,
  children,
  actions,
}: {
  title: string
  source?: Source
  ageMs?: number
  children: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="glass-panel overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-slate-800">
        <span style={mono} className="text-[10px] uppercase tracking-widest text-teal-400">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {actions}
          {source && <SourceBadge source={source} ageMs={ageMs} />}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

const OPS = [
  { op: "technical", label: "Technical" },
  { op: "news", label: "News" },
  { op: "fundamentals", label: "Fundamentals" },
  { op: "forecasts", label: "Forecasts" },
  { op: "economic_calendar", label: "Economic" },
  { op: "earnings_calendar", label: "Earnings" },
  { op: "watchlists", label: "Watchlists" },
  { op: "alerts", label: "Alerts" },
  { op: "market_context", label: "Risk context" },
] as const

export default function TradingViewIntelligencePage() {
  const [conn, setConn] = useState<ConnectionView | null>(null)
  const [symbol, setSymbol] = useState("BINANCE:BTCUSDT")
  const [activeOp, setActiveOp] = useState<(typeof OPS)[number]["op"]>("technical")
  const [result, setResult] = useState<{ data: unknown; source: Source; ageMs?: number; error?: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)

  const loadConnection = useCallback(async () => {
    try {
      const res = await fetch("/api/tradingview/connection")
      setConn(await res.json())
    } catch {
      setConn(null)
    }
  }, [])

  useEffect(() => {
    loadConnection()
  }, [loadConnection])

  async function connect() {
    setConnecting(true)
    try {
      const res = await fetch("/api/tradingview/oauth/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (data.authorizationUrl) {
        // The user authenticates on TradingView; we never see a credential.
        window.location.href = data.authorizationUrl
      } else {
        setResult({ data: null, source: "unavailable", error: data.hint ?? data.error })
      }
    } finally {
      setConnecting(false)
    }
  }

  async function disconnect() {
    await fetch("/api/tradingview/connection", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "disconnect" }),
    })
    loadConnection()
  }

  async function runOp(op: (typeof OPS)[number]["op"]) {
    setActiveOp(op)
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/tradingview/intelligence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ op, params: { symbol } }),
      })
      const body = await res.json()
      const r = body.result
      if (!body.ok) {
        setResult({ data: null, source: "unavailable", error: body.error })
      } else if (op === "market_context" || op === "research") {
        setResult({ data: r, source: r?.degraded ? "stale" : "live" })
      } else {
        setResult({ data: r?.data, source: (r?.source ?? "unavailable") as Source, ageMs: r?.ageMs, error: r?.error })
      }
      loadConnection()
    } catch (e) {
      setResult({ data: null, source: "unavailable", error: e instanceof Error ? e.message : "request failed" })
    } finally {
      setLoading(false)
    }
  }

  const connected = conn?.health.connected ?? false
  const c = conn?.connection

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400">
            /dashboard/tradingview
          </div>
          <h1 className="text-2xl font-bold">TradingView Intelligence</h1>
          <p style={mono} className="text-[11px] text-slate-500 mt-1 max-w-2xl">
            Market intelligence, screening, research, calendars and alerts from the official TradingView
            MCP server. This layer produces signals; Donate Protocol&apos;s Risk Engine decides whether any
            of them may execute.
          </p>
        </div>
        <div className="flex gap-2" style={mono}>
          {connected ? (
            <button
              onClick={disconnect}
              className="px-4 py-2 text-[10px] uppercase border border-slate-700 text-slate-300 hover:border-rose-500/40 hover:text-rose-300"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={connecting || !conn?.health.oauthConfigured}
              className="px-4 py-2 text-[10px] uppercase bg-teal-400 text-slate-950 font-bold hover:bg-teal-300 disabled:opacity-40"
            >
              {connecting ? "Starting…" : "Connect TradingView"}
            </button>
          )}
        </div>
      </header>

      {/* ── Connection + health ─────────────────────────────────── */}
      <div className="grid md:grid-cols-4 gap-3" style={mono}>
        <div className="glass-panel p-4">
          <div className="text-[9px] uppercase tracking-widest text-slate-500">Connection</div>
          <div
            className={`text-lg font-bold mt-1 uppercase ${
              c?.status === "connected"
                ? "text-lime-400"
                : c?.status === "needs_reauthorization"
                ? "text-amber-400"
                : "text-slate-400"
            }`}
          >
            {c?.status ?? "disconnected"}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {c?.tokens.present
              ? `token valid ${c.tokens.expiresInSec ?? 0}s · ${c.tokens.canRefresh ? "refreshable" : "no refresh"}`
              : "no token"}
          </div>
        </div>
        <div className="glass-panel p-4">
          <div className="text-[9px] uppercase tracking-widest text-slate-500">Health</div>
          <div
            className={`text-lg font-bold mt-1 uppercase ${
              c?.health === "healthy" ? "text-lime-400" : c?.health === "degraded" ? "text-amber-400" : "text-slate-400"
            }`}
          >
            {c?.health ?? "unknown"}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {c?.consecutiveFailures ? `${c.consecutiveFailures} consecutive failures` : "no recent failures"}
          </div>
        </div>
        <div className="glass-panel p-4">
          <div className="text-[9px] uppercase tracking-widest text-slate-500">Rate limit</div>
          <div className="text-lg font-bold mt-1 text-teal-300 tabular-nums">
            {conn?.health.rateLimit.availableTokens ?? "—"}/{conn?.health.rateLimit.capacity ?? "—"}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            queue {conn?.health.rateLimit.queueDepth ?? 0}
            {conn?.health.rateLimit.cooldownMs ? ` · cooldown ${Math.round(conn.health.rateLimit.cooldownMs / 1000)}s` : ""}
          </div>
        </div>
        <div className="glass-panel p-4">
          <div className="text-[9px] uppercase tracking-widest text-slate-500">Capabilities</div>
          <div className="text-lg font-bold mt-1 text-slate-100 tabular-nums">
            {c?.grantedCapabilities.length ?? 0}/{conn?.catalog.total ?? 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {conn?.catalog.unverified.length
              ? `${conn.catalog.unverified.length} unreconciled`
              : "all reconciled"}
          </div>
        </div>
      </div>

      {!conn?.health.oauthConfigured && (
        <div className="glass-panel p-4 border-amber-500/40" style={mono}>
          <div className="text-[10px] uppercase tracking-widest text-amber-400">
            TradingView OAuth is not configured
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Set <code className="text-teal-300">TRADINGVIEW_OAUTH_CLIENT_ID</code> and{" "}
            <code className="text-teal-300">TRADINGVIEW_OAUTH_REDIRECT_URI</code>, then reload. Donate Protocol
            authorizes through TradingView&apos;s own OAuth flow and never asks for a TradingView password.
          </p>
        </div>
      )}

      {conn?.catalog.unverified.length ? (
        <div className="glass-panel p-4 border-amber-500/30" style={mono}>
          <div className="text-[10px] uppercase tracking-widest text-amber-400">
            {conn.catalog.unverified.length} capabilities not yet reconciled
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{conn.catalog.note}</p>
        </div>
      ) : null}

      {/* ── Explorer ────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-[1fr_minmax(0,460px)] gap-6">
        <Panel title={`Chart · ${symbol}`}>
          <div className="-m-4">
            <TradingViewChart symbol={symbol} interval="60" height={420} />
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Symbol">
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="BINANCE:BTCUSDT"
              className="w-full bg-black/50 border border-slate-800 px-3 py-2 text-[12px] text-teal-300 outline-none focus:border-teal-500"
              style={mono}
            />
            <p className="text-[10px] text-slate-600 mt-2" style={mono}>
              EXCHANGE:TICKER. A bare ticker is normalized, and the inferred exchange is flagged to the
              Risk Engine as lower confidence.
            </p>
          </Panel>

          <Panel title="Intelligence">
            <div className="grid grid-cols-3 gap-1" style={mono}>
              {OPS.map((o) => (
                <button
                  key={o.op}
                  onClick={() => runOp(o.op)}
                  disabled={!connected || loading}
                  className={`px-2 py-2 text-[9px] uppercase border disabled:opacity-40 ${
                    activeOp === o.op
                      ? "bg-teal-500/10 border-teal-500 text-teal-300"
                      : "border-slate-800 text-slate-400 hover:border-teal-500/40"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {!connected && (
              <p className="text-[10px] text-slate-600 mt-3" style={mono}>
                Connect TradingView to query these.
              </p>
            )}
          </Panel>
        </div>
      </div>

      <Panel
        title={`Result · ${activeOp}`}
        source={result?.source}
        ageMs={result?.ageMs}
        actions={loading ? <span className="text-[9px] uppercase text-slate-500" style={mono}>loading…</span> : null}
      >
        {result?.error ? (
          <p className="text-[11px] text-rose-400" style={mono}>{result.error}</p>
        ) : result?.data ? (
          <pre
            className="bg-black/50 p-3 text-[10px] text-slate-300 overflow-auto max-h-96"
            style={mono}
          >
            {JSON.stringify(result.data, null, 2)}
          </pre>
        ) : (
          <p className="text-[11px] text-slate-600" style={mono}>
            {loading ? "Querying TradingView…" : "Pick an intelligence query above."}
          </p>
        )}
      </Panel>

      <div className="glass-panel p-4" style={mono}>
        <div className="text-[10px] uppercase tracking-widest text-slate-400">Separation of concerns</div>
        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
          TradingView supplies market intelligence, research, screening and alerts. Donate Protocol&apos;s Risk
          Engine independently decides eligibility and size; exchange connectors execute. A TradingView
          recommendation is one input to that decision and never an authorization on its own — every signal,
          however it arrives, passes the same risk controls and lands in the audit ledger.
        </p>
      </div>
    </div>
  )
}
