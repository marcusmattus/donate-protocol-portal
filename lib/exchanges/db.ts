/**
 * The database behind lib/exchanges/store.ts.
 *
 * This module owns three things and nothing else: getting a Prisma client,
 * describing the one table the store uses, and mapping between a row and an
 * `ExchangeConnectionRecord`. The store decides what the rules are; this
 * decides how they are spelled in SQL.
 *
 * ## Configured means required
 *
 * With `DATABASE_URL` unset, there is no client and the store keeps its
 * in-memory map. With `DATABASE_URL` set, the database is the store — and if it
 * cannot be reached, or the Prisma client was never generated, that is an
 * error, never a quiet fall back to memory.
 *
 * The distinction matters more here than it would for a cache. Falling back
 * would mean a user's stored connections appear to vanish on a bad deploy,
 * while newly submitted credentials get sealed into a map that the next restart
 * throws away — a silent, confusing, and unrecoverable kind of wrong. Refusing
 * is loud and fixable.
 *
 * ## Why the delegate is hand-typed
 *
 * `@prisma/client` has no types until `prisma generate` has run, and the
 * generated delegate types are far larger than anything used here. So the five
 * operations the store needs are declared as `ExchangeConnectionDelegate` and
 * the generated client is cast to it once, at the boundary. That keeps the rest
 * of the codebase compiling without generated code, and lets the store's tests
 * drive a hand-written fake through exactly the same interface the database
 * sees.
 */

import type { ValidationResult, ValidationStatus } from "@/lib/exchanges/validate"
// Type-only, so this is erased at runtime and the store/db pair is not a cycle.
import type { ExchangeConnectionRecord } from "@/lib/exchanges/store"

/** One row of `exchange_connections`, as Prisma hands it back. */
export interface ExchangeConnectionRow {
  id: string
  userId: string
  exchange: string
  label: string
  sealedApiKey: string
  sealedApiSecret: string
  sealedPassphrase: string | null
  fingerprint: string
  hint: string
  createdAt: Date
  revokedAt: Date | null
  lastUsedAt: Date | null
  validationStatus: string | null
  validationReason: string | null
  validationCheckedAt: Date | null
  lastValidationAttemptAt: Date | null
}

/**
 * The subset of Prisma's model delegate the store uses.
 *
 * Writes go through `updateMany` rather than `update` on purpose: an id that
 * does not exist, or belongs to someone else, must come back as "nothing
 * matched" so the store can answer 404, not throw.
 */
export interface ExchangeConnectionDelegate {
  count(args: { where: { userId: string; revokedAt: null } }): Promise<number>
  create(args: { data: ExchangeConnectionRow }): Promise<ExchangeConnectionRow>
  findMany(args: {
    where: { userId: string; revokedAt: null }
    orderBy: Array<{ createdAt: "asc" } | { id: "asc" }>
  }): Promise<ExchangeConnectionRow[]>
  findFirst(args: {
    where: { id: string; userId: string; revokedAt: null }
  }): Promise<ExchangeConnectionRow | null>
  updateMany(args: {
    where: { id: string; userId: string; revokedAt: null }
    data: Partial<ExchangeConnectionRow>
  }): Promise<{ count: number }>
  deleteMany(args: { where: Record<string, never> }): Promise<{ count: number }>
}

/** A database was configured and could not be used. Never swallowed. */
export class ExchangeStorageError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = "ExchangeStorageError"
  }
}

export function isDatabaseConfigured(): boolean {
  return (process.env.DATABASE_URL ?? "").trim().length > 0
}

/**
 * Cached on `globalThis` rather than in a module variable because Next reloads
 * modules in development: a per-module cache would open a new pool on every
 * edit until Postgres refused connections.
 */
const CACHE_KEY = "__dpExchangeConnectionTable"
type Cache = { promise?: Promise<ExchangeConnectionDelegate | null>; url?: string }

function cache(): Cache {
  const g = globalThis as Record<string, unknown>
  if (!g[CACHE_KEY]) g[CACHE_KEY] = {} satisfies Cache
  return g[CACHE_KEY] as Cache
}

/**
 * The table, or null when no database is configured.
 *
 * Throws `ExchangeStorageError` when `DATABASE_URL` is set but the client
 * cannot be loaded — see the note on "configured means required" above.
 */
export function exchangeConnectionTable(): Promise<ExchangeConnectionDelegate | null> {
  const url = (process.env.DATABASE_URL ?? "").trim()
  const c = cache()
  // Re-resolve if the URL changed under us, which only happens in tests.
  if (!c.promise || c.url !== url) {
    c.url = url
    c.promise = connect(url)
  }
  return c.promise
}

async function connect(url: string): Promise<ExchangeConnectionDelegate | null> {
  if (!url) return null

  let client: { exchangeConnection: unknown }
  try {
    // Dynamic, and listed in `serverExternalPackages`, so a build with no
    // generated client still succeeds — the cost of a missing one is paid here,
    // at the first query, with a message that says what to run.
    const [prisma, adapter] = await Promise.all([
      import("@prisma/client"),
      import("@prisma/adapter-pg"),
    ])
    const PrismaClient = (prisma as { PrismaClient: new (o: unknown) => unknown }).PrismaClient
    const PrismaPg = (adapter as { PrismaPg: new (o: unknown) => unknown }).PrismaPg
    client = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }) as {
      exchangeConnection: unknown
    }
  } catch (e) {
    throw new ExchangeStorageError(
      "DATABASE_URL is set but the Prisma client could not be loaded; run `pnpm db:generate`",
      { cause: e }
    )
  }

  const table = client.exchangeConnection as ExchangeConnectionDelegate | undefined
  if (!table) {
    throw new ExchangeStorageError(
      "the generated Prisma client has no ExchangeConnection model; run `pnpm db:generate`"
    )
  }
  return table
}

/** Test seam: forget the cached client so the next call reconnects. */
export function resetConnectionTableCache(): void {
  const c = cache()
  c.promise = undefined
  c.url = undefined
}

// ─── row ⇄ record ──────────────────────────────────────────────────────────

const VALIDATION_STATUSES: readonly ValidationStatus[] = [
  "valid",
  "rejected",
  "unreachable",
  "unsupported",
]

function millis(value: Date | null): number | null {
  return value === null ? null : value.getTime()
}

function date(value: number | null): Date | null {
  return value === null ? null : new Date(value)
}

/**
 * The flattened validation columns, read back as a `ValidationResult`.
 *
 * All three must be present and the status must be one this code knows, or the
 * answer is null — "never checked". A row that was hand-edited, or written by
 * an older version, therefore cannot put an unrecognised status into an API
 * response; it reads as unchecked, which is the safe direction to be wrong in.
 */
export function readValidation(row: {
  validationStatus: string | null
  validationReason: string | null
  validationCheckedAt: Date | null
}): ValidationResult | null {
  const { validationStatus, validationReason, validationCheckedAt } = row
  if (validationStatus === null || validationReason === null || validationCheckedAt === null) {
    return null
  }
  if (!VALIDATION_STATUSES.includes(validationStatus as ValidationStatus)) return null
  return {
    status: validationStatus as ValidationStatus,
    reason: validationReason,
    checkedAt: validationCheckedAt.getTime(),
  }
}

export function toRecord(row: ExchangeConnectionRow): ExchangeConnectionRecord {
  return {
    id: row.id,
    userId: row.userId,
    exchange: row.exchange,
    label: row.label,
    sealedApiKey: row.sealedApiKey,
    sealedApiSecret: row.sealedApiSecret,
    sealedPassphrase: row.sealedPassphrase,
    fingerprint: row.fingerprint,
    hint: row.hint,
    createdAt: row.createdAt.getTime(),
    revokedAt: millis(row.revokedAt),
    lastUsedAt: millis(row.lastUsedAt),
    validation: readValidation(row),
    lastValidationAttemptAt: millis(row.lastValidationAttemptAt),
  }
}

export function toRow(record: ExchangeConnectionRecord): ExchangeConnectionRow {
  return {
    id: record.id,
    userId: record.userId,
    exchange: record.exchange,
    label: record.label,
    sealedApiKey: record.sealedApiKey,
    sealedApiSecret: record.sealedApiSecret,
    sealedPassphrase: record.sealedPassphrase,
    fingerprint: record.fingerprint,
    hint: record.hint,
    createdAt: new Date(record.createdAt),
    revokedAt: date(record.revokedAt),
    lastUsedAt: date(record.lastUsedAt),
    validationStatus: record.validation?.status ?? null,
    validationReason: record.validation?.reason ?? null,
    validationCheckedAt: record.validation ? new Date(record.validation.checkedAt) : null,
    lastValidationAttemptAt: date(record.lastValidationAttemptAt),
  }
}
