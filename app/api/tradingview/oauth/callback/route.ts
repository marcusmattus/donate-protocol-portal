import { NextRequest, NextResponse } from "next/server"
import { completeAuthorization, TradingViewOAuthError } from "@/lib/tradingview/oauth"
import { takePending, updateConnection, markNeedsReauthorization } from "@/lib/tradingview/connection-store"
import { refreshCapabilities, resetClient } from "@/lib/tradingview/connector"
import * as audit from "@/lib/pipeline/audit"

/**
 * OAuth redirect target.
 *
 * Exchanges the code for tokens, then immediately reconciles the catalog
 * against the server's live tools/list so the connection records what this user
 * can actually call rather than what we assumed.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const oauthError = url.searchParams.get("error")
  const correlationId = audit.newCorrelationId("tv_oauth")

  const dashboard = new URL("/dashboard/tradingview", url.origin)

  if (oauthError) {
    dashboard.searchParams.set("tv_error", oauthError)
    return NextResponse.redirect(dashboard)
  }
  if (!code || !state) {
    dashboard.searchParams.set("tv_error", "missing_code_or_state")
    return NextResponse.redirect(dashboard)
  }

  // Single-use: takePending removes the state, so a replayed callback fails.
  const pending = takePending(state)
  if (!pending) {
    audit.append({
      correlationId, stage: "tradingview.oauth", outcome: "rejected",
      userId: "unknown", summary: "OAuth callback with unknown or reused state", detail: {},
    })
    dashboard.searchParams.set("tv_error", "unknown_state")
    return NextResponse.redirect(dashboard)
  }

  try {
    const tokens = await completeAuthorization(pending, { code, state })
    updateConnection(pending.userId, {
      tokens,
      status: "connected",
      connectedAt: Date.now(),
      health: "healthy",
      consecutiveFailures: 0,
      lastErrorMessage: null,
    })
    resetClient(pending.userId)

    audit.append({
      correlationId, stage: "tradingview.oauth", outcome: "ok",
      userId: pending.userId,
      summary: "TradingView authorization completed",
      detail: { scopes: tokens.scopes, expiresAt: tokens.expiresAt },
    })

    // Best effort: a failure here leaves the connection usable but unreconciled.
    await refreshCapabilities(pending.userId, correlationId).catch((e) => {
      audit.append({
        correlationId, stage: "tradingview.oauth", outcome: "degraded",
        userId: pending.userId,
        summary: "connected, but tools/list reconciliation failed",
        detail: { error: e instanceof Error ? e.message : "unknown" },
      })
    })

    dashboard.searchParams.set("tv_connected", "1")
    return NextResponse.redirect(dashboard)
  } catch (e) {
    const code = e instanceof TradingViewOAuthError ? e.code : "exchange_failed"
    markNeedsReauthorization(pending.userId, code)
    audit.append({
      correlationId, stage: "tradingview.oauth", outcome: "error",
      userId: pending.userId, summary: "TradingView code exchange failed", detail: { code },
    })
    dashboard.searchParams.set("tv_error", code)
    return NextResponse.redirect(dashboard)
  }
}
