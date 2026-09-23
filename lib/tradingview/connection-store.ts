/**
 * TradingView connection model.
 *
 * One record per Donate Protocol user. Token material lives inside the TokenSet
 * (encrypted); `describeConnection` is the only shape that should ever reach an
 * API response, a log line, a Telegram message or a strategy author.
 *
 * In-memory for now — swap the Map for the Prisma model before production; the
 * accessor surface is deliberately narrow so that swap is contained.
 */

import { TokenSet, describeTokens } from "@/lib/tradingview/oauth"
import type { PendingAuthorization } from "@/lib/tradingview/oauth"
import type { TvCapability } from "@/lib/tradingview/catalog"

export type ConnectionStatus =
  | "disconnected"
  | "authorizing"
  | "connected"
  | "needs_reauthorization"
  | "revoked"
  | "error"

export type HealthState = "healthy" | "degraded" | "down" | "unknown"

export interface TradingViewConnection {
  userId: string
  status: ConnectionStatus
  tokens: TokenSet | null
  /** Capabilities the live server actually exposes, from tools/list. */
  grantedCapabilities: TvCapability[]
  /** Remote tool names seen on the server but absent from our catalog. */
  unmappedRemoteTools: string[]
  connectedAt: number | null
  lastSuccessfulRequestAt: number | null
  lastErrorAt: number | null
  lastErrorMessage: string | null
  /** Consecutive failures; drives the health state. */
  consecutiveFailures: number
  health: HealthState
  createdAt: number
  updatedAt: number
}

const connections = new Map<string, TradingViewConnection>()
const pending = new Map<string, PendingAuthorization>()

export function getConnection(userId: string): TradingViewConnection | undefined {
  return connections.get(userId)
}

export function ensureConnection(userId: string): TradingViewConnection {
  let c = connections.get(userId)
  if (!c) {
    const now = Date.now()
    c = {
      userId,
      status: "disconnected",
      tokens: null,
      grantedCapabilities: [],
      unmappedRemoteTools: [],
      connectedAt: null,
      lastSuccessfulRequestAt: null,
      lastErrorAt: null,
      lastErrorMessage: null,
      consecutiveFailures: 0,
      health: "unknown",
      createdAt: now,
      updatedAt: now,
    }
    connections.set(userId, c)
  }
  return c
}

export function updateConnection(
  userId: string,
  patch: Partial<Omit<TradingViewConnection, "userId" | "createdAt">>
): TradingViewConnection {
  const c = ensureConnection(userId)
  Object.assign(c, patch, { updatedAt: Date.now() })
  return c
}

export function recordSuccess(userId: string): void {
  const c = ensureConnection(userId)
  c.lastSuccessfulRequestAt = Date.now()
  c.consecutiveFailures = 0
  c.health = "healthy"
  c.lastErrorMessage = null
  c.updatedAt = Date.now()
}

/**
 * Record a failure and move the health state.
 *
 * Health is derived from consecutive failures rather than a single error, so a
 * lone timeout does not flip an otherwise working connection to "down" and trip
 * every degradation path at once.
 */
export function recordFailure(userId: string, message: string): void {
  const c = ensureConnection(userId)
  c.consecutiveFailures += 1
  c.lastErrorAt = Date.now()
  c.lastErrorMessage = message
  c.health = c.consecutiveFailures >= 5 ? "down" : c.consecutiveFailures >= 2 ? "degraded" : "healthy"
  c.updatedAt = Date.now()
}

export function markNeedsReauthorization(userId: string, reason: string): void {
  updateConnection(userId, {
    status: "needs_reauthorization",
    health: "down",
    lastErrorAt: Date.now(),
    lastErrorMessage: reason,
  })
}

export function disconnect(userId: string): void {
  updateConnection(userId, {
    status: "revoked",
    tokens: null,
    grantedCapabilities: [],
    unmappedRemoteTools: [],
    connectedAt: null,
    health: "unknown",
    consecutiveFailures: 0,
  })
}

// ── Pending authorizations ──────────────────────────────────────────────────

export function putPending(p: PendingAuthorization): void {
  pending.set(p.state, p)
  // Opportunistic sweep — states are short-lived and few.
  const cutoff = Date.now() - 15 * 60_000
  for (const [k, v] of pending) if (v.createdAt < cutoff) pending.delete(k)
}

export function takePending(state: string): PendingAuthorization | undefined {
  const p = pending.get(state)
  if (p) pending.delete(state) // Single use: a code may not be replayed.
  return p
}

// ── Safe projection ─────────────────────────────────────────────────────────

/** The only connection shape that may leave the server. Carries no secrets. */
export function describeConnection(userId: string) {
  const c = connections.get(userId)
  if (!c) {
    return {
      userId,
      status: "disconnected" as ConnectionStatus,
      health: "unknown" as HealthState,
      tokens: { present: false as const },
      grantedCapabilities: [],
      unmappedRemoteTools: [],
      connectedAt: null,
      lastSuccessfulRequestAt: null,
      lastErrorAt: null,
      lastErrorMessage: null,
      consecutiveFailures: 0,
    }
  }
  return {
    userId: c.userId,
    status: c.status,
    health: c.health,
    tokens: describeTokens(c.tokens),
    grantedCapabilities: c.grantedCapabilities,
    unmappedRemoteTools: c.unmappedRemoteTools,
    connectedAt: c.connectedAt,
    lastSuccessfulRequestAt: c.lastSuccessfulRequestAt,
    lastErrorAt: c.lastErrorAt,
    lastErrorMessage: c.lastErrorMessage,
    consecutiveFailures: c.consecutiveFailures,
  }
}

/** Test seam. */
export function resetConnections(): void {
  connections.clear()
  pending.clear()
}
