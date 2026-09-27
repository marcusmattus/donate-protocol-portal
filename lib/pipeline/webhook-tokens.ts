/**
 * Webhook token resolution — one source of truth for every webhook route.
 *
 * Before this existed the three TradingView webhook routes each decided their
 * own auth: the alert route read `TRADINGVIEW_ALERT_TOKENS`, the `:token` route
 * carried two hardcoded demo tokens, and the bare route had no check at all.
 * Three answers to one question is how the third one ended up unauthenticated,
 * so the question is now asked in exactly one place.
 *
 * Token sources, in order:
 *   1. TRADINGVIEW_ALERT_TOKENS  (comma-separated, the documented setting)
 *   2. WEBHOOK_SECRET            (single token, the repo's older setting)
 *   3. the devnet demo tokens    — ONLY outside production
 *
 * Production with neither variable set resolves to an empty set, and an empty
 * set rejects everything. The demo fallback is what keeps `npm run test:demo`
 * and the curl snippets in the docs working locally; it is deliberately
 * unavailable once NODE_ENV is production, so a deployment cannot accidentally
 * inherit a published credential.
 */

import type { NextRequest } from "next/server"
import { safeEqual } from "@/lib/pipeline/webhook-security"

/** Documented in the README and the QUICKSTART curl examples. */
export const DEMO_TOKENS = ["demo123", "demo456"] as const

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production"
}

/**
 * The tokens a webhook request may present.
 *
 * Not cached: reading the environment per call costs nothing measurable and
 * means a rotated token takes effect without a restart.
 */
export function validWebhookTokens(): Set<string> {
  const configured = process.env.TRADINGVIEW_ALERT_TOKENS || process.env.WEBHOOK_SECRET || ""
  const tokens = configured
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)

  if (tokens.length > 0) return new Set(tokens)
  return isProduction() ? new Set() : new Set(DEMO_TOKENS)
}

/** True when no token is configured and none can be defaulted — fail closed. */
export function webhookAuthUnconfigured(): boolean {
  return validWebhookTokens().size === 0
}

/**
 * Pull the presented token off a request.
 *
 * Routes with a `:token` path segment pass it in; the bare route has no path
 * segment, so it accepts `x-webhook-token` or `?token=`. A query parameter is
 * the weaker option — it lands in access logs — but TradingView's alert UI can
 * only send a URL on some plans, so refusing it would leave the route
 * unusable for exactly the callers that need it. The header is preferred when
 * both are present.
 */
export function extractWebhookToken(req: NextRequest, pathToken?: string): string | null {
  if (pathToken) return pathToken

  const header = req.headers.get("x-webhook-token") ?? req.headers.get("x-tradingview-token")
  if (header) return header.trim()

  const authorization = req.headers.get("authorization")
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7).trim()

  const query = new URL(req.url).searchParams.get("token")
  return query ? query.trim() : null
}

export type TokenRejection = "unconfigured" | "missing" | "unknown"

export interface TokenCheck {
  ok: boolean
  rejection?: TokenRejection
  message?: string
  /** HTTP status the route should answer with. */
  status?: number
}

/**
 * Constant-time token check.
 *
 * Every configured token is compared without short-circuiting, so response
 * timing does not reveal how many tokens exist or which prefix matched.
 */
export function checkWebhookToken(presented: string | null): TokenCheck {
  const tokens = validWebhookTokens()

  if (tokens.size === 0) {
    return {
      ok: false,
      rejection: "unconfigured",
      status: 503,
      message:
        "webhook authentication is not configured; set TRADINGVIEW_ALERT_TOKENS (comma-separated) or WEBHOOK_SECRET",
    }
  }
  if (!presented) {
    return {
      ok: false,
      rejection: "missing",
      status: 401,
      message:
        "no webhook token supplied; send it as the x-webhook-token header, an Authorization: Bearer value, or a ?token= query parameter",
    }
  }

  let matched = false
  for (const t of tokens) {
    if (safeEqual(presented, t)) matched = true
  }

  return matched
    ? { ok: true }
    : { ok: false, rejection: "unknown", status: 401, message: "webhook token not recognized" }
}

/** Convenience for a route that has a NextRequest and an optional path token. */
export function authorizeWebhook(req: NextRequest, pathToken?: string): TokenCheck {
  return checkWebhookToken(extractWebhookToken(req, pathToken))
}
