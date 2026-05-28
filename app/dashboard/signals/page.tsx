"use client"

import { useEffect, useMemo, useState } from "react"
import { RECENT_SIGNALS, TradeSignal, timeAgo } from "@/lib/demo-data"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

export default function SignalsPage() {
  const [signals, setSignals] = useState<TradeSignal[]>(RECENT_SIGNALS)
  const [filter, setFilter] = useState<"all" | "tradingview" | "openclaw" | "copy">("all")
  const [, force] = useState(0)

  useEffect(() => {
    const t = setInterval(() => force((x) => x + 1), 5000)
    return () => clearInterval(t)
  }, [])

  const filtered = useMemo(
    () => (filter === "all" ? signals : signals.filter((s) => s.source === filter)),
    [signals, filter]
  )

  async function injectSignal() {
    const res = await fetch("/api/webhooks/tradingview/demo123", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        symbol: "SOLUSDT",
        side: Math.random() > 0.5 ? "BUY" : "SELL",
        price: +(180 + Math.random() * 4).toFixed(2),
        size: Math.floor(10 + Math.random() * 100),
        strategy: "Momentum Alpha",
      }),
    })
    const data = await res.json()
    if (data.signal) {
      setSignals((prev) => [data.signal as TradeSignal, ...prev].slice(0, 50))
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400">/dashboard/signals</div>
          <h1 className="text-2xl font-bold">Signal Feed</h1>
          <p style={mono} className="text-[11px] text-slate-500 mt-1">
            Live TradingView webhooks + OpenClaw decisions. Each fill triggers a donation event on Solana devnet.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" style={mono}>
          {(["all", "tradingview", "openclaw", "copy"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-[10px] uppercase border ${
                filter === f
                  ? "bg-teal-500/10 border-teal-500 text-teal-300"
                  : "border-slate-800 text-slate-400 hover:border-teal-500/40"
              }`}
            >
              {f}
            </button>
          ))}
          <button
            onClick={injectSignal}
            className="px-3 py-2 text-[10px] uppercase bg-lime-400 text-slate-950 font-bold hover:bg-lime-300"
          >
            Inject Signal
          </button>
        </div>
      </header>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-sm" style={mono}>
          <thead className="bg-slate-900/60 text-[10px] uppercase text-slate-500 tracking-widest">
            <tr>
              <th className="text-left px-4 py-3">Time</th>
              <th className="text-left px-4 py-3">Symbol</th>
              <th className="text-left px-4 py-3">Side</th>
              <th className="text-right px-4 py-3">Price</th>
              <th className="text-right px-4 py-3">Size</th>
              <th className="text-left px-4 py-3">Strategy</th>
              <th className="text-left px-4 py-3">Source</th>
              <th className="text-right px-4 py-3">PnL</th>
              <th className="text-right px-4 py-3">Donation</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-t border-slate-800/60 hover:bg-slate-900/40">
                <td className="px-4 py-3 text-slate-400 text-[11px]">{timeAgo(s.ts)}</td>
                <td className="px-4 py-3 text-white">{s.symbol}</td>
                <td className={`px-4 py-3 ${s.side === "BUY" ? "text-lime-400" : "text-rose-400"}`}>{s.side}</td>
                <td className="px-4 py-3 text-right text-slate-300">${s.price.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-slate-300">{s.size.toLocaleString()}</td>
                <td className="px-4 py-3 text-slate-300">{s.strategy}</td>
                <td className="px-4 py-3 text-[10px] uppercase text-slate-500">{s.source}</td>
                <td className={`px-4 py-3 text-right ${typeof s.pnl === "number" ? (s.pnl >= 0 ? "text-lime-300" : "text-rose-400") : "text-slate-500"}`}>
                  {typeof s.pnl === "number" ? `${s.pnl >= 0 ? "+" : ""}${s.pnl.toFixed(2)}` : "—"}
                </td>
                <td className="px-4 py-3 text-right text-teal-300">
                  {typeof s.donationAmount === "number" ? `$${s.donationAmount.toFixed(2)}` : "—"}
                </td>
                <td className="px-4 py-3 text-[10px] uppercase">
                  <span
                    className={`px-2 py-0.5 border ${
                      s.status === "complete"
                        ? "border-lime-400/40 text-lime-300"
                        : s.status === "failed"
                        ? "border-rose-400/40 text-rose-300"
                        : "border-teal-400/40 text-teal-300"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-8 text-slate-500">
                  No signals match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="glass-panel p-4" style={mono}>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">Public Webhook</div>
        <div className="text-[12px] text-teal-300 break-all">
          POST https://api.donate-protocol.example/webhooks/tradingview/demo123
        </div>
        <pre className="mt-3 text-[11px] text-slate-300 bg-black/50 p-3 overflow-auto">
{`{
  "symbol": "SOLUSDT",
  "side": "BUY",
  "price": "181.20",
  "size": 50,
  "strategy": "Momentum Alpha"
}`}
        </pre>
      </div>
    </div>
  )
}
