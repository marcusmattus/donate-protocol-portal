/**
 * Donate Protocol Risk Engine.
 *
 * Independent of TradingView by design. TradingView supplies market
 * intelligence; this module decides whether a signal is eligible for execution
 * and at what size. A TradingView "STRONG_BUY" is one input among several and
 * never by itself an authorization — `technicalRating` can only ever *reduce*
 * confidence here, never grant approval on its own.
 *
 * The engine fails closed: if a check cannot be evaluated (TradingView down,
 * calendar unavailable), the unknown is treated as risk rather than as absence
 * of risk, and the policy decides whether that blocks or merely sizes down.
 */

import { NormalizedSignal } from "@/lib/pipeline/signal"
import * as audit from "@/lib/pipeline/audit"

export type RiskDecision = "approve" | "approve_reduced" | "paper_only" | "reject"

export type RiskFactorSeverity = "info" | "caution" | "elevated" | "blocking"

export interface RiskFactor {
  code: string
  severity: RiskFactorSeverity
  message: string
  /** Multiplier applied to position size, 0–1. */
  sizeMultiplier: number
}

export interface UserRiskPolicy {
  /** Hard ceiling per position, quote currency. */
  maxNotionalPerTrade: number
  /** Ceiling across all open positions. */
  maxTotalExposure: number
  /** Below this confidence, route to paper rather than live. */
  minConfidence: number
  /** Block outright when a major scheduled event lands within this window. */
  eventBlackoutMs: number
  /** Reduce rather than block when an event is this close but outside blackout. */
  eventCautionMs: number
  /** When true, nothing reaches live execution regardless of score. */
  paperTradingOnly: boolean
  /** Treat an unevaluable check as blocking rather than as a size reduction. */
  strictUnknowns: boolean
  /** Maximum tolerated signal age; older signals are stale, not tradeable. */
  maxSignalAgeMs: number
}

export const DEFAULT_RISK_POLICY: UserRiskPolicy = {
  maxNotionalPerTrade: 1_000,
  maxTotalExposure: 10_000,
  minConfidence: 0.5,
  eventBlackoutMs: 30 * 60_000,
  eventCautionMs: 4 * 3_600_000,
  paperTradingOnly: true,
  strictUnknowns: false,
  maxSignalAgeMs: 5 * 60_000,
}

/** Calendar events near the signal, supplied by the Market Intelligence layer. */
export interface CalendarEvent {
  title: string
  /** Epoch ms. */
  at: number
  /** TradingView-style importance, where available. */
  importance: "low" | "medium" | "high"
  kind: "economic" | "earnings" | "dividend"
}

export interface RiskInputs {
  signal: NormalizedSignal
  policy: UserRiskPolicy
  /** Current total exposure in quote currency. */
  currentExposure: number
  /** Upcoming events for this instrument/market, if intelligence was available. */
  calendar?: CalendarEvent[]
  /** True when the calendar could not be fetched — an unknown, not an all-clear. */
  calendarUnavailable?: boolean
  /** TradingView technical snapshot, if available. Advisory only. */
  technicalRating?: { recommendation?: string; oscillatorsRating?: number; movingAveragesRating?: number }
  /** True when market intelligence was served from stale cache. */
  intelligenceDegraded?: boolean
}

export interface RiskAssessment {
  decision: RiskDecision
  /** 0–1. Starts at 1 and is reduced by factors. */
  confidence: number
  /** Notional the engine authorizes, after all multipliers and ceilings. */
  approvedNotional: number
  factors: RiskFactor[]
  correlationId: string
  evaluatedAt: number
}

function factor(
  code: string,
  severity: RiskFactorSeverity,
  message: string,
  sizeMultiplier = 1
): RiskFactor {
  return { code, severity, message, sizeMultiplier }
}

/**
 * Assess a signal.
 *
 * Pure: no I/O, no clock beyond `now`, so it is deterministic under test and
 * the same inputs always produce the same decision — a property that matters
 * when the decision has to be defended from the audit trail later.
 */
export function assessRisk(inputs: RiskInputs, now = Date.now()): RiskAssessment {
  const { signal, policy } = inputs
  const factors: RiskFactor[] = []

  // ── Staleness ───────────────────────────────────────────────────────────
  const age = now - signal.firedAt
  if (age > policy.maxSignalAgeMs) {
    factors.push(
      factor("stale_signal", "blocking", `signal is ${Math.round(age / 1000)}s old, over the ${Math.round(policy.maxSignalAgeMs / 1000)}s limit`, 0)
    )
  }

  // ── Symbol confidence ───────────────────────────────────────────────────
  if (signal.symbol.inferredExchange) {
    factors.push(
      factor("inferred_exchange", "caution", `exchange for ${signal.symbol.ticker} was inferred, not supplied`, 0.75)
    )
  }
  if (signal.symbol.instrumentType === "unknown") {
    factors.push(factor("unknown_instrument", "elevated", "instrument type could not be classified", 0.5))
  }

  // ── Scheduled event risk ────────────────────────────────────────────────
  if (inputs.calendarUnavailable) {
    factors.push(
      policy.strictUnknowns
        ? factor("calendar_unavailable", "blocking", "event calendar unavailable and policy treats unknowns as blocking", 0)
        : factor("calendar_unavailable", "elevated", "event calendar unavailable; sizing down rather than assuming all-clear", 0.5)
    )
  } else if (inputs.calendar?.length) {
    const upcoming = inputs.calendar
      .filter((e) => e.at >= now)
      .sort((a, b) => a.at - b.at)

    for (const e of upcoming) {
      const untilMs = e.at - now
      if (e.importance === "high" && untilMs <= policy.eventBlackoutMs) {
        factors.push(
          factor("event_blackout", "blocking", `high-importance ${e.kind} event "${e.title}" in ${Math.round(untilMs / 60_000)}m`, 0)
        )
      } else if (e.importance === "high" && untilMs <= policy.eventCautionMs) {
        factors.push(
          factor("event_proximity_high", "elevated", `high-importance ${e.kind} event "${e.title}" in ${Math.round(untilMs / 60_000)}m`, 0.4)
        )
      } else if (e.importance === "medium" && untilMs <= policy.eventBlackoutMs) {
        factors.push(
          factor("event_proximity_medium", "caution", `medium-importance ${e.kind} event "${e.title}" in ${Math.round(untilMs / 60_000)}m`, 0.7)
        )
      }
    }
  }

  // ── Market intelligence quality ─────────────────────────────────────────
  if (inputs.intelligenceDegraded) {
    factors.push(factor("degraded_intelligence", "caution", "market intelligence served from stale cache", 0.8))
  }

  // ── Technical context (advisory, can only reduce) ────────────────────────
  const rec = inputs.technicalRating?.recommendation?.toUpperCase()
  if (rec) {
    const contradicts =
      (signal.side === "BUY" && (rec === "SELL" || rec === "STRONG_SELL")) ||
      (signal.side === "SELL" && (rec === "BUY" || rec === "STRONG_BUY"))
    if (contradicts) {
      factors.push(
        factor("technical_contradiction", "elevated", `TradingView technical rating (${rec}) contradicts a ${signal.side} signal`, 0.5)
      )
    }
  }

  // ── Exposure ceilings ───────────────────────────────────────────────────
  if (inputs.currentExposure >= policy.maxTotalExposure) {
    factors.push(
      factor("exposure_ceiling", "blocking", `total exposure ${inputs.currentExposure} is at or over the ${policy.maxTotalExposure} ceiling`, 0)
    )
  }

  // ── Resolve ─────────────────────────────────────────────────────────────
  const blocking = factors.filter((f) => f.severity === "blocking")
  const confidence = factors.reduce((c, f) => c * f.sizeMultiplier, 1)

  const requested = signal.requestedNotional ?? policy.maxNotionalPerTrade
  const headroom = Math.max(0, policy.maxTotalExposure - inputs.currentExposure)
  const approvedNotional = blocking.length
    ? 0
    : Math.max(0, Math.min(requested * confidence, policy.maxNotionalPerTrade, headroom))

  let decision: RiskDecision
  if (blocking.length) decision = "reject"
  else if (policy.paperTradingOnly) decision = "paper_only"
  else if (confidence < policy.minConfidence) decision = "paper_only"
  else if (confidence < 1) decision = "approve_reduced"
  else decision = "approve"

  const assessment: RiskAssessment = {
    decision,
    confidence: Math.round(confidence * 1000) / 1000,
    approvedNotional: Math.round(approvedNotional * 100) / 100,
    factors,
    correlationId: signal.correlationId,
    evaluatedAt: now,
  }

  audit.append({
    correlationId: signal.correlationId,
    stage: "risk_decision",
    outcome: decision === "reject" ? "rejected" : "ok",
    userId: signal.userId,
    summary: `risk ${decision} for ${signal.symbol.tv} ${signal.side} at confidence ${assessment.confidence}`,
    detail: {
      decision,
      confidence: assessment.confidence,
      approvedNotional: assessment.approvedNotional,
      requestedNotional: signal.requestedNotional,
      factors: factors.map((f) => ({ code: f.code, severity: f.severity, message: f.message })),
      policy: {
        paperTradingOnly: policy.paperTradingOnly,
        maxNotionalPerTrade: policy.maxNotionalPerTrade,
        minConfidence: policy.minConfidence,
        strictUnknowns: policy.strictUnknowns,
      },
    },
  })

  return assessment
}
