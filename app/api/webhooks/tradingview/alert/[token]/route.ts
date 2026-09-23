import { NextRequest, NextResponse } from "next/server"
import { verifyWebhook } from "@/lib/pipeline/webhook-security"
import { normalizeSignal } from "@/lib/pipeline/signal"
import { assessRisk, DEFAULT_RISK_POLICY, UserRiskPolicy } from "@/lib/pipeline/risk-engine"
import { createExecutionIntent, ExecutionAuthorizationError } from "@/lib/pipeline/execution-intent"
import { build_market_context } from "@/lib/agent-tools/market-intelligence"
import { isConnected } from "@/lib/tradingview/connector"
import { currentUserId } from "@/lib/pipeline/current-user"
import * as audit from "@/lib/pipeline/audit"

/**
 * TradingView alert ingestion — the secure path.
 *
 *   verify token/signature/timestamp → deduplicate → normalize → audit
 *   → enrich with market context → Risk Engine → execution intent
 *
 * An alert never reaches an exchange connector from here. The most this
 * endpoint produces is an ExecutionIntent, which the risk engine has already
 * authorized and which a separate execution stage acts on under the user's
 * paper/live policy.
 */

function validTokens(): Set<string> {
  const raw = process.env.TRADINGVIEW_ALERT_TOKENS || process.env.WEBHOOK_SECRET || ""
  return new Set(raw.split(",").map((t) => t.trim()).filter(Boolean))
}

function policyFor(_userId: string): UserRiskPolicy {
  // Per-user policies live in settings; until that store exists, the default is
  // paper-only, which is the safe direction to be wrong in.
  return DEFAULT_RISK_POLICY
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  const correlationId = audit.newCorrelationId("tv_alert")
  const userId = currentUserId(req)

  // Read the body as text: the signature is computed over the exact bytes.
  const rawBody = await req.text()

  const tokens = validTokens()
  if (tokens.size === 0) {
    audit.append({
      correlationId, stage: "tradingview.webhook", outcome: "rejected", userId,
      summary: "alert rejected: no webhook tokens configured", detail: {},
    })
    return NextResponse.json(
      { error: "webhook is not configured", hint: "set TRADINGVIEW_ALERT_TOKENS" },
      { status: 503 }
    )
  }

  const verification = verifyWebhook({
    token,
    rawBody,
    signatureHeader: req.headers.get("x-signature") ?? req.headers.get("x-tradingview-signature"),
    timestampHeader: req.headers.get("x-timestamp"),
    validTokens: tokens,
    signingSecret: process.env.TRADINGVIEW_ALERT_SIGNING_SECRET || undefined,
  })

  if (!verification.ok) {
    audit.append({
      correlationId, stage: "tradingview.webhook", outcome: "rejected", userId,
      summary: `alert rejected: ${verification.failure}`,
      detail: { failure: verification.failure, digest: verification.digest },
    })
    // A replay is a duplicate, not an attack: answer 200 so TradingView stops retrying.
    const status = verification.failure === "replay" ? 200 : verification.failure === "payload_too_large" ? 413 : 401
    return NextResponse.json(
      { ok: false, rejected: verification.failure, message: verification.message },
      { status }
    )
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    audit.append({
      correlationId, stage: "tradingview.webhook", outcome: "rejected", userId,
      summary: "alert rejected: unparseable JSON", detail: { digest: verification.digest },
    })
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 })
  }

  audit.append({
    correlationId, stage: "tradingview.webhook", outcome: "ok", userId,
    summary: "alert accepted and verified",
    detail: { digest: verification.digest, keys: Object.keys(payload) },
  })

  const normalized = normalizeSignal(payload, { userId, source: "tradingview_alert", correlationId })
  if (!normalized.ok) {
    audit.append({
      correlationId, stage: "signal_normalized", outcome: "rejected", userId,
      summary: `signal rejected: ${normalized.reason}`, detail: { digest: verification.digest },
    })
    return NextResponse.json({ ok: false, error: normalized.reason, correlationId }, { status: 422 })
  }
  const signal = normalized.signal

  // Enrich with market context where TradingView is connected. When it is not,
  // the risk engine is told the calendar is unavailable rather than being left
  // to assume there are no events.
  let calendar
  let calendarUnavailable = true
  let technicalRating
  let intelligenceDegraded = false

  if (isConnected(userId)) {
    try {
      const context = await build_market_context(
        { userId, correlationId, reason: "risk_enrichment" },
        { symbol: signal.symbol.tv }
      )
      calendar = context.calendar
      calendarUnavailable = context.calendarUnavailable
      technicalRating = (context.technical ?? undefined) as Record<string, unknown> | undefined
      intelligenceDegraded = context.degraded
    } catch {
      calendarUnavailable = true
    }
  }

  const assessment = assessRisk({
    signal,
    policy: policyFor(userId),
    currentExposure: 0, // Wire to the position store when reconciliation lands.
    calendar,
    calendarUnavailable,
    technicalRating: technicalRating as { recommendation?: string } | undefined,
    intelligenceDegraded,
  })

  if (assessment.decision === "reject") {
    return NextResponse.json({
      ok: true,
      correlationId,
      accepted: true,
      executed: false,
      risk: assessment,
      reason: "risk engine rejected the signal",
    })
  }

  try {
    const intent = createExecutionIntent(signal, assessment)
    return NextResponse.json({
      ok: true,
      correlationId,
      accepted: true,
      risk: assessment,
      intent: {
        id: intent.id, venue: intent.venue, symbol: intent.symbol,
        side: intent.side, notional: intent.notional, status: intent.status,
      },
      note:
        intent.venue === "paper"
          ? "routed to paper trading by the user's risk policy"
          : "execution intent created; the exchange connector applies it under the user's live policy",
    })
  } catch (e) {
    const message = e instanceof ExecutionAuthorizationError ? e.message : "intent creation failed"
    audit.append({
      correlationId, stage: "execution_intent", outcome: "error", userId,
      summary: message, detail: {},
    })
    return NextResponse.json({ ok: false, correlationId, error: message, risk: assessment }, { status: 409 })
  }
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  await ctx.params
  return NextResponse.json({
    accepts: "POST application/json",
    pipeline: [
      "verify (token, optional HMAC signature, timestamp window)",
      "deduplicate by payload digest",
      "normalize signal",
      "audit",
      "enrich with TradingView market context",
      "risk engine",
      "execution intent (paper or live per policy)",
    ],
    note: "An alert never reaches an exchange directly. Every signal passes the risk engine.",
  })
}
