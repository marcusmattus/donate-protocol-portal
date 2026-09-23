import { NextRequest, NextResponse } from "next/server"
import { beginAuthorization, isOAuthConfigured, TradingViewOAuthError } from "@/lib/tradingview/oauth"
import { putPending, updateConnection } from "@/lib/tradingview/connection-store"
import { currentUserId } from "@/lib/pipeline/current-user"
import * as audit from "@/lib/pipeline/audit"

/**
 * Begin TradingView OAuth 2.1 (authorization code + PKCE).
 *
 * Returns the authorization URL for the browser to visit. Donate Protocol never
 * asks for TradingView credentials; the user authenticates on TradingView.
 */
export async function POST(req: NextRequest) {
  const userId = currentUserId(req)
  const correlationId = audit.newCorrelationId("tv_oauth")

  if (!isOAuthConfigured()) {
    return NextResponse.json(
      {
        error: "TradingView OAuth is not configured",
        hint: "set TRADINGVIEW_OAUTH_CLIENT_ID (and TRADINGVIEW_OAUTH_REDIRECT_URI) in the environment",
      },
      { status: 503 }
    )
  }

  try {
    const body = await req.json().catch(() => ({}))
    const scopes = Array.isArray(body?.scopes) ? body.scopes.map(String) : []
    const { authorizationUrl, pending } = await beginAuthorization(userId, scopes)

    putPending(pending)
    updateConnection(userId, { status: "authorizing" })

    audit.append({
      correlationId,
      stage: "tradingview.oauth",
      outcome: "ok",
      userId,
      summary: "started TradingView OAuth authorization",
      detail: { scopes, redirectUri: pending.redirectUri },
    })

    // state is returned so the client can correlate; the verifier never leaves the server.
    return NextResponse.json({ ok: true, authorizationUrl, state: pending.state, correlationId })
  } catch (e) {
    const code = e instanceof TradingViewOAuthError ? e.code : "unknown"
    audit.append({
      correlationId,
      stage: "tradingview.oauth",
      outcome: "error",
      userId,
      summary: "failed to start TradingView OAuth",
      detail: { code },
    })
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "failed to start authorization", code },
      { status: 502 }
    )
  }
}
