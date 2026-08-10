/**
 * TradingView integration config placeholders.
 * Swap these for real Charting Library / webhook secrets in production.
 */

export const TRADINGVIEW_CONFIG = {
  /** Demo webhook token — override with TRADINGVIEW_WEBHOOK_TOKEN */
  defaultToken:
    process.env.TRADINGVIEW_WEBHOOK_TOKEN ||
    process.env.NEXT_PUBLIC_TRADINGVIEW_WEBHOOK_TOKEN ||
    "demo123",

  /** Public app origin for webhook URL construction */
  appUrl:
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000",

  /** Optional Charting Library script path (not bundled — placeholder for future) */
  chartingLibraryPath:
    process.env.NEXT_PUBLIC_TRADINGVIEW_CHARTING_LIBRARY_PATH ||
    "/charting_library/",

  /** Optional library version pin */
  chartingLibraryVersion:
    process.env.NEXT_PUBLIC_TRADINGVIEW_CHARTING_LIBRARY_VERSION || "28.0.0",

  /** Shared webhook HMAC secret placeholder */
  webhookSecret: process.env.WEBHOOK_SECRET || "demo-secret-key",

  /** Simulated market symbols for the mocked datafeed */
  defaultSymbols: ["SOLUSDT", "BTCUSDT", "ETHUSDT", "BONKUSDT"] as const,

  supportedResolutions: ["1", "5", "15", "60", "240", "1D"] as const,
} as const

export function buildTradingViewWebhookUrl(token: string = TRADINGVIEW_CONFIG.defaultToken): string {
  const base = TRADINGVIEW_CONFIG.appUrl.replace(/\/$/, "")
  return `${base}/api/webhooks/tradingview/${token}`
}

/** JSON alert message template for TradingView alert dialogs. */
export const TRADINGVIEW_ALERT_TEMPLATE = `{
  "symbol": "{{ticker}}",
  "side": "{{strategy.order.action}}",
  "price": "{{close}}",
  "strategy": "momentum-alpha",
  "timestamp": "{{timenow}}"
}`
