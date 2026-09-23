/**
 * Signal Normalizer.
 *
 * Every path into the execution pipeline — a TradingView alert webhook, a
 * strategy evaluation, a copy-trade follow — produces a NormalizedSignal, and
 * nothing downstream accepts anything else. One shape in means the Risk Engine
 * has exactly one contract to reason about.
 *
 * A normalized signal is an *observation*. It carries no authority to trade.
 */

import { NormalizedSymbol, normalizeSymbol } from "@/lib/tradingview/symbols"
import * as audit from "@/lib/pipeline/audit"

export type SignalSource = "tradingview_alert" | "tradingview_screener" | "strategy" | "copy" | "manual"
export type SignalSide = "BUY" | "SELL" | "CLOSE"

export interface NormalizedSignal {
  correlationId: string
  userId: string
  source: SignalSource
  symbol: NormalizedSymbol
  side: SignalSide
  /** Price the signal was observed at, if the source supplied one. */
  price: number | null
  /** Requested size in quote currency. Advisory — the Risk Engine sizes it. */
  requestedNotional: number | null
  strategyId: string | null
  /** When the source says the signal fired. */
  firedAt: number
  /** When we received it. */
  receivedAt: number
  /** Free-form evidence from the producing stage, for the audit trail. */
  evidence: Record<string, unknown>
}

export interface NormalizationFailure {
  ok: false
  reason: string
}

export type NormalizationResult = { ok: true; signal: NormalizedSignal } | NormalizationFailure

const MAX_CLOCK_SKEW_MS = 5 * 60_000

function parseSide(raw: unknown): SignalSide | null {
  const s = String(raw ?? "").trim().toUpperCase()
  if (s === "BUY" || s === "LONG") return "BUY"
  if (s === "SELL" || s === "SHORT") return "SELL"
  if (s === "CLOSE" || s === "EXIT" || s === "FLAT") return "CLOSE"
  return null
}

function parseNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

/**
 * Normalize a raw inbound payload.
 *
 * Rejects rather than guesses: a payload missing a side or symbol is a
 * malformed signal, and inventing a default would mean inventing a trade.
 */
export function normalizeSignal(
  raw: Record<string, unknown>,
  context: { userId: string; source: SignalSource; correlationId: string }
): NormalizationResult {
  const symbolRaw = raw.symbol ?? raw.ticker
  if (!symbolRaw || typeof symbolRaw !== "string") {
    return { ok: false, reason: "missing or non-string symbol" }
  }

  const side = parseSide(raw.side ?? raw.action ?? raw.order_action)
  if (!side) {
    return { ok: false, reason: `unrecognized side: ${JSON.stringify(raw.side ?? raw.action)}` }
  }

  const symbol = normalizeSymbol(symbolRaw)
  if (!symbol.tv) return { ok: false, reason: "symbol normalized to empty" }

  const firedAtRaw = parseNumber(raw.timestamp ?? raw.time ?? raw.firedAt)
  // TradingView sends seconds in some templates and ms in others.
  const firedAt = firedAtRaw
    ? firedAtRaw > 1e12 ? firedAtRaw : firedAtRaw * 1000
    : Date.now()

  const now = Date.now()
  if (firedAt > now + MAX_CLOCK_SKEW_MS) {
    return { ok: false, reason: "signal timestamp is in the future beyond tolerated skew" }
  }

  const price = parseNumber(raw.price ?? raw.close)
  if (price !== null && price <= 0) {
    return { ok: false, reason: "price must be positive when supplied" }
  }

  const requestedNotional = parseNumber(raw.notional ?? raw.size ?? raw.contracts)
  if (requestedNotional !== null && requestedNotional < 0) {
    return { ok: false, reason: "requested size cannot be negative" }
  }

  const signal: NormalizedSignal = {
    correlationId: context.correlationId,
    userId: context.userId,
    source: context.source,
    symbol,
    side,
    price,
    requestedNotional,
    strategyId: typeof raw.strategy === "string" ? raw.strategy : typeof raw.strategyId === "string" ? raw.strategyId : null,
    firedAt,
    receivedAt: now,
    evidence: {
      inferredExchange: symbol.inferredExchange,
      instrumentType: symbol.instrumentType,
      latencyMs: now - firedAt,
    },
  }

  audit.append({
    correlationId: context.correlationId,
    stage: "signal_normalized",
    outcome: "ok",
    userId: context.userId,
    summary: `normalized ${context.source} signal ${symbol.tv} ${side}`,
    detail: {
      symbol: symbol.tv, side, price, requestedNotional,
      strategyId: signal.strategyId, latencyMs: signal.evidence.latencyMs,
      inferredExchange: symbol.inferredExchange,
    },
  })

  return { ok: true, signal }
}
