/**
 * Normalize TradingView alert / webhook payloads into internal signal objects.
 */

import type { TradeSignal } from "@/lib/types"
import type {
  TradingViewSignal,
  TradingViewWebhookEvent,
  TradingViewWebhookPayload,
} from "./types"

const BUY_ALIASES = new Set(["buy", "long", "enter_long", "entry_long", "b"])
const SELL_ALIASES = new Set(["sell", "short", "enter_short", "entry_short", "exit", "s"])

export interface NormalizeResult {
  valid: boolean
  signal?: Omit<TradingViewSignal, "id" | "webhookEventId" | "token" | "status" | "pnl">
  error?: string
  tradeSignal?: Omit<TradeSignal, "id" | "status" | "pnl">
}

function asString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  const s = String(value).trim()
  return s.length ? s : undefined
}

function parseSide(raw: string | undefined): "BUY" | "SELL" | null {
  if (!raw) return null
  const normalized = raw.trim().toLowerCase()
  if (BUY_ALIASES.has(normalized) || normalized === "buy") return "BUY"
  if (SELL_ALIASES.has(normalized) || normalized === "sell") return "SELL"
  // TradingView strategy.order.action sometimes returns "buy" / "sell" with extras
  if (normalized.includes("buy") || normalized.includes("long")) return "BUY"
  if (normalized.includes("sell") || normalized.includes("short")) return "SELL"
  return null
}

function parsePrice(raw: string | number | undefined): number | null {
  if (raw === undefined || raw === null || raw === "") return null
  const n = typeof raw === "number" ? raw : parseFloat(String(raw).replace(/[^0-9.+-eE]/g, ""))
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

/**
 * Validate and map a TradingView webhook body to a normalized signal draft.
 */
export function normalizeTradingViewPayload(payload: TradingViewWebhookPayload): NormalizeResult {
  if (!payload || typeof payload !== "object") {
    return { valid: false, error: "Payload must be a JSON object" }
  }

  const symbol = asString(payload.symbol) || asString(payload.ticker)
  const sideRaw =
    asString(payload.side) || asString(payload.action) || asString(payload.order)
  const side = parseSide(sideRaw)
  const price = parsePrice(payload.price ?? payload.close)
  const strategy =
    asString(payload.strategy) || asString(payload.strategy_id) || "momentum-alpha"
  const timestamp =
    asString(payload.timestamp) || asString(payload.time) || new Date().toISOString()

  if (!symbol) {
    return { valid: false, error: "Missing required field: symbol (or ticker)" }
  }
  if (!side) {
    return {
      valid: false,
      error: "Missing or invalid side/action (expected BUY or SELL)",
    }
  }
  if (price === null) {
    return { valid: false, error: "Missing or invalid price (or close)" }
  }

  const signal = {
    symbol: symbol.toUpperCase(),
    side,
    price,
    strategy,
    timestamp,
    source: "tradingview" as const,
    interval: asString(payload.interval),
    exchange: asString(payload.exchange),
    comment: asString(payload.comment),
  }

  return {
    valid: true,
    signal,
    tradeSignal: {
      symbol: signal.symbol,
      side: signal.side,
      price: signal.price,
      strategy: signal.strategy,
      timestamp: signal.timestamp,
    },
  }
}

/**
 * Build a webhook event record from a raw payload + normalize attempt.
 */
export function createWebhookEvent(params: {
  token: string
  rawPayload: TradingViewWebhookPayload
  source?: TradingViewWebhookEvent["source"]
  signalId?: string
}): TradingViewWebhookEvent {
  const receivedAt = new Date().toISOString()
  const id = `tv-evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const result = normalizeTradingViewPayload(params.rawPayload)

  if (!result.valid || !result.signal) {
    return {
      id,
      token: params.token,
      receivedAt,
      rawPayload: params.rawPayload,
      normalized: null,
      valid: false,
      error: result.error,
      source: params.source || "webhook",
    }
  }

  const webhookEventId = id
  const signal: TradingViewSignal = {
    id: params.signalId || `tv-sig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...result.signal,
    status: "pending",
    webhookEventId,
    token: params.token,
  }

  return {
    id,
    token: params.token,
    receivedAt,
    rawPayload: params.rawPayload,
    normalized: signal,
    valid: true,
    source: params.source || "webhook",
  }
}

/** Map a TradingViewSignal into the shared TradeSignal model. */
export function toTradeSignal(signal: TradingViewSignal): TradeSignal {
  return {
    id: signal.id,
    symbol: signal.symbol,
    side: signal.side,
    price: signal.price,
    strategy: signal.strategy,
    timestamp: signal.timestamp,
    status: signal.status,
    pnl: signal.pnl,
  }
}

/**
 * Derive connection status from counters / flags (pure helper for tests + UI).
 */
export function deriveConnectionStatus(input: {
  tokenConfigured: boolean
  setupComplete: boolean
  signalsIngested: number
  lastError: string | null
  lastTestResult: "success" | "failure" | null
}): import("./types").TradingViewConnectionStatus {
  if (input.lastError && !input.setupComplete && input.signalsIngested === 0) {
    return "error"
  }
  if (input.lastError && input.signalsIngested === 0 && input.lastTestResult === "failure") {
    return "error"
  }
  if (!input.tokenConfigured) {
    return "not_connected"
  }
  if (input.signalsIngested > 0) {
    return "receiving_signals"
  }
  if (input.lastTestResult === "success") {
    return "test_succeeded"
  }
  if (input.setupComplete) {
    return "connected"
  }
  return "setup_incomplete"
}
