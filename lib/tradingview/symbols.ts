/**
 * Symbol normalization between Donate Protocol and TradingView.
 *
 * TradingView addresses instruments as EXCHANGE:TICKER (BINANCE:BTCUSDT).
 * Donate Protocol's existing surfaces speak bare tickers (SOLUSDT) inherited
 * from the webhook payloads, so everything crossing into TradingView passes
 * through here rather than through ad-hoc string concatenation at call sites.
 */

export type InstrumentType = "crypto" | "stock" | "forex" | "futures" | "index" | "unknown"

export interface NormalizedSymbol {
  /** EXCHANGE:TICKER, the form TradingView expects. */
  tv: string
  exchange: string
  ticker: string
  instrumentType: InstrumentType
  /** True when the exchange was assumed rather than supplied. */
  inferredExchange: boolean
}

const DEFAULT_CRYPTO_EXCHANGE = process.env.TRADINGVIEW_DEFAULT_CRYPTO_EXCHANGE || "BINANCE"
const DEFAULT_STOCK_EXCHANGE = process.env.TRADINGVIEW_DEFAULT_STOCK_EXCHANGE || "NASDAQ"

const CRYPTO_QUOTES = ["USDT", "USDC", "USD", "BTC", "ETH", "BUSD", "DAI", "TUSD", "FDUSD"]
const KNOWN_CRYPTO_EXCHANGES = new Set([
  "BINANCE", "COINBASE", "KRAKEN", "BYBIT", "OKX", "BITSTAMP", "BITFINEX", "KUCOIN", "GATEIO", "MEXC",
])
const KNOWN_STOCK_EXCHANGES = new Set([
  "NASDAQ", "NYSE", "AMEX", "LSE", "TSX", "XETR", "EURONEXT", "ASX", "TSE", "HKEX", "BSE", "NSE",
])

function classify(exchange: string, ticker: string): InstrumentType {
  if (KNOWN_CRYPTO_EXCHANGES.has(exchange)) return "crypto"
  if (KNOWN_STOCK_EXCHANGES.has(exchange)) return "stock"
  if (exchange === "FX" || exchange === "OANDA" || exchange === "FX_IDC") return "forex"
  if (exchange === "CME" || exchange === "COMEX" || exchange === "NYMEX" || exchange === "CBOT") return "futures"
  if (exchange === "SP" || exchange === "TVC" || exchange === "DJ") return "index"
  if (CRYPTO_QUOTES.some((q) => ticker.endsWith(q))) return "crypto"
  return "unknown"
}

/**
 * Accepts "BINANCE:BTCUSDT", "BTCUSDT", "BTC/USDT", "btc-usdt" or "AAPL".
 * Never throws: an unparseable input still yields a usable TradingView string,
 * with `inferredExchange` telling the caller not to trust it blindly.
 */
export function normalizeSymbol(input: string, hint?: InstrumentType): NormalizedSymbol {
  const raw = String(input ?? "").trim()
  if (!raw) {
    return { tv: "", exchange: "", ticker: "", instrumentType: "unknown", inferredExchange: false }
  }

  if (raw.includes(":")) {
    const [ex, ...rest] = raw.split(":")
    const exchange = ex.trim().toUpperCase()
    const ticker = rest.join(":").trim().toUpperCase().replace(/[/\-_\s]/g, "")
    return {
      tv: `${exchange}:${ticker}`,
      exchange,
      ticker,
      instrumentType: hint ?? classify(exchange, ticker),
      inferredExchange: false,
    }
  }

  const ticker = raw.toUpperCase().replace(/[/\-_\s]/g, "")
  const looksCrypto = hint === "crypto" || CRYPTO_QUOTES.some((q) => ticker.endsWith(q))
  const exchange = looksCrypto ? DEFAULT_CRYPTO_EXCHANGE : DEFAULT_STOCK_EXCHANGE

  return {
    tv: `${exchange}:${ticker}`,
    exchange,
    ticker,
    instrumentType: hint ?? (looksCrypto ? "crypto" : "stock"),
    inferredExchange: true,
  }
}

export function normalizeMany(inputs: string[], hint?: InstrumentType): NormalizedSymbol[] {
  return inputs.map((i) => normalizeSymbol(i, hint))
}

/** Strip the exchange, for surfaces that display bare tickers. */
export function bareTicker(tvSymbol: string): string {
  return tvSymbol.includes(":") ? tvSymbol.split(":").slice(1).join(":") : tvSymbol
}

/** TradingView interval codes. */
export const TV_INTERVALS = ["1", "5", "15", "30", "60", "120", "240", "1D", "1W", "1M"] as const
export type TvInterval = (typeof TV_INTERVALS)[number]

const INTERVAL_ALIASES: Record<string, TvInterval> = {
  "1m": "1", "5m": "5", "15m": "15", "30m": "30",
  "1h": "60", "2h": "120", "4h": "240",
  d: "1D", "1d": "1D", daily: "1D",
  w: "1W", "1w": "1W", weekly: "1W",
  mo: "1M", "1mo": "1M", monthly: "1M",
}

export function normalizeInterval(input: string | undefined, fallback: TvInterval = "60"): TvInterval {
  if (!input) return fallback
  const raw = String(input).trim()
  if ((TV_INTERVALS as readonly string[]).includes(raw)) return raw as TvInterval
  const alias = INTERVAL_ALIASES[raw.toLowerCase()]
  return alias ?? fallback
}
