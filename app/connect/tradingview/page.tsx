"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { NavDark } from "@/components/nav-dark"
import { TradingViewChart } from "@/components/tradingview-chart"
import { STRATEGIES } from "@/lib/demo-data"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

const WEBHOOK_TOKEN = "demo123"

const SYMBOLS = [
  { tv: "BINANCE:SOLUSDT", alert: "SOLUSDT", label: "SOL / USDT" },
  { tv: "BINANCE:BONKUSDT", alert: "BONKUSDT", label: "BONK / USDT" },
  { tv: "BINANCE:JTOUSDT", alert: "JTOUSDT", label: "JTO / USDT" },
  { tv: "BINANCE:USDCUSDT", alert: "USDCUSDT", label: "USDC / USDT" },
]

const INTERVALS = [
  { code: "5", label: "5m" },
  { code: "15", label: "15m" },
  { code: "60", label: "1h" },
  { code: "240", label: "4h" },
  { code: "D", label: "1D" },
]

type AlertMode = "trade" | "ramp"

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="px-3 py-2 bg-teal-400 text-slate-950 font-bold text-[10px] uppercase hover:bg-teal-300 shrink-0"
    >
      {copied ? "Copied" : label}
    </button>
  )
}

export default function ConnectTradingViewPage() {
  const [symbol, setSymbol] = useState(SYMBOLS[0])
  const [interval, setInterval] = useState("60")
  const [mode, setMode] = useState<AlertMode>("trade")
  const [strategy, setStrategy] = useState(STRATEGIES[0].name)
  const [origin, setOrigin] = useState("")
  const [firing, setFiring] = useState(false)
  const [response, setResponse] = useState<unknown>(null)
  const [fireError, setFireError] = useState<string | null>(null)

  // Built client-side so the URL is the deployment the operator is actually on,
  // not a hardcoded example host.
  useEffect(() => setOrigin(window.location.origin), [])

  const webhookUrl = `${origin || "https://your-deployment"}/api/webhooks/tradingview/${WEBHOOK_TOKEN}`

  const alertBody = useMemo(() => {
    if (mode === "ramp") {
      return JSON.stringify(
        {
          action: "ramp",
          symbol: "{{ticker}}",
          price: "{{close}}",
          note: "deploys the next Charity Ramp tranche",
        },
        null,
        2
      )
    }
    return JSON.stringify(
      {
        symbol: "{{ticker}}",
        side: "{{strategy.order.action}}",
        price: "{{close}}",
        size: "{{strategy.order.contracts}}",
        strategy,
      },
      null,
      2
    )
  }, [mode, strategy])

  /** Same payload, with the TradingView placeholders filled in. */
  const testPayload = useMemo(() => {
    if (mode === "ramp") return { action: "ramp", symbol: symbol.alert, price: "182.44" }
    return {
      symbol: symbol.alert,
      side: "BUY" as const,
      price: "182.44",
      size: 50,
      strategy,
    }
  }, [mode, symbol, strategy])

  async function fireTest() {
    setFiring(true)
    setFireError(null)
    setResponse(null)
    try {
      const res = await fetch(`/api/webhooks/tradingview/${WEBHOOK_TOKEN}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(testPayload),
      })
      setResponse(await res.json())
    } catch (e) {
      setFireError(e instanceof Error ? e.message : "request failed")
    } finally {
      setFiring(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 terminal-grid">
      <NavDark />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400 text-center">
          /connect · step 2 of 3
        </div>
        <h1 className="text-center text-4xl md:text-5xl font-extrabold tracking-tighter mt-2">
          Connect <span className="text-teal-400">TradingView</span>
        </h1>
        <p className="text-center text-slate-400 mt-3 max-w-2xl mx-auto">
          Point an alert webhook at the URL below. Every fire either routes a trade through
          OpenClaw or deploys the next tranche of a Charity Swap Ramp.
        </p>

        <div className="grid lg:grid-cols-[1fr_minmax(0,420px)] gap-6 mt-10">
          {/* ── Chart ────────────────────────────────────────── */}
          <div className="glass-panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-slate-800" style={mono}>
              <div className="flex flex-wrap gap-1">
                {SYMBOLS.map((s) => (
                  <button
                    key={s.tv}
                    onClick={() => setSymbol(s)}
                    className={`px-2.5 py-1.5 text-[10px] uppercase border ${
                      symbol.tv === s.tv
                        ? "bg-teal-500/10 border-teal-500 text-teal-300"
                        : "border-slate-800 text-slate-500 hover:border-teal-500/40"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                {INTERVALS.map((i) => (
                  <button
                    key={i.code}
                    onClick={() => setInterval(i.code)}
                    className={`px-2 py-1.5 text-[10px] uppercase border ${
                      interval === i.code
                        ? "bg-teal-500/10 border-teal-500 text-teal-300"
                        : "border-slate-800 text-slate-500 hover:border-teal-500/40"
                    }`}
                  >
                    {i.label}
                  </button>
                ))}
              </div>
            </div>
            <TradingViewChart symbol={symbol.tv} interval={interval} height={480} />
          </div>

          {/* ── Alert builder ────────────────────────────────── */}
          <div className="space-y-4" style={mono}>
            <div className="glass-panel p-4 space-y-3">
              <div className="text-[9px] uppercase tracking-widest text-slate-500">Your Webhook URL</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-black/50 px-3 py-2 text-teal-300 text-[11px] break-all">
                  {webhookUrl}
                </code>
                <CopyButton text={webhookUrl} />
              </div>
              <p className="text-[10px] text-slate-600">
                Paste into TradingView → Alert → Notifications → Webhook URL.
              </p>
            </div>

            <div className="glass-panel p-4 space-y-3">
              <div className="flex gap-1">
                {(["trade", "ramp"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setResponse(null) }}
                    className={`flex-1 px-3 py-2 text-[10px] uppercase border ${
                      mode === m
                        ? "bg-teal-500/10 border-teal-500 text-teal-300"
                        : "border-slate-800 text-slate-500 hover:border-teal-500/40"
                    }`}
                  >
                    {m === "trade" ? "Trade alert" : "Ramp alert"}
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed">
                {mode === "trade"
                  ? "Executes the signal, then donates a share of realised PnL to the beneficiary."
                  : "Deploys the next tranche of your open Charity Swap Ramp, so DCA follows the chart instead of a clock."}
              </p>

              {mode === "trade" && (
                <label className="block">
                  <span className="text-[9px] uppercase tracking-widest text-slate-500">Strategy</span>
                  <select
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                    className="mt-1.5 w-full bg-black/50 border border-slate-800 px-3 py-2 text-[11px] text-teal-300 outline-none focus:border-teal-500"
                  >
                    {STRATEGIES.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} — {s.donationRate}% of PnL donated
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-widest text-slate-500">
                    Alert Message (JSON)
                  </span>
                  <CopyButton text={alertBody} />
                </div>
                <pre className="bg-black/50 p-3 mt-2 text-[11px] text-slate-300 overflow-auto">
                  {alertBody}
                </pre>
              </div>

              <button
                onClick={fireTest}
                disabled={firing}
                className="w-full py-3 bg-lime-400 text-slate-950 font-bold uppercase text-[11px] hover:bg-lime-300 disabled:opacity-50"
              >
                {firing ? "Firing…" : "Send test alert"}
              </button>
              {fireError && <p className="text-[10px] text-rose-400">{fireError}</p>}
            </div>

            {response !== null && (
              <div className="glass-panel p-4">
                <div className="text-[9px] uppercase tracking-widest text-lime-400">Webhook response</div>
                <pre className="bg-black/50 p-3 mt-2 text-[10px] text-slate-300 overflow-auto max-h-72">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-3 mt-8" style={mono}>
          <Link href="/connect" className="px-4 py-2 text-[10px] uppercase border border-slate-700 text-slate-400">
            ← Back
          </Link>
          <div className="flex gap-3">
            <Link
              href="/dashboard/ramp"
              className="px-5 py-2 border border-lime-500/40 text-lime-300 uppercase text-[11px] hover:bg-lime-500/10"
            >
              Open Charity Ramp
            </Link>
            <Link
              href="/connect/openclaw"
              className="px-5 py-2 bg-teal-400 text-slate-950 font-bold uppercase text-[11px]"
            >
              Continue → OpenClaw
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
