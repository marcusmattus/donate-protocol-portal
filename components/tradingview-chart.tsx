"use client"

import { useEffect, useId, useRef, useState } from "react"

const TV_SCRIPT = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
const TV_MINI_SCRIPT = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js"

// Donate Protocol terminal palette, handed to TradingView so the embed does not
// fight the rest of the console.
const TV_THEME = {
  theme: "dark",
  backgroundColor: "rgba(2, 6, 23, 1)",
  gridColor: "rgba(20, 184, 166, 0.06)",
} as const

export interface TradingViewChartProps {
  /** TradingView symbol, e.g. "BINANCE:SOLUSDT" or "COINBASE:SOLUSD". */
  symbol: string
  /** TradingView interval code: 1, 5, 15, 60, 240, D, W. */
  interval?: string
  height?: number
  /** Study overlays, e.g. ["STD;EMA"]. */
  studies?: string[]
  className?: string
}

/**
 * Real TradingView Advanced Chart embed.
 *
 * The widget is injected as a <script> whose JSON body is the config, which is
 * how TradingView's embed contract works — there is no npm package for it. The
 * container is fully torn down on unmount/prop change so a re-render never
 * stacks two charts.
 */
export function TradingViewChart({
  symbol,
  interval = "60",
  height = 460,
  studies,
  className = "",
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const domId = `tv-chart-${useId().replace(/[^a-zA-Z0-9]/g, "")}`

  useEffect(() => {
    const host = containerRef.current
    if (!host) return

    setFailed(false)
    host.innerHTML = ""

    const widgetSlot = document.createElement("div")
    widgetSlot.className = "tradingview-widget-container__widget"
    widgetSlot.style.height = "100%"
    host.appendChild(widgetSlot)

    const script = document.createElement("script")
    script.src = TV_SCRIPT
    script.async = true
    script.type = "text/javascript"
    script.onerror = () => setFailed(true)
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: "Etc/UTC",
      style: "1",
      locale: "en",
      ...TV_THEME,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      save_image: false,
      studies: studies ?? [],
      support_host: "https://www.tradingview.com",
    })
    host.appendChild(script)

    return () => {
      host.innerHTML = ""
    }
  }, [symbol, interval, studies, domId])

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div
        id={domId}
        ref={containerRef}
        className="tradingview-widget-container h-full w-full"
        style={{ height: "100%", width: "100%" }}
      />
      {failed && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/60 text-center text-[11px] uppercase tracking-widest text-slate-500"
          style={{ fontFamily: "var(--font-jetbrains), monospace" }}
        >
          TradingView chart unavailable — network blocked
        </div>
      )}
    </div>
  )
}

export interface TradingViewMiniChartProps {
  symbol: string
  height?: number
  /** "1D" | "1M" | "3M" | "12M" | "60M" | "ALL" */
  dateRange?: string
  className?: string
}

/** Compact sparkline embed for cards and sidebars. */
export function TradingViewMiniChart({
  symbol,
  height = 160,
  dateRange = "1D",
  className = "",
}: TradingViewMiniChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = containerRef.current
    if (!host) return

    host.innerHTML = ""
    const widgetSlot = document.createElement("div")
    widgetSlot.className = "tradingview-widget-container__widget"
    host.appendChild(widgetSlot)

    const script = document.createElement("script")
    script.src = TV_MINI_SCRIPT
    script.async = true
    script.type = "text/javascript"
    script.innerHTML = JSON.stringify({
      symbol,
      width: "100%",
      height,
      locale: "en",
      dateRange,
      colorTheme: "dark",
      isTransparent: true,
      autosize: false,
      largeChartUrl: "",
    })
    host.appendChild(script)

    return () => {
      host.innerHTML = ""
    }
  }, [symbol, height, dateRange])

  return (
    <div
      ref={containerRef}
      className={`tradingview-widget-container ${className}`}
      style={{ height }}
    />
  )
}
