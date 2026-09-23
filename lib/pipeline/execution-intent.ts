/**
 * Execution Intent.
 *
 * The only object an exchange connector will accept. It exists so that the step
 * between "the risk engine approved something" and "an order was placed" is a
 * durable, auditable artifact rather than a function call — a signal cannot
 * reach a venue without one, and every intent names the risk assessment that
 * authorized it.
 *
 * `createExecutionIntent` refuses to mint an intent for a rejected assessment,
 * so the invariant "no execution without risk approval" is enforced by the type
 * that carries the order, not by the discipline of each call site.
 */

import { NormalizedSignal } from "@/lib/pipeline/signal"
import { RiskAssessment } from "@/lib/pipeline/risk-engine"
import * as audit from "@/lib/pipeline/audit"

export type ExecutionVenue = "paper" | "live"
export type IntentStatus = "created" | "submitted" | "filled" | "cancelled" | "failed"

export interface ExecutionIntent {
  id: string
  correlationId: string
  userId: string
  symbol: string
  side: "BUY" | "SELL" | "CLOSE"
  notional: number
  venue: ExecutionVenue
  strategyId: string | null
  /** The assessment that authorized this intent. */
  riskDecision: RiskAssessment["decision"]
  riskConfidence: number
  status: IntentStatus
  createdAt: number
  /** Populated by the exchange connector on submission. */
  exchangeOrderId: string | null
  filledNotional: number
  realizedPnl: number | null
}

const INTENTS: ExecutionIntent[] = []

export class ExecutionAuthorizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ExecutionAuthorizationError"
  }
}

export function createExecutionIntent(
  signal: NormalizedSignal,
  assessment: RiskAssessment
): ExecutionIntent {
  if (assessment.decision === "reject") {
    audit.append({
      correlationId: signal.correlationId,
      stage: "execution_intent",
      outcome: "rejected",
      userId: signal.userId,
      summary: "refused to create an execution intent for a rejected risk assessment",
      detail: { symbol: signal.symbol.tv, side: signal.side },
    })
    throw new ExecutionAuthorizationError(
      "cannot create an execution intent from a rejected risk assessment"
    )
  }
  if (assessment.approvedNotional <= 0) {
    throw new ExecutionAuthorizationError("risk engine approved a zero notional")
  }
  if (assessment.correlationId !== signal.correlationId) {
    // A mismatch means the assessment belongs to a different signal.
    throw new ExecutionAuthorizationError("risk assessment does not belong to this signal")
  }

  const venue: ExecutionVenue = assessment.decision === "paper_only" ? "paper" : "live"

  const intent: ExecutionIntent = {
    id: `intent_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    correlationId: signal.correlationId,
    userId: signal.userId,
    symbol: signal.symbol.tv,
    side: signal.side,
    notional: assessment.approvedNotional,
    venue,
    strategyId: signal.strategyId,
    riskDecision: assessment.decision,
    riskConfidence: assessment.confidence,
    status: "created",
    createdAt: Date.now(),
    exchangeOrderId: null,
    filledNotional: 0,
    realizedPnl: null,
  }

  INTENTS.push(intent)

  audit.append({
    correlationId: signal.correlationId,
    stage: "execution_intent",
    outcome: "ok",
    userId: signal.userId,
    summary: `created ${venue} execution intent for ${intent.symbol} ${intent.side} at ${intent.notional}`,
    detail: {
      intentId: intent.id, venue, notional: intent.notional,
      riskDecision: assessment.decision, riskConfidence: assessment.confidence,
    },
  })

  return intent
}

export function listIntents(userId?: string, limit = 50): ExecutionIntent[] {
  const rows = userId ? INTENTS.filter((i) => i.userId === userId) : INTENTS
  return rows.slice(-limit).reverse()
}

export function findIntent(id: string): ExecutionIntent | undefined {
  return INTENTS.find((i) => i.id === id)
}

/** Test seam. */
export function resetIntents(): void {
  INTENTS.length = 0
}
