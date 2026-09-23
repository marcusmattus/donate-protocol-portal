/**
 * TradingViewMCPConnector — the single gateway to the official TradingView MCP
 * server.
 *
 * Responsibilities, in the order a call meets them:
 *   1. resolve capability → remote tool name (catalog)
 *   2. serve from cache when fresh (reads only)
 *   3. acquire a rate-limit slot, by priority
 *   4. single-flight identical concurrent calls
 *   5. invoke over Streamable HTTP, refreshing tokens when they have aged out
 *   6. retry idempotent reads with backoff; never retry a write
 *   7. record an audit event carrying the caller's correlation ID
 *   8. on failure, degrade to stale cache rather than propagate an outage
 *
 * The connector produces market intelligence. It has no authority to trade:
 * nothing here can reach an exchange connector, and a TradingView
 * recommendation is data for the Risk Engine, not permission from it.
 */

import {
  TvCapability,
  capabilitySpec,
  reconcileCatalog,
  ALL_CAPABILITIES,
} from "@/lib/tradingview/catalog"
import { McpClient, McpTransportError } from "@/lib/tradingview/mcp-client"
import {
  TRADINGVIEW_MCP_URL,
  bearerFor,
  isExpired,
  isOAuthConfigured,
  refreshTokens,
} from "@/lib/tradingview/oauth"
import {
  ensureConnection,
  getConnection,
  markNeedsReauthorization,
  recordFailure,
  recordSuccess,
  updateConnection,
} from "@/lib/tradingview/connection-store"
import { acquireSlot, penalizeUser, rateLimitSnapshot, RateLimitError } from "@/lib/tradingview/rate-limit"
import { cacheKey, getFresh, getStale, put, singleFlight, invalidatePrefix } from "@/lib/tradingview/cache"
import * as audit from "@/lib/pipeline/audit"

const REQUIRE_VERIFIED = process.env.TRADINGVIEW_REQUIRE_VERIFIED_TOOLS === "true"
const MAX_RETRIES = 2

export interface InvokeOptions {
  /** Ties this call into the audit trail of the signal that caused it. */
  correlationId: string
  /** Overrides the catalog priority, e.g. a risk path borrowing a research capability. */
  priority?: number
  /** Skip the cache for this call. */
  fresh?: boolean
  timeoutMs?: number
  /** Why this call happened; recorded in the audit event. */
  reason?: string
}

export interface InvokeResult<T = unknown> {
  data: T
  /** "live" | "cache" | "stale" — stale means TradingView failed and this is old. */
  source: "live" | "cache" | "stale"
  /** Age of the data when source is "stale". */
  ageMs?: number
  capability: TvCapability
  correlationId: string
}

export class TradingViewUnavailableError extends Error {
  constructor(message: string, readonly kind: string, readonly retryAfterMs?: number) {
    super(message)
    this.name = "TradingViewUnavailableError"
  }
}

const clients = new Map<string, McpClient>()

function clientFor(userId: string): McpClient {
  let c = clients.get(userId)
  if (!c) {
    c = new McpClient({
      endpoint: TRADINGVIEW_MCP_URL,
      // Resolved per request so a refreshed token is picked up immediately and
      // no token is retained on the client between calls.
      getBearer: async () => {
        const conn = ensureConnection(userId)
        if (!conn.tokens) throw new McpTransportError("not connected to TradingView", "unauthorized")
        if (isExpired(conn.tokens)) {
          try {
            const next = await refreshTokens(conn.tokens)
            updateConnection(userId, { tokens: next, status: "connected" })
            return bearerFor(next)
          } catch (e) {
            markNeedsReauthorization(userId, e instanceof Error ? e.message : "refresh failed")
            throw new McpTransportError("TradingView token refresh failed", "unauthorized")
          }
        }
        return bearerFor(conn.tokens)
      },
    })
    clients.set(userId, c)
  }
  return c
}

export function resetClient(userId: string): void {
  clients.get(userId)?.reset()
  clients.delete(userId)
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Full jitter exponential backoff — avoids a thundering herd after an outage. */
function backoffMs(attempt: number): number {
  const ceiling = Math.min(8_000, 250 * 2 ** attempt)
  return Math.floor(Math.random() * ceiling)
}

export function isConnected(userId: string): boolean {
  const c = getConnection(userId)
  return Boolean(c && c.status === "connected" && c.tokens)
}

/**
 * Invoke a TradingView capability.
 *
 * Throws TradingViewUnavailableError only when there is nothing usable to
 * return — if a stale cache entry exists, it is returned with source "stale"
 * so callers can degrade instead of failing.
 */
export async function invoke<T = unknown>(
  userId: string,
  capability: TvCapability,
  args: Record<string, unknown>,
  options: InvokeOptions
): Promise<InvokeResult<T>> {
  const spec = capabilitySpec(capability)
  const key = cacheKey(userId, capability, args)
  const priority = options.priority ?? spec.priority

  const auditCall = (outcome: audit.AuditOutcome, summary: string, detail: Record<string, unknown>) =>
    audit.append({
      correlationId: options.correlationId,
      stage: "tradingview.mcp_call",
      outcome,
      userId,
      summary,
      detail: { capability, remoteTool: spec.remote, reason: options.reason, ...detail },
    })

  if (REQUIRE_VERIFIED && !spec.verified) {
    auditCall("rejected", `capability ${capability} is unverified`, { requireVerified: true })
    throw new TradingViewUnavailableError(
      `TradingView capability "${capability}" has not been reconciled against the live tools/list; run npm run tv:reconcile`,
      "unverified_capability"
    )
  }

  if (!isOAuthConfigured()) {
    auditCall("error", "TradingView OAuth is not configured", {})
    throw new TradingViewUnavailableError(
      "TradingView OAuth is not configured (TRADINGVIEW_OAUTH_CLIENT_ID)",
      "not_configured"
    )
  }
  if (!isConnected(userId)) {
    auditCall("rejected", "TradingView is not connected for this user", {})
    throw new TradingViewUnavailableError(
      "TradingView is not connected; authorize it first",
      "not_connected"
    )
  }

  if (spec.kind === "read" && spec.cacheTtlMs > 0 && !options.fresh) {
    const hit = getFresh<T>(key)
    if (hit !== undefined) {
      auditCall("ok", `served ${capability} from cache`, { source: "cache" })
      return { data: hit, source: "cache", capability, correlationId: options.correlationId }
    }
  }

  const run = async (): Promise<InvokeResult<T>> => {
    let lastError: unknown = null
    // Writes get exactly one attempt: a retried create_alert is a duplicate alert.
    const attempts = spec.kind === "read" ? MAX_RETRIES + 1 : 1

    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        await acquireSlot(userId, priority)
      } catch (e) {
        if (e instanceof RateLimitError) {
          const stale = getStale<T>(key)
          if (stale) {
            auditCall("degraded", `rate limited; served stale ${capability}`, {
              source: "stale", ageMs: stale.ageMs,
            })
            return { data: stale.value, source: "stale", ageMs: stale.ageMs, capability, correlationId: options.correlationId }
          }
          auditCall("error", `rate limited on ${capability}`, { retryAfterMs: e.retryAfterMs })
          throw new TradingViewUnavailableError(e.message, "rate_limited", e.retryAfterMs)
        }
        throw e
      }

      try {
        const result = await clientFor(userId).callTool(spec.remote, args, options.timeoutMs)
        if (result.isError) throw new McpTransportError(`tool ${spec.remote} reported an error`, "protocol")

        recordSuccess(userId)
        if (spec.kind === "read" && spec.cacheTtlMs > 0) put(key, result.data, spec.cacheTtlMs)
        // A write invalidates this user's cached reads for that surface.
        if (spec.kind === "write") invalidatePrefix(`${userId}::`)

        auditCall("ok", `invoked ${capability}`, { source: "live", attempt })
        return { data: result.data as T, source: "live", capability, correlationId: options.correlationId }
      } catch (e) {
        lastError = e
        const transportError = e instanceof McpTransportError ? e : null

        if (transportError?.kind === "unauthorized") {
          markNeedsReauthorization(userId, "TradingView rejected the credential")
          resetClient(userId)
          auditCall("error", `unauthorized on ${capability}`, {})
          throw new TradingViewUnavailableError(
            "TradingView authorization is no longer valid; reauthorize",
            "unauthorized"
          )
        }
        if (transportError?.kind === "rate_limited") {
          penalizeUser(userId, transportError.retryAfterMs ?? 60_000)
        }

        recordFailure(userId, transportError?.message ?? String(e))
        const retryable =
          spec.kind === "read" &&
          (transportError?.kind === "timeout" ||
            transportError?.kind === "network" ||
            transportError?.kind === "server_error" ||
            transportError?.kind === "rate_limited")

        if (retryable && attempt < attempts - 1) {
          await sleep(backoffMs(attempt))
          continue
        }
        break
      }
    }

    // Everything failed — degrade to stale before giving up.
    const stale = getStale<T>(key)
    if (stale) {
      auditCall("degraded", `TradingView failed; served stale ${capability}`, {
        source: "stale", ageMs: stale.ageMs,
        error: lastError instanceof Error ? lastError.message : String(lastError),
      })
      return { data: stale.value, source: "stale", ageMs: stale.ageMs, capability, correlationId: options.correlationId }
    }

    const msg = lastError instanceof Error ? lastError.message : "TradingView request failed"
    auditCall("error", `TradingView failed on ${capability}`, { error: msg })
    throw new TradingViewUnavailableError(
      msg,
      lastError instanceof McpTransportError ? lastError.kind : "unknown"
    )
  }

  // Single-flight only reads: two concurrent writes are two intended writes.
  return spec.kind === "read" ? singleFlight(key, run) : run()
}

/**
 * Handshake after authorization: list the server's tools, reconcile them
 * against the catalog, and record what this user may actually call.
 */
export async function refreshCapabilities(
  userId: string,
  correlationId = audit.newCorrelationId("tv_caps")
): Promise<{ granted: TvCapability[]; missing: string[]; unmapped: string[] }> {
  const tools = await clientFor(userId).listTools()
  const names = tools.map((t) => t.name)
  const { matched, missing, unmapped } = reconcileCatalog(names)

  updateConnection(userId, {
    grantedCapabilities: matched,
    unmappedRemoteTools: unmapped,
    status: "connected",
    health: "healthy",
  })

  audit.append({
    correlationId,
    stage: "tradingview.oauth",
    outcome: missing.length > 0 ? "degraded" : "ok",
    userId,
    summary: `reconciled TradingView capabilities: ${matched.length}/${ALL_CAPABILITIES.length} available`,
    detail: {
      granted: matched,
      missingFromServer: missing.map((m) => m.expected),
      unmappedRemoteTools: unmapped,
    },
  })

  return { granted: matched, missing: missing.map((m) => m.expected), unmapped }
}

/** Operational view for the dashboard and health checks. Carries no secrets. */
export function connectorHealth(userId: string) {
  const conn = getConnection(userId)
  return {
    endpoint: TRADINGVIEW_MCP_URL,
    oauthConfigured: isOAuthConfigured(),
    connected: isConnected(userId),
    status: conn?.status ?? "disconnected",
    health: conn?.health ?? "unknown",
    consecutiveFailures: conn?.consecutiveFailures ?? 0,
    lastSuccessfulRequestAt: conn?.lastSuccessfulRequestAt ?? null,
    lastErrorAt: conn?.lastErrorAt ?? null,
    lastErrorMessage: conn?.lastErrorMessage ?? null,
    grantedCapabilities: conn?.grantedCapabilities ?? [],
    rateLimit: rateLimitSnapshot(userId),
    requireVerifiedTools: REQUIRE_VERIFIED,
  }
}
