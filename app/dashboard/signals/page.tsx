"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { TradingViewDashboardSnapshot } from "@/lib/tradingview"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { TradingViewConnectionStatusCard } from "@/components/tradingview/connection-status-card"
import {
  TradingViewEventHistory,
  TradingViewSignalFeed,
} from "@/components/tradingview/signal-feed"

export default function DashboardSignalsPage() {
  const router = useRouter()
  const [snapshot, setSnapshot] = useState<TradingViewDashboardSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/tradingview/signals?limit=40")
      const data = await res.json()
      setSnapshot({
        connection: data.connection,
        recentSignals: data.signals,
        recentEvents: data.recentEvents,
        recentActions: data.recentActions,
      })
    } catch (error) {
      console.error("Failed to load signals", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 6000)
    return () => clearInterval(id)
  }, [refresh])

  const handleTest = async () => {
    setTesting(true)
    try {
      await fetch("/api/tradingview/connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      })
      await refresh()
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 terminal-grid">
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <div className="w-full h-[2px] bg-teal-500/10 animate-scanline opacity-20" />
      </div>
      <DashboardNav />

      <main className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h1
                className="text-4xl md:text-5xl font-extrabold uppercase tracking-tighter mb-3"
                style={{ fontFamily: "var(--font-inter), sans-serif" }}
              >
                Signal <span className="text-teal-400">Feed</span>
              </h1>
              <p className="text-slate-400 text-sm">
                TradingView webhook activity normalized into Donate Protocol signals.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => router.push("/connect/tradingview")}
                className="px-4 py-3 border border-teal-400 text-teal-400 text-[10px] uppercase font-bold tracking-widest hover:bg-teal-400 hover:text-slate-950 transition"
                style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              >
                Connection point
              </button>
              <button
                disabled={testing}
                onClick={handleTest}
                className="px-4 py-3 border border-lime-400 text-lime-400 text-[10px] uppercase font-bold tracking-widest hover:bg-lime-400 hover:text-slate-950 transition disabled:opacity-50"
                style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              >
                {testing ? "Sending…" : "Simulate signal"}
              </button>
            </div>
          </div>

          {loading || !snapshot ? (
            <div className="text-slate-400 text-center py-12">Loading signals…</div>
          ) : (
            <>
              <TradingViewConnectionStatusCard connection={snapshot.connection} />

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6 border-teal-500/20">
                  <h2
                    className="text-xl font-bold mb-6 uppercase tracking-tighter"
                    style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                  >
                    TradingView signals
                  </h2>
                  <TradingViewSignalFeed signals={snapshot.recentSignals} />
                </div>

                <div className="glass-panel p-6 border-lime-500/20">
                  <h2
                    className="text-xl font-bold mb-6 uppercase tracking-tighter text-lime-400"
                    style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                  >
                    Event history
                  </h2>
                  <TradingViewEventHistory
                    events={snapshot.recentEvents}
                    actions={snapshot.recentActions}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
