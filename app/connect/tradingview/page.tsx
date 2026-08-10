"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { TRADINGVIEW_ALERT_TEMPLATE } from "@/lib/tradingview"
import type {
  TradingViewConnectionState,
  TradingViewDashboardSnapshot,
  TradingViewSetupStepId,
} from "@/lib/tradingview"
import { TradingViewConnectionStatusCard } from "@/components/tradingview/connection-status-card"
import { TradingViewSetupChecklist } from "@/components/tradingview/setup-checklist"
import { WebhookCopyField } from "@/components/tradingview/webhook-copy"
import { TradingViewSignalFeed } from "@/components/tradingview/signal-feed"

export default function ConnectTradingViewPage() {
  const router = useRouter()
  const [snapshot, setSnapshot] = useState<TradingViewDashboardSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  )

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/tradingview/connection")
      const data = (await res.json()) as TradingViewDashboardSnapshot
      setSnapshot(data)
    } catch (error) {
      console.error("Failed to load TradingView connection", error)
      setBanner({ type: "error", text: "Failed to load connection status" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 8000)
    return () => clearInterval(id)
  }, [refresh])

  const postAction = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/tradingview/connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.snapshot) setSnapshot(data.snapshot)
    else if (data.connection) {
      setSnapshot((prev) =>
        prev
          ? { ...prev, connection: data.connection as TradingViewConnectionState }
          : prev
      )
    }
    await refresh()
    return { res, data }
  }

  const handleToggleStep = async (stepId: TradingViewSetupStepId, completed: boolean) => {
    await postAction({ action: "mark_step", stepId, completed })
  }

  const handleCopiedWebhook = async () => {
    await postAction({ action: "mark_step", stepId: "copy_webhook", completed: true })
  }

  const handleTest = async () => {
    setTesting(true)
    setBanner(null)
    try {
      const { res, data } = await postAction({ action: "test" })
      if (res.ok && data.success) {
        setBanner({
          type: "success",
          text: `Test signal succeeded: ${data.signal?.side} ${data.signal?.symbol} @ $${data.signal?.price}`,
        })
      } else {
        setBanner({
          type: "error",
          text: data.error || "Test signal failed",
        })
      }
    } catch {
      setBanner({ type: "error", text: "Could not reach test endpoint" })
    } finally {
      setTesting(false)
    }
  }

  const connection = snapshot?.connection

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 terminal-grid">
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <div className="w-full h-[2px] bg-teal-500/10 animate-scanline opacity-20" />
      </div>

      <div className="fixed top-0 left-0 right-0 z-40 border-b border-slate-800 bg-black/50 backdrop-blur px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div
            className="flex items-center gap-3 text-sm"
            style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          >
            <Link href="/" className="text-teal-400 hover:text-lime-400 transition">
              HOME
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">CONNECT</span>
            <span className="text-slate-600">/</span>
            <span className="text-white">TRADINGVIEW</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-slate-400 hover:text-slate-200 transition text-[10px] uppercase tracking-widest"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push("/dashboard/signals")}
              className="text-teal-400 hover:text-lime-400 transition text-[10px] uppercase tracking-widest"
            >
              Signals
            </button>
          </div>
        </div>
      </div>

      <main className="relative z-10 pt-28 pb-20 px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <header>
            <div
              className="text-[10px] uppercase tracking-widest text-teal-400 mb-3"
              style={{ fontFamily: "var(--font-jetbrains), monospace" }}
            >
              Integration connection point
            </div>
            <h1
              className="text-4xl md:text-5xl font-extrabold uppercase tracking-tighter mb-4"
              style={{ fontFamily: "var(--font-inter), sans-serif" }}
            >
              Connect <span className="text-teal-400">TradingView</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Route TradingView alerts into Donate Protocol. Alerts hit your webhook, get
              normalized into demo trade signals, and can trigger simulated profit → donation
              routing. No real funds move — this stays on the demo / Devnet simulation path.
            </p>
          </header>

          {banner && (
            <div
              className={`border px-4 py-3 text-sm ${
                banner.type === "success"
                  ? "border-lime-500/40 bg-lime-500/10 text-lime-300"
                  : "border-red-500/40 bg-red-500/10 text-red-300"
              }`}
            >
              {banner.text}
            </div>
          )}

          {loading || !connection ? (
            <div className="text-slate-400 py-12 text-center">Loading connection…</div>
          ) : (
            <>
              <TradingViewConnectionStatusCard connection={connection} />

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6 border-teal-500/20 space-y-6">
                  <h2
                    className="text-lg font-bold uppercase tracking-tighter"
                    style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                  >
                    Webhook setup
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    In TradingView, open an alert → Notifications → Webhook URL. Paste the URL
                    below, then use the JSON message template so Donate Protocol can map
                    symbol, side, price, and strategy.
                  </p>

                  <WebhookCopyField
                    label="Webhook URL"
                    value={connection.webhookUrl}
                    onCopied={handleCopiedWebhook}
                  />
                  <WebhookCopyField label="Webhook token" value={connection.token} />

                  <div className="space-y-2">
                    <div
                      className="text-[10px] uppercase tracking-widest text-slate-500"
                      style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                    >
                      Alert message template
                    </div>
                    <pre className="bg-black/50 border border-slate-800 p-4 text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                      {TRADINGVIEW_ALERT_TEMPLATE}
                    </pre>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(TRADINGVIEW_ALERT_TEMPLATE)
                        await postAction({
                          action: "mark_step",
                          stepId: "paste_payload",
                          completed: true,
                        })
                        await postAction({
                          action: "mark_step",
                          stepId: "create_alert",
                          completed: true,
                        })
                      }}
                      className="text-[10px] uppercase tracking-widest text-teal-400 hover:text-lime-400"
                      style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                    >
                      Copy template & mark alert steps
                    </button>
                  </div>
                </div>

                <TradingViewSetupChecklist
                  steps={connection.setupSteps}
                  onToggle={handleToggleStep}
                />
              </div>

              <div className="glass-panel p-6 border-lime-500/20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h2
                      className="text-lg font-bold uppercase tracking-tighter text-lime-400"
                      style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                    >
                      Test connection
                    </h2>
                    <p className="text-xs text-slate-400 mt-2">
                      Sends a simulated TradingView alert through the same ingest pipeline as a
                      live webhook — updates connection status and the signal feed.
                    </p>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      type="button"
                      disabled={testing}
                      onClick={handleTest}
                      className="px-5 py-3 border border-lime-400 text-lime-400 text-[10px] uppercase font-bold tracking-widest hover:bg-lime-400 hover:text-slate-950 transition disabled:opacity-50"
                      style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                    >
                      {testing ? "Sending…" : "Simulate signal"}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/dashboard/signals")}
                      className="px-5 py-3 border border-slate-600 text-slate-300 text-[10px] uppercase font-bold tracking-widest hover:border-teal-400 hover:text-teal-400 transition"
                      style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                    >
                      Open signal feed
                    </button>
                  </div>
                </div>

                {(connection.status === "test_succeeded" ||
                  connection.status === "receiving_signals") && (
                  <div className="border border-lime-500/30 bg-lime-500/10 px-4 py-3 text-sm text-lime-300 mb-4">
                    Connection path verified. Incoming TradingView alerts will appear on the
                    dashboard.
                  </div>
                )}
                {connection.status === "error" && (
                  <div className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 mb-4">
                    Last attempt failed
                    {connection.lastError ? `: ${connection.lastError}` : "."} Check your token
                    and alert JSON, then retry.
                  </div>
                )}
              </div>

              <div className="glass-panel p-6 border-teal-500/20">
                <h2
                  className="text-lg font-bold uppercase tracking-tighter mb-4"
                  style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                >
                  Recent TradingView signals
                </h2>
                <TradingViewSignalFeed
                  signals={snapshot.recentSignals}
                  emptyLabel="No signals yet — run Simulate signal or fire a TradingView alert"
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
