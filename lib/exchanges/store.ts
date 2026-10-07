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
 * ## Two backends, one rule set
 *
 * With `DATABASE_URL` set, connections live in the `exchange_connections` table
 * (prisma/schema.prisma) and survive restarts. Without it, they live in a map
 * in this process and do not — which is inconvenient but fails safe, and keeps
 * the app runnable with no database at all.
 *
 * The rules — ownership, the per-user cap, the validation cooldown, what a
 * revoke destroys — live *here*, above both backends, so there is one place to
 * read them and no second implementation that can quietly disagree. What the
 * backends implement is deliberately dumb: find, insert, update, count. The
 * same assertion battery runs against both (exchange-store-test.ts), because
 * the memory backend is otherwise exactly the kind of code that drifts from the
 * one that matters.
 *
 * A configured database that cannot be reached is an error, not a fall back to
 * memory. lib/exchanges/db.ts explains why.
 */

import crypto from "node:crypto"
import { credentialContext, keyFingerprint, keyHint, open, seal } from "@/lib/exchanges/crypto"
import { findExchange } from "@/lib/exchanges/catalog"
import {
  exchangeConnectionTable,
  isDatabaseConfigured,
  toRecord,
  toRow,
  type ExchangeConnectionDelegate,
} from "@/lib/exchanges/db"
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

// ─── the backend contract ──────────────────────────────────────────────────

/**
 * Storage primitives, with no rules in them.
 *
 * Every read and write takes the owner's id and only matches active rows, so
 * ownership holds even if a caller above forgets it. The update operations
 * answer "did anything match" rather than throwing, which is what lets the
 * route distinguish 404 from 500.
 */
interface ConnectionBackend {
  readonly kind: "database" | "memory"
  countActive(userId: string): Promise<number>
  insert(record: ExchangeConnectionRecord): Promise<void>
  listActive(userId: string): Promise<ExchangeConnectionRecord[]>
  findActive(userId: string, id: string): Promise<ExchangeConnectionRecord | null>
  revoke(userId: string, id: string, at: number): Promise<boolean>
  touchLastUsed(userId: string, id: string, at: number): Promise<boolean>
  saveValidation(
    userId: string,
    id: string,
    validation: ValidationResult,
    attemptedAt: number
  ): Promise<boolean>
  touchValidationAttempt(userId: string, id: string, at: number): Promise<boolean>
  clear(): Promise<void>
}

/**
 * Oldest first, with the id as a tiebreaker.
 *
 * Two connections created in the same millisecond are not hypothetical — a
 * test does it — and without the tiebreaker the two backends could order them
 * differently, which would make the shared assertions pass for the wrong
 * reason.
 */
function byCreation(a: ExchangeConnectionRecord, b: ExchangeConnectionRecord): number {
  return a.createdAt - b.createdAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
}

// ─── memory ────────────────────────────────────────────────────────────────

const byUser = new Map<string, ExchangeConnectionRecord[]>()

/**
 * Hands out copies, not the stored objects.
 *
 * The database cannot give a caller a live row, so neither does this: a caller
 * that mutates what it was handed changes nothing, and the two backends behave
 * the same. Every write goes through a named method instead.
 */
function copy(record: ExchangeConnectionRecord): ExchangeConnectionRecord {
  return { ...record, validation: record.validation ? { ...record.validation } : null }
}

function activeIn(userId: string): ExchangeConnectionRecord[] {
  return (byUser.get(userId) ?? []).filter((c) => c.revokedAt === null)
}

function heldActive(userId: string, id: string): ExchangeConnectionRecord | undefined {
  return activeIn(userId).find((c) => c.id === id)
}

const memoryBackend: ConnectionBackend = {
  kind: "memory",

  async countActive(userId) {
    return activeIn(userId).length
  },

  async insert(record) {
    const list = byUser.get(record.userId) ?? []
    list.push(copy(record))
    byUser.set(record.userId, list)
  },

  async listActive(userId) {
    return activeIn(userId).map(copy).sort(byCreation)
  },

  async findActive(userId, id) {
    const held = heldActive(userId, id)
    return held ? copy(held) : null
  },

  async revoke(userId, id, at) {
    const held = heldActive(userId, id)
    if (!held) return false
    held.revokedAt = at
    // Dropped, not flagged: a revoked credential should stop existing.
    held.sealedApiKey = ""
    held.sealedApiSecret = ""
    held.sealedPassphrase = null
    return true
  },

  async touchLastUsed(userId, id, at) {
    const held = heldActive(userId, id)
    if (!held) return false
    held.lastUsedAt = at
    return true
  },

  async saveValidation(userId, id, validation, attemptedAt) {
    const held = heldActive(userId, id)
    if (!held) return false
    held.validation = { ...validation }
    held.lastValidationAttemptAt = attemptedAt
    return true
  },

  async touchValidationAttempt(userId, id, at) {
    const held = heldActive(userId, id)
    if (!held) return false
    held.lastValidationAttemptAt = at
    return true
  },

  async clear() {
    byUser.clear()
  },
}

// ─── database ──────────────────────────────────────────────────────────────

function databaseBackend(table: ExchangeConnectionDelegate): ConnectionBackend {
  /** Every write narrows on the id, the owner, and "not revoked". */
  const owned = (userId: string, id: string) => ({ id, userId, revokedAt: null as null })

  return {
    kind: "database",

    countActive(userId) {
      return table.count({ where: { userId, revokedAt: null } })
    },

    async insert(record) {
      await table.create({ data: toRow(record) })
    },

    async listActive(userId) {
      const rows = await table.findMany({
        where: { userId, revokedAt: null },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      })
      return rows.map(toRecord)
    },

    async findActive(userId, id) {
      const row = await table.findFirst({ where: owned(userId, id) })
      return row ? toRecord(row) : null
    },

    async revoke(userId, id, at) {
      const { count } = await table.updateMany({
        where: owned(userId, id),
        data: {
          revokedAt: new Date(at),
          sealedApiKey: "",
          sealedApiSecret: "",
          sealedPassphrase: null,
        },
      })
      return count > 0
    },

    async touchLastUsed(userId, id, at) {
      const { count } = await table.updateMany({
        where: owned(userId, id),
        data: { lastUsedAt: new Date(at) },
      })
      return count > 0
    },

    async saveValidation(userId, id, validation, attemptedAt) {
      const { count } = await table.updateMany({
        where: owned(userId, id),
        data: {
          validationStatus: validation.status,
          validationReason: validation.reason,
          validationCheckedAt: new Date(validation.checkedAt),
          lastValidationAttemptAt: new Date(attemptedAt),
        },
      })
      return count > 0
    },

    async touchValidationAttempt(userId, id, at) {
      const { count } = await table.updateMany({
        where: owned(userId, id),
        data: { lastValidationAttemptAt: new Date(at) },
      })
      return count > 0
    },

    async clear() {
      // Only ever called by tests, and `resetConnections` refuses to call it in
      // production — but this is a DELETE with no predicate, so it says so here
      // too rather than trusting its one caller.
      if (process.env.NODE_ENV === "production") {
        throw new Error("refusing to clear exchange connections in production")
      }
      await table.deleteMany({ where: {} })
    },
  }
}

async function backend(): Promise<ConnectionBackend> {
  const table = await exchangeConnectionTable()
  return table ? databaseBackend(table) : memoryBackend
}

/** Which backend is live. Reported by the API so "will this survive a restart" is answerable. */
export async function storageBackend(): Promise<"database" | "memory"> {
  return isDatabaseConfigured() ? (await backend()).kind : "memory"
}

// ─── the accessors ─────────────────────────────────────────────────────────

/**
 * Seal and store a connection.
 *
 * Throws SealingUnavailableError (from crypto.ts) when no master key is set —
 * the caller must turn that into a refusal, never into a plaintext write.
 *
 * The cap is checked and then the row is inserted, which is not atomic: two
 * requests racing on the last slot can both pass the check. That is accepted.
 * The cap bounds growth, it is not a security boundary, and the alternatives —
 * a serializable transaction with retries, or a trigger — cost more than being
 * one over the limit for one user is worth.
 */
export async function createConnection(
  input: NewConnectionInput
): Promise<ExchangeConnectionRecord> {
  const store = await backend()
  if ((await store.countActive(input.userId)) >= MAX_PER_USER) {
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

  await store.insert(record)
  return record
}

/** Active connections for one user, oldest first. */
export async function listConnections(userId: string): Promise<ExchangeConnectionRecord[]> {
  return (await backend()).listActive(userId)
}

/** One active connection, but only if this user owns it. */
export async function findConnection(
  userId: string,
  id: string
): Promise<ExchangeConnectionRecord | null> {
  return (await backend()).findActive(userId, id)
}

/**
 * Revoke a connection.
 *
 * Returns false when the id is unknown *or* belongs to someone else — the two
 * are not distinguished, so this cannot be used to probe for other users' ids.
 * The sealed material is dropped rather than kept with a flag: a revoked
 * credential should stop existing, not linger where it can still be opened.
 */
export async function revokeConnection(userId: string, id: string): Promise<boolean> {
  return (await backend()).revoke(userId, id, Date.now())
}

/**
 * Open a connection's secrets for use against an exchange.
 *
 * This is the sealing boundary's one documented exit. Callers must not log the
 * result, and no route may return it.
 */
export async function openConnection(
  userId: string,
  id: string
): Promise<{ apiKey: string; apiSecret: string; passphrase: string | null } | null> {
  const store = await backend()
  const record = await store.findActive(userId, id)
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
  await store.touchLastUsed(userId, id, Date.now())
  return secrets
}

/**
 * Record a validation outcome against a connection this user owns.
 *
 * Separate from `openConnection` so the store, not the route, decides what a
 * record may hold: a route cannot write an arbitrary field through this.
 */
export async function recordValidation(
  userId: string,
  id: string,
  validation: ValidationResult
): Promise<boolean> {
  return (await backend()).saveValidation(userId, id, validation, Date.now())
}

/**
 * Cooldown between validation attempts on one connection.
 *
 * Each attempt is an outbound request to a third party, so without this the
 * endpoint is a small amplifier pointed at an exchange — and exchanges rate
 * limit by key, so hammering it could get the user's own key throttled.
 */
const VALIDATION_COOLDOWN_MS = Math.max(0, Number(process.env.EXCHANGE_VALIDATION_COOLDOWN_MS) || 20_000)

export async function validationCooldownRemaining(userId: string, id: string): Promise<number> {
  const record = await findConnection(userId, id)
  if (!record?.lastValidationAttemptAt) return 0
  const elapsed = Date.now() - record.lastValidationAttemptAt
  return Math.max(0, VALIDATION_COOLDOWN_MS - elapsed)
}

/** Note an attempt even when it is refused, so a failure cannot be retried hot. */
export async function markValidationAttempt(userId: string, id: string): Promise<void> {
  await (await backend()).touchValidationAttempt(userId, id, Date.now())
}

/** Test seam. Not reachable over HTTP, and refuses to run in production. */
export async function resetConnections(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("refusing to clear exchange connections in production")
  }
  await (await backend()).clear()
  byUser.clear()
}
