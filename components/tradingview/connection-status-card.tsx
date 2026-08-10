"use client"

import {
  summarizeLastSignal,
  type TradingViewConnectionState,
} from "@/lib/tradingview"
import { TradingViewStatusBadge } from "./status-badge"

export function TradingViewConnectionStatusCard({
  connection,
  compact = false,
}: {
  connection: TradingViewConnectionState
  compact?: boolean
}) {
  return (
    <div className={`glass-panel border-teal-500/20 ${compact ? "p-5" : "p-6"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div
            className="text-[10px] uppercase tracking-widest text-slate-500 mb-2"
            style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          >
            TradingView connection
          </div>
          <TradingViewStatusBadge status={connection.status} />
        </div>
        <div
          className={`text-[10px] uppercase tracking-widest ${
            connection.isActive ? "text-lime-400" : "text-slate-500"
          }`}
          style={{ fontFamily: "var(--font-jetbrains), monospace" }}
        >
          {connection.isActive ? "Active" : "Inactive"}
        </div>
      </div>

      <div className={`grid ${compact ? "grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"} gap-4`}>
        <Metric
          label="Signals ingested"
          value={String(connection.signalsIngested)}
        />
        <Metric
          label="Last webhook"
          value={
            connection.lastWebhookAt
              ? new Date(connection.lastWebhookAt).toLocaleString()
              : "—"
          }
        />
        <Metric
          label="Latest signal"
          value={summarizeLastSignal(connection.lastSignal)}
          wide
        />
        <Metric
          label="Last test"
          value={
            connection.lastTestResult
              ? `${connection.lastTestResult}${
                  connection.lastTestAt
                    ? ` · ${new Date(connection.lastTestAt).toLocaleString()}`
                    : ""
                }`
              : "—"
          }
        />
      </div>

      {connection.lastError && (
        <div className="mt-4 border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {connection.lastError}
        </div>
      )}
    </div>
  )
}

function Metric({
  label,
  value,
  wide,
}: {
  label: string
  value: string
  wide?: boolean
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <div
        className="text-[10px] uppercase tracking-widest text-slate-500 mb-1"
        style={{ fontFamily: "var(--font-jetbrains), monospace" }}
      >
        {label}
      </div>
      <div
        className="text-sm text-white break-words"
        style={{ fontFamily: "var(--font-jetbrains), monospace" }}
      >
        {value}
      </div>
    </div>
  )
}
