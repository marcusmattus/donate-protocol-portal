import { NextRequest, NextResponse } from "next/server"
import { verifyPrivyToken } from "@/lib/privy/verify"
import {
  SESSION_COOKIE,
  cookieOptions,
  isSessionConfigured,
  mintSession,
  sessionFromRequest,
} from "@/lib/privy/session"
import { isPrivyConfigured } from "@/lib/privy/config"
import * as audit from "@/lib/pipeline/audit"

/**
 * Privy session exchange.
 *
 *   POST   — verify a Privy access token, mint the httpOnly session cookie
 *   GET    — report the current session (no secrets)
 *   DELETE — clear the session
 *
 * The client holds the Privy token; the server holds a session derived from it
 * only after verifying the signature against Privy's JWKS. A login that the
 * server never verified is a UI state, not a login.
 */

export async function POST(req: NextRequest) {
  const correlationId = audit.newCorrelationId("privy_login")

  if (!isPrivyConfigured()) {
    return NextResponse.json(
      {
        error: "Privy is not configured",
        hint: "set NEXT_PUBLIC_PRIVY_APP_ID",
      },
      { status: 503 }
    )
  }
  if (!isSessionConfigured()) {
    return NextResponse.json(
      {
        error: "session signing key is not configured",
        hint: "set SESSION_SECRET (at least 16 characters)",
      },
      { status: 503 }
    )
  }

  let token: string | null = null
  const authorization = req.headers.get("authorization")
  if (authorization?.startsWith("Bearer ")) {
    token = authorization.slice(7).trim()
  } else {
    const body = await req.json().catch(() => null)
    if (body && typeof body === "object" && typeof (body as { token?: unknown }).token === "string") {
      token = (body as { token: string }).token
    }
  }

  const result = await verifyPrivyToken(token)
  if (!result.ok) {
    audit.append({
      correlationId,
      stage: "tradingview.oauth",
      outcome: result.reason === "jwks_unavailable" ? "error" : "rejected",
      userId: "unauthenticated",
      summary: `Privy login rejected: ${result.reason}`,
      // The token itself is never recorded.
      detail: { reason: result.reason },
    })
    // An unreachable JWKS is our problem, not the caller's bad credential.
    const status = result.reason === "jwks_unavailable" ? 503 : 401
    return NextResponse.json({ error: result.message, reason: result.reason }, { status })
  }

  const session = await mintSession(result.identity)
  if (!session) {
    return NextResponse.json({ error: "could not mint a session" }, { status: 500 })
  }

  audit.append({
    correlationId,
    stage: "tradingview.oauth",
    outcome: "ok",
    userId: result.identity.userId,
    summary: "Privy login verified and session issued",
    detail: {
      privyTokenExpiresAt: result.identity.expiresAt,
      sessionTtlSec: session.maxAge,
    },
  })

  const response = NextResponse.json({
    ok: true,
    user: { userId: result.identity.userId },
    expiresInSec: session.maxAge,
    correlationId,
  })
  response.cookies.set(SESSION_COOKIE, session.token, cookieOptions(session.maxAge))
  return response
}

export async function GET(req: NextRequest) {
  const session = await sessionFromRequest(req)
  return NextResponse.json({
    authenticated: Boolean(session),
    privyConfigured: isPrivyConfigured(),
    sessionConfigured: isSessionConfigured(),
    user: session ? { userId: session.userId } : null,
    expiresAt: session?.expiresAt ?? null,
  })
}

export async function DELETE(req: NextRequest) {
  const session = await sessionFromRequest(req)
  if (session) {
    audit.append({
      correlationId: audit.newCorrelationId("privy_logout"),
      stage: "tradingview.oauth",
      outcome: "ok",
      userId: session.userId,
      summary: "session cleared",
      detail: {},
    })
  }
  const response = NextResponse.json({ ok: true })
  // Same attributes as when set, or the browser keeps the old cookie.
  response.cookies.set(SESSION_COOKIE, "", cookieOptions(0))
  return response
}
