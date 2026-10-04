import { NextRequest, NextResponse } from "next/server"
import { requireUserId } from "@/lib/pipeline/current-user"
import { EXCHANGES, findExchange } from "@/lib/exchanges/catalog"
import { isSealingConfigured } from "@/lib/exchanges/crypto"
import {
  ConnectionLimitError,
  createConnection,
  describeConnection,
  findConnection,
  listConnections,
  markValidationAttempt,
  openConnection,
  recordValidation,
  revokeConnection,
  storageBackend,
  validationCooldownRemaining,
} from "@/lib/exchanges/store"
import { isValidationEnabled, validateCredentials } from "@/lib/exchanges/validate"
import * as audit from "@/lib/pipeline/audit"

/**
 * Exchange connections.
 *
 *   GET    — list this user's connections, masked
 *   POST   — seal and store a new one
 *   DELETE — revoke one by id
 *
 * Three rules hold on every verb:
 *
 *   1. **A verified session is required**, via `requireUserId` rather than
 *      `currentUserIdAsync`. The latter falls back to the demo identity, which is
 *      right for a read-only demo surface and wrong here: storing someone's live
 *      API secret under a shared demo user would let the next visitor fetch its
 *      metadata and revoke it. No session is 401, never the demo user.
 *   2. **No secret is ever returned**, on any path including errors. Responses
 *      are built from `describeConnection`, which has no field that can hold one.
 *   3. **Unavailable sealing is a refusal, not a plaintext write.** With no
 *      master key configured, POST is 503 and stores nothing.
 *
 * ## Validation
 *
 * POST checks the credential against the exchange unless `validate: false`, and
 * PUT re-checks a stored one. Two deliberate choices:
 *
 *   - **A rejected credential is still stored.** Tempting to refuse it and keep
 *     the list clean, but the signing is ours: if an adapter were subtly wrong,
 *     refusing would throw away a working key on our mistake. Storing it with a
 *     visible `rejected` status is recoverable in both directions — the user can
 *     retype or revoke — whereas discarding is not.
 *   - **Validation never gates storage on reachability.** An exchange being down
 *     or geo-blocking the server says nothing about the credential, so that is
 *     `unreachable`, the credential is kept, and the user can re-check later.
 *
 * ## Storage
 *
 * The store is backed by the `exchange_connections` table when `DATABASE_URL`
 * is set, and by an in-process map when it is not. GET reports which, as
 * `storage`, because the difference is visible to the user: one survives a
 * restart and the other does not. Nothing else in this file knows or cares.
 */

/** Bounds on submitted values, so a huge body cannot be parked in memory. */
const MAX_FIELD = 512
const MIN_SECRET = 8

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 })
}

function requireString(value: unknown, min: number): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (trimmed.length < min || trimmed.length > MAX_FIELD) return null
  return trimmed
}

export async function GET(req: NextRequest) {
  const userId = await requireUserId(req)
  if (!userId) {
    return NextResponse.json({ error: "sign in to manage exchange connections" }, { status: 401 })
  }

  const connections = await listConnections(userId)

  return NextResponse.json({
    connections: connections.map(describeConnection),
    // So the UI can explain an unavailable feature instead of failing on submit.
    sealingConfigured: isSealingConfigured(),
    validationEnabled: isValidationEnabled(),
    // "database" survives a restart; "memory" does not. Said out loud so the
    // UI can warn rather than letting a user assume durability it has not got.
    storage: await storageBackend(),
    exchanges: EXCHANGES,
  })
}

export async function POST(req: NextRequest) {
  const correlationId = audit.newCorrelationId("exchange_connect")

  const userId = await requireUserId(req)
  if (!userId) {
    return NextResponse.json({ error: "sign in to connect an exchange" }, { status: 401 })
  }

  // Checked before reading the body: with no key we do not want the secret in
  // this process at all, however briefly.
  if (!isSealingConfigured()) {
    return NextResponse.json(
      {
        error: "credential storage is not configured",
        hint: "set EXCHANGE_ENCRYPTION_KEY (at least 32 characters)",
      },
      { status: 503 }
    )
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== "object") return badRequest("expected a JSON object")
  const input = body as Record<string, unknown>

  const descriptor = findExchange(input.exchange)
  if (!descriptor) {
    return badRequest(`unknown exchange; expected one of ${EXCHANGES.map((e) => e.id).join(", ")}`)
  }

  const apiKey = requireString(input.apiKey, MIN_SECRET)
  const apiSecret = requireString(input.apiSecret, MIN_SECRET)
  if (!apiKey || !apiSecret) {
    // Deliberately says what is wrong without echoing what was sent.
    return badRequest(`apiKey and apiSecret are required, ${MIN_SECRET}-${MAX_FIELD} characters`)
  }

  const passphrase = input.passphrase === undefined || input.passphrase === null || input.passphrase === ""
    ? null
    : requireString(input.passphrase, 1)
  if (descriptor.requiresPassphrase && !passphrase) {
    return badRequest(`${descriptor.label} requires a passphrase`)
  }
  if (input.passphrase !== undefined && input.passphrase !== null && input.passphrase !== "" && !passphrase) {
    return badRequest(`passphrase must be 1-${MAX_FIELD} characters`)
  }

  const label = typeof input.label === "string" ? requireString(input.label, 1) ?? undefined : undefined

  try {
    const record = await createConnection({
      userId,
      exchange: descriptor.id,
      label,
      apiKey,
      apiSecret,
      passphrase,
    })

    // Validate the sealed copy, not the request body: this exercises the open
    // path, so a sealing/opening mismatch surfaces here rather than the first
    // time something needs the credential for real.
    if (input.validate !== false) {
      const opened = await openConnection(userId, record.id)
      if (opened) {
        const validation = await validateCredentials(descriptor.id, opened)
        await recordValidation(userId, record.id, validation)
        audit.append({
          correlationId,
          stage: "exchange.credential",
          outcome: validation.status === "valid" ? "ok" : "rejected",
          userId,
          summary: `exchange credential validation: ${validation.status}`,
          detail: {
            exchange: record.exchange,
            connectionId: record.id,
            status: validation.status,
            reason: validation.reason,
          },
        })
      }
    }

    audit.append({
      correlationId,
      stage: "exchange.credential",
      outcome: "ok",
      userId,
      summary: `exchange connection stored for ${descriptor.label}`,
      // The fingerprint identifies the key without being the key; no secret,
      // and no field the ledger's redaction would need to catch.
      detail: { exchange: record.exchange, connectionId: record.id, fingerprint: record.fingerprint },
    })

    return NextResponse.json(
      {
        ok: true,
        // Re-describe after validation so the body carries the outcome.
        connection: describeConnection((await findConnection(userId, record.id)) ?? record),
        correlationId,
      },
      { status: 201 }
    )
  } catch (e) {
    if (e instanceof ConnectionLimitError) {
      return NextResponse.json({ error: e.message }, { status: 409 })
    }
    audit.append({
      correlationId,
      stage: "exchange.credential",
      outcome: "error",
      userId,
      summary: "exchange connection could not be stored",
      detail: { exchange: descriptor.id },
    })
    // The underlying message could mention the input; it is not forwarded.
    return NextResponse.json({ error: "could not store the connection" }, { status: 500 })
  }
}

/** Re-check a stored credential against the exchange. */
export async function PUT(req: NextRequest) {
  const correlationId = audit.newCorrelationId("exchange_validate")

  const userId = await requireUserId(req)
  if (!userId) {
    return NextResponse.json({ error: "sign in to validate an exchange connection" }, { status: 401 })
  }

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return badRequest("id is required")

  // Same 404 for unknown and not-yours, as with DELETE.
  if (!(await findConnection(userId, id))) {
    return NextResponse.json({ error: "no such connection" }, { status: 404 })
  }

  const remaining = await validationCooldownRemaining(userId, id)
  if (remaining > 0) {
    await markValidationAttempt(userId, id)
    return NextResponse.json(
      {
        error: "validation was attempted too recently",
        retryAfterMs: remaining,
      },
      { status: 429, headers: { "Retry-After": String(Math.ceil(remaining / 1000)) } }
    )
  }

  const opened = await openConnection(userId, id)
  if (!opened) {
    // The record exists but will not open: a sealing mismatch or a rotated
    // master key. Not the credential's fault, and not reported as rejection.
    await markValidationAttempt(userId, id)
    return NextResponse.json({ error: "this connection could not be opened" }, { status: 500 })
  }

  const record = (await findConnection(userId, id))!
  const validation = await validateCredentials(record.exchange, opened)
  await recordValidation(userId, id, validation)

  audit.append({
    correlationId,
    stage: "exchange.credential",
    outcome: validation.status === "valid" ? "ok" : "rejected",
    userId,
    summary: `exchange credential re-validated: ${validation.status}`,
    detail: { exchange: record.exchange, connectionId: id, status: validation.status, reason: validation.reason },
  })

  return NextResponse.json({
    ok: true,
    connection: describeConnection((await findConnection(userId, id)) ?? record),
    correlationId,
  })
}

export async function DELETE(req: NextRequest) {
  const userId = await requireUserId(req)
  if (!userId) {
    return NextResponse.json({ error: "sign in to revoke an exchange connection" }, { status: 401 })
  }

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return badRequest("id is required")

  const revoked = await revokeConnection(userId, id)
  if (!revoked) {
    // Unknown and not-yours are the same answer, so this cannot be used to
    // discover another user's connection ids.
    return NextResponse.json({ error: "no such connection" }, { status: 404 })
  }

  audit.append({
    correlationId: audit.newCorrelationId("exchange_revoke"),
    stage: "exchange.credential",
    outcome: "ok",
    userId,
    summary: "exchange connection revoked",
    detail: { connectionId: id },
  })

  return NextResponse.json({ ok: true, revoked: id })
}
