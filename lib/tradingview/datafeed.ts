/**
 * Mocked TradingView Charting Library datafeed adapter.
 *
 * Implements the required datafeed methods:
 * onReady, searchSymbols, resolveSymbol, getBars, subscribeBars, unsubscribeBars
 *
 * Uses simulated OHLCV so the portal stays demo-safe. Swap the internals
 * for a real market data provider when a licensed Charting Library build is available.
 */

import { TRADINGVIEW_CONFIG } from "./config"
import type {
  ErrorCallback,
  HistoryCallback,
  OnReadyCallback,
  ResolveCallback,
  SearchSymbolsCallback,
  SubscribeBarsCallback,
  TradingViewBar,
  TradingViewDatafeedConfiguration,
  TradingViewSymbolInfo,
} from "./types"

const MOCK_SYMBOLS: TradingViewSymbolInfo[] = TRADINGVIEW_CONFIG.defaultSymbols.map((ticker) => ({
  ticker,
  name: ticker,
  description: `${ticker.replace("USDT", "")} / Tether`,
  type: "crypto",
  session: "24x7",
  timezone: "Etc/UTC",
  exchange: "DonateDemo",
  minmov: 1,
  pricescale: ticker.includes("BONK") ? 1000000 : 100,
  has_intraday: true,
  supported_resolutions: [...TRADINGVIEW_CONFIG.supportedResolutions],
  volume_precision: 2,
  data_status: "delayed_streaming",
}))

const DEFAULT_CONFIG: TradingViewDatafeedConfiguration = {
  supported_resolutions: [...TRADINGVIEW_CONFIG.supportedResolutions],
  exchanges: [
    { value: "", name: "All Exchanges", desc: "" },
    { value: "DonateDemo", name: "Donate Demo", desc: "Simulated Donate Protocol feed" },
  ],
  symbols_types: [
    { name: "All types", value: "" },
    { name: "Crypto", value: "crypto" },
  ],
  supports_marks: false,
  supports_timescale_marks: false,
  supports_time: true,
}

function resolutionToMs(resolution: string): number {
  if (resolution === "1D" || resolution === "D") return 24 * 60 * 60 * 1000
  if (resolution === "1W" || resolution === "W") return 7 * 24 * 60 * 60 * 1000
  const minutes = parseInt(resolution, 10)
  return (Number.isFinite(minutes) ? minutes : 60) * 60 * 1000
}

function seedFromSymbol(symbol: string): number {
  let hash = 0
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash * 31 + symbol.charCodeAt(i)) >>> 0
  }
  return 50 + (hash % 200)
}

/** Generate deterministic pseudo-random OHLC bars for a symbol. */
export function generateMockBars(
  symbol: string,
  from: number,
  to: number,
  resolution: string,
  countBack?: number
): TradingViewBar[] {
  const step = resolutionToMs(resolution)
  const bars: TradingViewBar[] = []
  let price = seedFromSymbol(symbol)
  const start = from * 1000
  const end = to * 1000
  const maxBars = countBack && countBack > 0 ? countBack : 500

  // Align to resolution boundary
  let t = Math.floor(start / step) * step
  let i = 0
  while (t <= end && bars.length < maxBars) {
    const wave = Math.sin((t / step + i) / 8) * (price * 0.01)
    const drift = Math.cos((t / step + i) / 17) * (price * 0.005)
    const open = price
    const close = Math.max(0.0001, price + wave + drift)
    const high = Math.max(open, close) * (1 + 0.002)
    const low = Math.min(open, close) * (1 - 0.002)
    bars.push({
      time: t,
      open: roundPrice(open, symbol),
      high: roundPrice(high, symbol),
      low: roundPrice(low, symbol),
      close: roundPrice(close, symbol),
      volume: 1000 + ((i * 97) % 5000),
    })
    price = close
    t += step
    i++
  }
  return bars
}

function roundPrice(value: number, symbol: string): number {
  const decimals = symbol.includes("BONK") ? 8 : 4
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

type Subscriber = {
  symbolInfo: TradingViewSymbolInfo
  resolution: string
  onTick: SubscribeBarsCallback
  timer: ReturnType<typeof setInterval>
  lastBar: TradingViewBar | null
}

/**
 * Charting Library–compatible datafeed (mocked).
 */
export class DonateProtocolDatafeed {
  private subscribers = new Map<string, Subscriber>()

  onReady(callback: OnReadyCallback): void {
    setTimeout(() => callback(DEFAULT_CONFIG), 0)
  }

  searchSymbols(
    userInput: string,
    exchange: string,
    symbolType: string,
    onResult: SearchSymbolsCallback
  ): void {
    const q = userInput.trim().toLowerCase()
    const results = MOCK_SYMBOLS.filter((s) => {
      const matchesQuery =
        !q ||
        s.ticker.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      const matchesExchange = !exchange || s.exchange === exchange
      const matchesType = !symbolType || s.type === symbolType
      return matchesQuery && matchesExchange && matchesType
    }).map((s) => ({
      symbol: s.ticker,
      full_name: `${s.exchange}:${s.ticker}`,
      description: s.description,
      exchange: s.exchange,
      ticker: s.ticker,
      type: s.type,
    }))
    setTimeout(() => onResult(results), 0)
  }

  resolveSymbol(
    symbolName: string,
    onResolve: ResolveCallback,
    onError: ErrorCallback
  ): void {
    const cleaned = symbolName.includes(":")
      ? symbolName.split(":")[1]
      : symbolName
    const info = MOCK_SYMBOLS.find(
      (s) => s.ticker.toUpperCase() === cleaned.toUpperCase()
    )
    if (!info) {
      setTimeout(() => onError("Symbol not found"), 0)
      return
    }
    setTimeout(() => onResolve({ ...info }), 0)
  }

  getBars(
    symbolInfo: TradingViewSymbolInfo,
    resolution: string,
    periodParams: {
      from: number
      to: number
      countBack?: number
      firstDataRequest?: boolean
    },
    onResult: HistoryCallback,
    onError: ErrorCallback
  ): void {
    try {
      const bars = generateMockBars(
        symbolInfo.ticker,
        periodParams.from,
        periodParams.to,
        resolution,
        periodParams.countBack
      )
      if (!bars.length) {
        onResult([], { noData: true })
        return
      }
      onResult(bars, { noData: false })
    } catch (err) {
      onError(err instanceof Error ? err.message : "getBars failed")
    }
  }

  subscribeBars(
    symbolInfo: TradingViewSymbolInfo,
    resolution: string,
    onTick: SubscribeBarsCallback,
    listenerGuid: string,
    _onResetCacheNeededCallback?: () => void
  ): void {
    if (this.subscribers.has(listenerGuid)) {
      this.unsubscribeBars(listenerGuid)
    }

    const step = resolutionToMs(resolution)
    const now = Date.now()
    const seedBars = generateMockBars(
      symbolInfo.ticker,
      Math.floor((now - step * 5) / 1000),
      Math.floor(now / 1000),
      resolution,
      5
    )
    let lastBar = seedBars[seedBars.length - 1] || null

    const timer = setInterval(() => {
      if (!lastBar) return
      const jitter = (Math.random() - 0.5) * lastBar.close * 0.001
      const close = Math.max(0.0001, lastBar.close + jitter)
      const bar: TradingViewBar = {
        time: lastBar.time,
        open: lastBar.open,
        high: Math.max(lastBar.high, close),
        low: Math.min(lastBar.low, close),
        close: roundPrice(close, symbolInfo.ticker),
        volume: (lastBar.volume || 0) + Math.floor(Math.random() * 50),
      }
      // Roll into a new bar when the resolution window elapses
      if (Date.now() - lastBar.time >= step) {
        bar.time = lastBar.time + step
        bar.open = lastBar.close
        bar.high = Math.max(bar.open, close)
        bar.low = Math.min(bar.open, close)
        bar.volume = Math.floor(Math.random() * 200)
      }
      lastBar = bar
      const sub = this.subscribers.get(listenerGuid)
      if (sub) sub.lastBar = bar
      onTick(bar)
    }, 2000)

    this.subscribers.set(listenerGuid, {
      symbolInfo,
      resolution,
      onTick,
      timer,
      lastBar,
    })
  }

  unsubscribeBars(listenerGuid: string): void {
    const sub = this.subscribers.get(listenerGuid)
    if (sub) {
      clearInterval(sub.timer)
      this.subscribers.delete(listenerGuid)
    }
  }
}

/** Singleton factory for app usage. */
let sharedDatafeed: DonateProtocolDatafeed | null = null

export function getDonateProtocolDatafeed(): DonateProtocolDatafeed {
  if (!sharedDatafeed) {
    sharedDatafeed = new DonateProtocolDatafeed()
  }
  return sharedDatafeed
}

export function createDonateProtocolDatafeed(): DonateProtocolDatafeed {
  return new DonateProtocolDatafeed()
}
