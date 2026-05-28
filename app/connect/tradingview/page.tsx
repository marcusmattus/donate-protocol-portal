"use client"

import { useState } from "react"
import Link from "next/link"
import { NavDark } from "@/components/nav-dark"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

export default function ConnectTradingViewPage() {
  const [copied, setCopied] = useState(false)
  const url = "https://api.donate-protocol.example/webhooks/tradingview/demo123"
  function copy() {
    navigator.clipboard?.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 terminal-grid">
      <NavDark />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400 text-center">/connect · step 2 of 3</div>
        <h1 className="text-center text-4xl md:text-5xl font-extrabold tracking-tighter mt-2">
          Connect <span className="text-teal-400">TradingView</span>
        </h1>
        <p className="text-center text-slate-400 mt-3">Point your alert webhook to this URL. Each fire triggers an OpenClaw run.</p>

        <div className="glass-panel p-5 mt-8 space-y-4" style={mono}>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500">Your Webhook URL</div>
            <div className="flex items-center gap-2 mt-2">
              <code className="flex-1 bg-black/50 px-3 py-2 text-teal-300 text-[12px] break-all">{url}</code>
              <button onClick={copy} className="px-3 py-2 bg-teal-400 text-slate-950 font-bold text-[10px] uppercase">
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500">Sample Alert Message (JSON)</div>
            <pre className="bg-black/50 p-3 mt-2 text-[11px] text-slate-300 overflow-auto">
{`{
  "symbol": "{{ticker}}",
  "side": "{{strategy.order.action}}",
  "price": "{{close}}",
  "size": {{strategy.order.contracts}},
  "strategy": "Momentum Alpha"
}`}
            </pre>
          </div>
        </div>

        <div className="flex justify-between mt-6" style={mono}>
          <Link href="/connect" className="px-4 py-2 text-[10px] uppercase border border-slate-700 text-slate-400">← Back</Link>
          <Link href="/connect/openclaw" className="px-5 py-2 bg-teal-400 text-slate-950 font-bold uppercase text-[11px]">Continue → OpenClaw</Link>
        </div>
      </main>
    </div>
  )
}
