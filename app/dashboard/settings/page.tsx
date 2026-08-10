"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import type { TradingViewDashboardSnapshot } from "@/lib/tradingview"
import { TRADINGVIEW_CONFIG } from "@/lib/tradingview/config"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { TradingViewConnectionStatusCard } from "@/components/tradingview/connection-status-card"
import { TradingViewSetupChecklist } from "@/components/tradingview/setup-checklist"
import { WebhookCopyField } from "@/components/tradingview/webhook-copy"
import type { TradingViewSetupStepId } from "@/lib/tradingview"

export default function DashboardSettingsPage() {
  const [snapshot, setSnapshot] = useState<TradingViewDashboardSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/tradingview/connection")
      const data = (await res.json()) as TradingViewDashboardSnapshot
      setSnapshot(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const postAction = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/tradingview/connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.snapshot) setSnapshot(data.snapshot)
    else await refresh()
    return data
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 terminal-grid">
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <div className="w-full h-[2px] bg-teal-500/10 animate-scanline opacity-20" />
      </div>
      <DashboardNav />

      <main className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1
              className="text-4xl md:text-5xl font-extrabold uppercase tracking-tighter mb-3"
              style={{ fontFamily: "var(--font-inter), sans-serif" }}
            >
              Dashboard <span className="text-teal-400">Settings</span>
            </h1>
            <p className="text-slate-400 text-sm">
              TradingView webhook connection, charting library placeholders, and demo controls.
            </p>
          </div>

          {message && (
            <div className="border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-sm text-teal-200">
              {message}
            </div>
          )}

          {loading || !snapshot ? (
            <div className="text-slate-400 text-center py-12">Loading settings…</div>
          ) : (
            <>
              <TradingViewConnectionStatusCard connection={snapshot.connection} />

              <div className="glass-panel p-6 border-teal-500/20 space-y-5">
                <h2
                  className="text-lg font-bold uppercase tracking-tighter"
                  style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                >
                  Webhook credentials
                </h2>
                <WebhookCopyField
                  label="Webhook URL"
                  value={snapshot.connection.webhookUrl}
                  onCopied={() =>
                    postAction({
                      action: "mark_step",
                      stepId: "copy_webhook",
                      completed: true,
                    })
                  }
                />
                <WebhookCopyField label="Token" value={snapshot.connection.token} />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Configure via{" "}
                  <code className="text-teal-300">TRADINGVIEW_WEBHOOK_TOKEN</code> /{" "}
                  <code className="text-teal-300">NEXT_PUBLIC_APP_URL</code>. Charting Library
                  path placeholder:{" "}
                  <code className="text-teal-300">
                    {TRADINGVIEW_CONFIG.chartingLibraryPath}
                  </code>{" "}
                  (v{TRADINGVIEW_CONFIG.chartingLibraryVersion}).
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      await postAction({ action: "activate" })
                      setMessage("TradingView connection marked active (demo).")
                    }}
                    className="px-4 py-3 border border-lime-400 text-lime-400 text-[10px] uppercase font-bold tracking-widest hover:bg-lime-400 hover:text-slate-950 transition"
                    style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                  >
                    Mark connected
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await postAction({ action: "test" })
                      setMessage("Test signal sent through ingest pipeline.")
                    }}
                    className="px-4 py-3 border border-teal-400 text-teal-400 text-[10px] uppercase font-bold tracking-widest hover:bg-teal-400 hover:text-slate-950 transition"
                    style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                  >
                    Simulate signal
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await postAction({ action: "reset" })
                      setMessage("TradingView demo state reset.")
                    }}
                    className="px-4 py-3 border border-slate-600 text-slate-300 text-[10px] uppercase font-bold tracking-widest hover:border-red-400 hover:text-red-300 transition"
                    style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                  >
                    Reset demo state
                  </button>
                </div>
              </div>

              <TradingViewSetupChecklist
                steps={snapshot.connection.setupSteps}
                onToggle={(stepId: TradingViewSetupStepId, completed) =>
                  postAction({ action: "mark_step", stepId, completed })
                }
              />

              <div className="glass-panel p-6 border-slate-800">
                <h2
                  className="text-lg font-bold uppercase tracking-tighter mb-3"
                  style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                >
                  Full onboarding
                </h2>
                <p className="text-xs text-slate-400 mb-4">
                  Need the step-by-step alert JSON walkthrough? Open the dedicated connection
                  point.
                </p>
                <Link
                  href="/connect/tradingview"
                  className="inline-block text-[10px] uppercase tracking-widest text-teal-400 hover:text-lime-400"
                  style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                >
                  Go to /connect/tradingview →
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
