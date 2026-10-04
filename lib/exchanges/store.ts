/**
 * Exchange connections, one set per Donate Protocol user.
 *
 * Secrets are sealed by lib/exchanges/crypto.ts before they reach this module,
 * and `describeConnection` is the only shape that should ever leave the server.
 * That split is the point: nothing here can accidentally serialise a secret,
 * because the record holds ciphertext and the view holds no ciphertext at all.
 *
 * Ownership is enforced on every accessor rather than at the route. A read or a
 * revoke needs the owner's id to match, so a route that forgets to check still
 * cannot reach another user's connection.
 *
 * In-memory, like the other stores here (lib/tradingview/connection-store.ts,
 * lib/privy/accounts.ts) — there is no Prisma schema in this repo yet. For
 * credentials that cuts both ways: connections do not survive a restart, which
 * is inconvenient but fails safe, and the plaintext never touches a disk this
 * app controls. The accessor surface is narrow so the Map can be swapped for a
 * table without the sealing boundary moving.
 */

import crypto from "node:crypto"
import { credentialContext, keyFingerprint, keyHint, open, seal } from "@/lib/exchanges/crypto"
import { findExchange } from "@/lib/exchanges/catalog"
import type { ValidationResult } from "@/lib/exchanges/validate"

export interface ExchangeConnectionRecord {
  id: string
  userId: string
  exchange: string
  label: string
  sealedApiKey: string
  sealedApiSecret: string
  sealedPassphrase: string | null
  /** HMAC of the API key — recognisable, not reversible. */
  fingerprint: string
  /** Last four characters of the API key. */
  hint: string
  createdAt: number
  revokedAt: number | null
  lastUsedAt: number | null
  /** Last validation outcome, or null if never checked. Carries no secret. */
  validation: ValidationResult | null
  /** When a validation was last *attempted*, for the cooldown. */
  lastValidationAttemptAt: number | null
}

/** The only shape that may be serialised to a client. Carries no secret. */
export interface ExchangeConnectionView {
  id: string
  exchange: string
  label: string
  fingerprint: string
  hint: string
  hasPassphrase: boolean
  createdAt: number
  lastUsedAt: number | null
  validation: ValidationResult | null
}

/** Bounded so a loop of creates cannot grow this without limit. */
const MAX_PER_USER = Math.max(1, Number(process.env.EXCHANGE_MAX_PER_USER) || 20)

const byUser = new Map<string, ExchangeConnectionRecord[]>()

export function describeConnection(record: ExchangeConnectionRecord): ExchangeConnectionView {
  return {
    id: record.id,
    exchange: record.exchange,
    label: record.label,
    fingerprint: record.fingerprint,
    hint: record.hint,
    hasPassphrase: record.sealedPassphrase !== null,
    createdAt: record.createdAt,
    lastUsedAt: record.lastUsedAt,
    validation: record.validation,
  }
}

export class ConnectionLimitError extends Error {
  constructor(limit: number) {
    super(`at most ${limit} exchange connections per user`)
    this.name = "ConnectionLimitError"
  }
}

export interface NewConnectionInput {
  userId: string
  exchange: string
  label?: string
  apiKey: string
  apiSecret: string
  passphrase?: string | null
}

/**
 * Seal and store a connection.
 *
 * Throws SealingUnavailableError (from crypto.ts) when no master key is set —
 * the caller must turn that into a refusal, never into a plaintext write.
 */
export function createConnection(input: NewConnectionInput): ExchangeConnectionRecord {
  const list = byUser.get(input.userId) ?? []
  if (list.filter((c) => c.revokedAt === null).length >= MAX_PER_USER) {
    throw new ConnectionLimitError(MAX_PER_USER)
  }

  const id = `exc_${crypto.randomBytes(8).toString("hex")}`
  const exchange = input.exchange.toLowerCase()
  const ctx = (field: "apiKey" | "apiSecret" | "passphrase") =>
    credentialContext({ userId: input.userId, connectionId: id, exchange, field })

  // Fingerprint and hint first: if sealing is unavailable these throw before
  // anything is written, so a failed create leaves no partial record.
  const fingerprint = keyFingerprint(input.apiKey)
  const hint = keyHint(input.apiKey)

  const record: ExchangeConnectionRecord = {
    id,
    userId: input.userId,
    exchange,
    label: input.label?.trim() || findExchange(exchange)?.label || exchange,
    sealedApiKey: seal(input.apiKey, ctx("apiKey")),
    sealedApiSecret: seal(input.apiSecret, ctx("apiSecret")),
    sealedPassphrase: input.passphrase ? seal(input.passphrase, ctx("passphrase")) : null,
    fingerprint,
    hint,
    createdAt: Date.now(),
    revokedAt: null,
    lastUsedAt: null,
    validation: null,
    lastValidationAttemptAt: null,
  }

  list.push(record)
  byUser.set(input.userId, list)
  return record
}

/** Active connections for one user, oldest first. */
export function listConnections(userId: string): ExchangeConnectionRecord[] {
  return (byUser.get(userId) ?? []).filter((c) => c.revokedAt === null)
}

/** One active connection, but only if this user owns it. */
export function findConnection(userId: string, id: string): ExchangeConnectionRecord | null {
  return listConnections(userId).find((c) => c.id === id) ?? null
}

/**
 * Revoke a connection.
 *
 * Returns false when the id is unknown *or* belongs to someone else — the two
 * are not distinguished, so this cannot be used to probe for other users' ids.
 * The sealed material is dropped rather than kept with a flag: a revoked
 * credential should stop existing, not linger in memory.
 */
export function revokeConnection(userId: string, id: string): boolean {
  const record = findConnection(userId, id)
  if (!record) return false
  record.revokedAt = Date.now()
  record.sealedApiKey = ""
  record.sealedApiSecret = ""
  record.sealedPassphrase = null
  return true
}

/**
 * Open a connection's secrets for use against an exchange.
 *
 * Nothing calls this yet, and no route exposes it. It exists so the sealing
 * boundary has exactly one documented exit, and so the round trip is tested
 * rather than assumed. Callers must not log the result.
 */
export function openConnection(
  userId: string,
  id: string
): { apiKey: string; apiSecret: string; passphrase: string | null } | null {
  const record = findConnection(userId, id)
  if (!record) return null
  const ctx = (field: "apiKey" | "apiSecret" | "passphrase") =>
    credentialContext({
      userId: record.userId,
      connectionId: record.id,
      exchange: record.exchange,
      field,
    })
  const secrets = {
    apiKey: open(record.sealedApiKey, ctx("apiKey")),
    apiSecret: open(record.sealedApiSecret, ctx("apiSecret")),
    passphrase: record.sealedPassphrase ? open(record.sealedPassphrase, ctx("passphrase")) : null,
  }
  record.lastUsedAt = Date.now()
  return secrets
}

/**
 * Record a validation outcome against a connection this user owns.
 *
 * Separate from `openConnection` so the store, not the route, decides what a
 * record may hold: a route cannot write an arbitrary field through this.
 */
export function recordValidation(
  userId: string,
  id: string,
  validation: ValidationResult
): boolean {
  const record = findConnection(userId, id)
  if (!record) return false
  record.validation = validation
  record.lastValidationAttemptAt = Date.now()
  return true
}

/**
 * Cooldown between validation attempts on one connection.
 *
 * Each attempt is an outbound request to a third party, so without this the
 * endpoint is a small amplifier pointed at an exchange — and exchanges rate
 * limit by key, so hammering it could get the user's own key throttled.
 */
const VALIDATION_COOLDOWN_MS = Math.max(0, Number(process.env.EXCHANGE_VALIDATION_COOLDOWN_MS) || 20_000)

export function validationCooldownRemaining(userId: string, id: string): number {
  const record = findConnection(userId, id)
  if (!record?.lastValidationAttemptAt) return 0
  const elapsed = Date.now() - record.lastValidationAttemptAt
  return Math.max(0, VALIDATION_COOLDOWN_MS - elapsed)
}

/** Note an attempt even when it is refused, so a failure cannot be retried hot. */
export function markValidationAttempt(userId: string, id: string): void {
  const record = findConnection(userId, id)
  if (record) record.lastValidationAttemptAt = Date.now()
}

/** Test seam. Not reachable over HTTP. */
export function resetConnections(): void {
  byUser.clear()
}
