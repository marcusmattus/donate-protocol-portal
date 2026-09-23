import { NextRequest, NextResponse } from "next/server"
import * as audit from "@/lib/pipeline/audit"
import { currentUserId } from "@/lib/pipeline/current-user"

/**
 * Audit ledger reader.
 *
 * `?correlationId=` returns the full ordered trace of one signal — the view
 * that answers "why did this trade happen" end to end. `?verify=1` re-hashes
 * the retained chain.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const correlationId = url.searchParams.get("correlationId")
  const stage = url.searchParams.get("stage") as audit.AuditStage | null
  const limit = Math.min(500, Number(url.searchParams.get("limit") ?? 100) || 100)
  const scopeAll = url.searchParams.get("all") === "1"

  if (correlationId) {
    return NextResponse.json({
      correlationId,
      trace: audit.trace(correlationId),
    })
  }

  return NextResponse.json({
    events: audit.list({
      userId: scopeAll ? undefined : currentUserId(req),
      stage: stage ?? undefined,
      limit,
    }),
    stats: audit.ledgerStats(),
    ...(url.searchParams.get("verify") === "1" ? { chain: audit.verifyChain() } : {}),
  })
}
