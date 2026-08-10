"use client"

import type {
  TradingViewChartActionEvent,
  TradingViewSignal,
  TradingViewWebhookEvent,
} from "@/lib/tradingview"

export function TradingViewSignalFeed({
  signals,
  emptyLabel = "No TradingView signals yet",
}: {
  signals: TradingViewSignal[]
  emptyLabel?: string
}) {
  if (!signals.length) {
    return (
      <div className="text-slate-500 text-center py-8 text-sm">{emptyLabel}</div>
    )
  }

  return (
    <div className="space-y-3">
      {signals.map((signal) => (
        <div
          key={signal.id}
          className="border border-slate-800 p-4 flex flex-col sm:flex-row sm:justify-between gap-3 hover:border-teal-500/40 transition"
        >
          <div style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
            <div className="font-bold text-white">
              <span
                className={
                  signal.side === "BUY" ? "text-lime-400" : "text-amber-300"
                }
              >
                {signal.side}
              </span>{" "}
              {signal.symbol}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {new Date(signal.timestamp).toLocaleString()} · {signal.strategy}
              {signal.comment ? ` · ${signal.comment}` : ""}
            </div>
          </div>
          <div
            className="text-left sm:text-right"
            style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          >
            <div className="font-bold text-white">${signal.price}</div>
            <div
              className={`text-[10px] font-bold ${
                signal.pnl !== undefined && signal.pnl > 0
                  ? "text-lime-400"
                  : signal.pnl !== undefined
                    ? "text-red-400"
                    : "text-slate-500"
              }`}
            >
              {signal.pnl !== undefined
                ? `${signal.pnl > 0 ? "+" : ""}${signal.pnl.toFixed(2)} · ${signal.status}`
                : signal.status}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function TradingViewEventHistory({
  events,
  actions,
}: {
  events: TradingViewWebhookEvent[]
  actions: TradingViewChartActionEvent[]
}) {
  const merged = [
    ...events.map((e) => ({
      id: e.id,
      kind: "webhook" as const,
      timestamp: e.receivedAt,
      title: e.valid ? "Webhook accepted" : "Webhook rejected",
      detail: e.valid
        ? `${e.normalized?.side} ${e.normalized?.symbol}`
        : e.error || "Invalid payload",
      ok: e.valid,
    })),
    ...actions.map((a) => ({
      id: a.id,
      kind: "action" as const,
      timestamp: a.timestamp,
      title: a.label,
      detail: a.actionId,
      ok: true,
    })),
  ]
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
    .slice(0, 20)

  if (!merged.length) {
    return (
      <div className="text-slate-500 text-center py-8 text-sm">
        No TradingView events yet
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {merged.map((item) => (
        <div
          key={item.id}
          className="border border-slate-800 px-3 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
        >
          <div style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
            <div
              className={`text-xs font-bold ${item.ok ? "text-white" : "text-red-300"}`}
            >
              {item.title}
            </div>
            <div className="text-[10px] text-slate-500 break-all">{item.detail}</div>
          </div>
          <div
            className="text-[10px] text-slate-500 uppercase tracking-widest"
            style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          >
            {new Date(item.timestamp).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )
}
