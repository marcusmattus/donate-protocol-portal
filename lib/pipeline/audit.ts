/**
 * Immutable audit ledger and correlation IDs.
 *
 * Every TradingView MCP invocation that influences a strategy, alert, risk
 * decision or execution intent is represented here, chained to the correlation
 * ID of the signal that caused it. The ledger is append-only by construction:
 * `append` deep-freezes the event and `list` hands back copies, so a later
 * stage cannot quietly rewrite the record of an earlier one.
 *
 * Each event carries the hash of its predecessor, so a gap or an edit is
 * detectable after the fact via `verifyChain()` — the property that makes this
 * an audit trail rather than a log.
 */

import crypto from "crypto"

export type AuditStage =
  | "tradingview.mcp_call"
  | "tradingview.oauth"
  | "tradingview.webhook"
  | "market_intelligence"
  | "strategy"
  | "signal_normalized"
  | "risk_decision"
  | "execution_intent"
  | "execution"
  | "reconciliation"
  | "donation"
  | "notification"

export type AuditOutcome = "ok" | "rejected" | "error" | "degraded"

export interface AuditEvent {
  readonly id: string
  readonly correlationId: string
  readonly seq: number
  readonly ts: number
  readonly stage: AuditStage
  readonly outcome: AuditOutcome
  readonly userId: string
  readonly summary: string
  /** Stage-specific detail. Must never contain credentials. */
  readonly detail: Readonly<Record<string, unknown>>
  readonly prevHash: string | null
  readonly hash: string
}

const LEDGER: AuditEvent[] = []
const MAX_EVENTS = Number(process.env.AUDIT_LEDGER_MAX ?? 10_000)

/** Keys that must never be written to the ledger, at any nesting depth. */
const REDACT_KEYS = new Set([
  "access_token", "accesstoken", "refresh_token", "refreshtoken", "token", "bearer",
  "authorization", "code_verifier", "codeverifier", "client_secret", "clientsecret",
  "password", "secret", "apikey", "api_key", "apisecret", "api_secret",
  "privatekey", "private_key", "mnemonic", "seed", "cookie", "webhooksecret", "webhook_secret",
])

/**
 * Strip credential-shaped values before they reach the ledger.
 *
 * Belt and braces: call sites are not supposed to pass secrets, but the audit
 * trail is exactly the artifact that gets exported and shared, so it enforces
 * the rule itself rather than trusting every future caller.
 */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[depth-limit]"
  if (value === null || typeof value !== "object") return value
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1))

  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (REDACT_KEYS.has(k.toLowerCase().replace(/[-\s]/g, "_")) || REDACT_KEYS.has(k.toLowerCase())) {
      out[k] = "[redacted]"
    } else {
      out[k] = redact(v, depth + 1)
    }
  }
  return out
}

function deepFreeze<T>(o: T): T {
  if (o && typeof o === "object" && !Object.isFrozen(o)) {
    Object.freeze(o)
    for (const v of Object.values(o as Record<string, unknown>)) deepFreeze(v)
  }
  return o
}

export function newCorrelationId(prefix = "corr"): string {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(8).toString("hex")}`
}

function hashEvent(e: Omit<AuditEvent, "hash">): string {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        id: e.id, correlationId: e.correlationId, seq: e.seq, ts: e.ts,
        stage: e.stage, outcome: e.outcome, userId: e.userId,
        summary: e.summary, detail: e.detail, prevHash: e.prevHash,
      })
    )
    .digest("hex")
}

export function append(input: {
  correlationId: string
  stage: AuditStage
  outcome: AuditOutcome
  userId: string
  summary: string
  detail?: Record<string, unknown>
}): AuditEvent {
  const prev = LEDGER.length > 0 ? LEDGER[LEDGER.length - 1] : null
  const base = {
    id: `evt_${crypto.randomBytes(10).toString("hex")}`,
    correlationId: input.correlationId,
    seq: LEDGER.length,
    ts: Date.now(),
    stage: input.stage,
    outcome: input.outcome,
    userId: input.userId,
    summary: input.summary,
    detail: (redact(input.detail ?? {}) as Record<string, unknown>) ?? {},
    prevHash: prev ? prev.hash : null,
  }
  const event: AuditEvent = deepFreeze({ ...base, hash: hashEvent(base) })

  LEDGER.push(event)
  if (LEDGER.length > MAX_EVENTS) LEDGER.splice(0, LEDGER.length - MAX_EVENTS)
  return event
}

export function list(opts: { correlationId?: string; userId?: string; stage?: AuditStage; limit?: number } = {}): AuditEvent[] {
  let rows = LEDGER
  if (opts.correlationId) rows = rows.filter((e) => e.correlationId === opts.correlationId)
  if (opts.userId) rows = rows.filter((e) => e.userId === opts.userId)
  if (opts.stage) rows = rows.filter((e) => e.stage === opts.stage)
  return rows.slice(-(opts.limit ?? 100)).reverse()
}

/** Every event for one correlation ID, oldest first — the trace of one signal. */
export function trace(correlationId: string): AuditEvent[] {
  return LEDGER.filter((e) => e.correlationId === correlationId)
}

/**
 * Verify the hash chain.
 *
 * Only meaningful over the retained window: once the ledger trims, the oldest
 * surviving event's prevHash points at an evicted event, which `fromSeq`
 * accounts for rather than reporting as tampering.
 */
export function verifyChain(): { ok: boolean; brokenAt: number | null; checked: number } {
  for (let i = 0; i < LEDGER.length; i++) {
    const e = LEDGER[i]
    const { hash, ...rest } = e
    if (hashEvent(rest) !== hash) return { ok: false, brokenAt: e.seq, checked: LEDGER.length }
    if (i > 0 && e.prevHash !== LEDGER[i - 1].hash) {
      return { ok: false, brokenAt: e.seq, checked: LEDGER.length }
    }
  }
  return { ok: true, brokenAt: null, checked: LEDGER.length }
}

export function ledgerStats() {
  const byStage: Record<string, number> = {}
  for (const e of LEDGER) byStage[e.stage] = (byStage[e.stage] ?? 0) + 1
  return {
    events: LEDGER.length,
    byStage,
    oldestTs: LEDGER[0]?.ts ?? null,
    newestTs: LEDGER[LEDGER.length - 1]?.ts ?? null,
  }
}

/** Test seam. */
export function resetLedger(): void {
  LEDGER.length = 0
}
