import { NextRequest, NextResponse } from "next/server"
import { describeConnection, disconnect, getConnection } from "@/lib/tradingview/connection-store"
import { connectorHealth, refreshCapabilities, resetClient } from "@/lib/tradingview/connector"
import { revokeTokens } from "@/lib/tradingview/oauth"
import { unverifiedCapabilities, ALL_CAPABILITIES } from "@/lib/tradingview/catalog"
import { currentUserId } from "@/lib/pipeline/current-user"
import { cacheStats } from "@/lib/tradingview/cache"
import * as audit from "@/lib/pipeline/audit"

/** Connection status, health and capability reconciliation state. No secrets. */
export async function GET(req: NextRequest) {
  const userId = currentUserId(req)
  return NextResponse.json({
    connection: describeConnection(userId),
    health: connectorHealth(userId),
    catalog: {
      total: ALL_CAPABILITIES.length,
      unverified: unverifiedCapabilities(),
      note:
        "Unverified capabilities have not been reconciled against a live tools/list. Run npm run tv:reconcile after authorizing.",
    },
    cache: cacheStats(),
  })
}

/** action: "refresh_capabilities" | "disconnect" */
export async function POST(req: NextRequest) {
  const userId = currentUserId(req)
  const body = await req.json().catch(() => ({}))
  const action = String(body?.action ?? "")
  const correlationId = audit.newCorrelationId("tv_conn")

  if (action === "refresh_capabilities") {
    try {
      const result = await refreshCapabilities(userId, correlationId)
      return NextResponse.json({ ok: true, ...result, connection: describeConnection(userId) })
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "capability refresh failed" },
        { status: 502 }
      )
    }
  }

  if (action === "disconnect") {
    const conn = getConnection(userId)
    // Revoke upstream where supported, but always drop local state.
    if (conn?.tokens) await revokeTokens(conn.tokens).catch(() => {})
    disconnect(userId)
    resetClient(userId)
    audit.append({
      correlationId, stage: "tradingview.oauth", outcome: "ok",
      userId, summary: "TradingView connection revoked", detail: {},
    })
    return NextResponse.json({ ok: true, connection: describeConnection(userId) })
  }

  return NextResponse.json({ error: `unknown action: ${action}` }, { status: 400 })
}
