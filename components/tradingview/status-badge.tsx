"use client"

import {
  statusLabel,
  statusTone,
  type TradingViewConnectionStatus,
} from "@/lib/tradingview"

const TONE_CLASSES: Record<ReturnType<typeof statusTone>, string> = {
  success: "border-lime-400/40 bg-lime-500/10 text-lime-400",
  warning: "border-amber-400/40 bg-amber-500/10 text-amber-300",
  danger: "border-red-400/40 bg-red-500/10 text-red-400",
  neutral: "border-slate-700 bg-slate-900/60 text-slate-300",
}

export function TradingViewStatusBadge({
  status,
}: {
  status: TradingViewConnectionStatus
}) {
  const tone = statusTone(status)
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 border text-[10px] uppercase font-bold tracking-widest ${TONE_CLASSES[tone]}`}
      style={{ fontFamily: "var(--font-jetbrains), monospace" }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          tone === "success"
            ? "bg-lime-400 animate-pulse"
            : tone === "danger"
              ? "bg-red-400"
              : tone === "warning"
                ? "bg-amber-300"
                : "bg-slate-500"
        }`}
      />
      {statusLabel(status)}
    </span>
  )
}
