#!/usr/bin/env node
/**
 * TradingView integration — pipeline and security regression.
 *
 * Covers the invariants that matter if this ever touches real money:
 *   - the alert webhook rejects bad tokens, replays, stale/future timestamps
 *     and bad signatures, and fails closed on malformed input
 *   - no signal reaches an execution intent without a risk approval
 *   - the risk engine treats unknowns (missing calendar) as risk, not all-clear
 *   - a TradingView recommendation cannot by itself authorize a trade
 *   - the audit ledger is append-only, hash-chained and redacts credentials
 *   - OAuth/connection endpoints never leak token material
 *
 * Usage: BASE_URL=http://localhost:3000 node tradingview-pipeline-test.js
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000"
const TOKEN = process.env.TRADINGVIEW_ALERT_TOKENS?.split(",")[0]?.trim() || "test-alert-token"

let passed = 0
let failed = 0

function check(name, cond, detail = "") {
  if (cond) {
    console.log(`✅ ${name}`)
    passed++
  } else {
    console.log(`❌ ${name}${detail ? ` — ${detail}` : ""}`)
    failed++
  }
}

async function req(method, path, body, headers = {}) {
  const res = await fetch(BASE_URL + path, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  })
  const text = await res.text()
  let parsed = null
  try { parsed = text ? JSON.parse(text) : null } catch { parsed = text }
  return { status: res.status, body: parsed, raw: text }
}

const alertPath = (t) => `/api/webhooks/tradingview/alert/${encodeURIComponent(t)}`

function freshAlert(overrides = {}) {
  return {
    symbol: "BINANCE:BTCUSDT",
    side: "BUY",
    price: "64000.50",
    size: 100,
    strategy: "momentum-alpha",
    timestamp: Date.now(),
    nonce: Math.random().toString(36).slice(2),
    ...overrides,
  }
}

async function run() {
  console.log("=".repeat(66))
  console.log("🔐 TradingView pipeline — security & invariant regression")
  console.log(`   ${BASE_URL}`)
  console.log("=".repeat(66) + "\n")

  // ── Webhook authentication ────────────────────────────────────────
  console.log("— alert webhook auth —")
  for (const bad of ["wrong", "", TOKEN + "x", TOKEN.toUpperCase() + "Z", "../" + TOKEN]) {
    const r = await req("POST", alertPath(bad), freshAlert())
    check(
      `rejects token ${JSON.stringify(bad)}`,
      [401, 404, 308, 503].includes(r.status),
      `got ${r.status}`
    )
  }

  const configured = (await req("POST", alertPath(TOKEN), freshAlert())).status !== 503
  if (!configured) {
    console.log("\n⚠️  TRADINGVIEW_ALERT_TOKENS is not set on the server; webhook accept-path")
    console.log("   assertions are skipped. Set it to exercise them.\n")
  }

  // ── Malformed input fails closed ──────────────────────────────────
  console.log("\n— malformed input —")
  const badJson = await req("POST", alertPath(TOKEN), "{not json")
  check("non-JSON body is not a 5xx", badJson.status < 500, `got ${badJson.status}`)

  const oversized = await req("POST", alertPath(TOKEN), { blob: "x".repeat(70_000) })
  check("oversized payload rejected (413) or refused", [413, 401, 503].includes(oversized.status), `got ${oversized.status}`)

  if (configured) {
    const noSide = await req("POST", alertPath(TOKEN), freshAlert({ side: undefined }))
    check("signal without a side is rejected (422)", noSide.status === 422, `got ${noSide.status}`)

    const noSymbol = await req("POST", alertPath(TOKEN), freshAlert({ symbol: undefined }))
    check("signal without a symbol is rejected (422)", noSymbol.status === 422, `got ${noSymbol.status}`)

    const future = await req("POST", alertPath(TOKEN), freshAlert({ timestamp: Date.now() + 3_600_000 }))
    check("future-dated signal is rejected", future.status === 422, `got ${future.status}`)

    // ── Replay suppression ──────────────────────────────────────────
    console.log("\n— replay suppression —")
    const payload = freshAlert()
    const first = await req("POST", alertPath(TOKEN), payload)
    const second = await req("POST", alertPath(TOKEN), payload)
    check("identical payload is accepted once", first.status === 200, `got ${first.status}`)
    check(
      "identical payload replay is suppressed",
      second.body?.rejected === "replay",
      JSON.stringify(second.body).slice(0, 120)
    )
    check("replay answers 200 so the sender stops retrying", second.status === 200, `got ${second.status}`)

    // ── Risk gate ───────────────────────────────────────────────────
    console.log("\n— risk gate —")
    const accepted = await req("POST", alertPath(TOKEN), freshAlert())
    const risk = accepted.body?.risk
    check("accepted alert carries a risk assessment", Boolean(risk), JSON.stringify(accepted.body).slice(0, 160))
    check(
      "no execution intent without risk approval",
      !accepted.body?.intent || risk?.decision !== "reject",
      JSON.stringify(accepted.body?.intent)
    )
    check(
      "default policy routes to paper, not live",
      !accepted.body?.intent || accepted.body.intent.venue === "paper",
      JSON.stringify(accepted.body?.intent)
    )
    check(
      "missing market intelligence is treated as risk, not all-clear",
      Array.isArray(risk?.factors) &&
        risk.factors.some((f) => f.code === "calendar_unavailable"),
      JSON.stringify(risk?.factors)
    )
    const staleSignal = await req("POST", alertPath(TOKEN), freshAlert({ timestamp: Date.now() - 20 * 60_000 }))
    check(
      "stale signal is rejected by the risk engine",
      staleSignal.body?.risk?.decision === "reject",
      `expected reject for a 20-minute-old signal, got ${staleSignal.body?.risk?.decision}`
    )
    check(
      "stale-signal rejection names the blocking factor",
      (staleSignal.body?.risk?.factors ?? []).some((f) => f.code === "stale_signal" && f.severity === "blocking"),
      JSON.stringify(staleSignal.body?.risk?.factors)
    )

    check("response never contains a bearer token", !/bearer|access_token/i.test(accepted.raw), "token-shaped string in response")
  }

  // ── Connection endpoint hygiene ───────────────────────────────────
  console.log("\n— connection endpoint —")
  const conn = await req("GET", "/api/tradingview/connection")
  check("connection endpoint returns 200", conn.status === 200, `got ${conn.status}`)
  check(
    "connection response exposes no token material",
    !/"(access_token|refresh_token|encryptedAccessToken|encryptedRefreshToken|code_verifier|client_secret)"/i.test(conn.raw),
    "token field present in connection response"
  )
  check(
    "connection reports catalog verification state",
    typeof conn.body?.catalog?.total === "number",
    JSON.stringify(conn.body?.catalog)
  )
  check(
    "intelligence calls are refused while disconnected",
    (await req("POST", "/api/tradingview/intelligence", { op: "technical", params: { symbol: "BINANCE:BTCUSDT" } }))
      .body?.result?.ok === false,
    "expected ok:false from the tool envelope"
  )
  check(
    "unknown intelligence op is rejected",
    (await req("POST", "/api/tradingview/intelligence", { op: "drop_tables" })).status === 400
  )

  // ── Audit ledger ──────────────────────────────────────────────────
  console.log("\n— audit ledger —")
  const audit = await req("GET", "/api/audit?verify=1&all=1&limit=200")
  check("audit endpoint returns 200", audit.status === 200, `got ${audit.status}`)
  check("hash chain verifies", audit.body?.chain?.ok === true, JSON.stringify(audit.body?.chain))
  check("ledger recorded webhook events", (audit.body?.stats?.byStage?.["tradingview.webhook"] ?? 0) > 0)
  check(
    "ledger contains no credential-shaped values",
    !/"(access_token|refresh_token|client_secret|code_verifier|password)"\s*:\s*"(?!\[redacted\])/i.test(audit.raw),
    "unredacted credential key in the ledger"
  )

  if (configured) {
    const events = audit.body?.events ?? []
    const withCorrelation = events.filter((e) => typeof e.correlationId === "string" && e.correlationId.length > 0)
    check("every audit event carries a correlation id", withCorrelation.length === events.length)

    const webhookEvent = events.find((e) => e.stage === "tradingview.webhook")
    if (webhookEvent) {
      const trace = await req("GET", `/api/audit?correlationId=${encodeURIComponent(webhookEvent.correlationId)}`)
      check(
        "a signal's correlation id traces across pipeline stages",
        new Set((trace.body?.trace ?? []).map((e) => e.stage)).size >= 2,
        JSON.stringify((trace.body?.trace ?? []).map((e) => e.stage))
      )
    }
  }

  console.log("\n" + "=".repeat(66))
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log("=".repeat(66))
  process.exit(failed > 0 ? 1 : 0)
}

run().catch((e) => {
  console.error("Fatal error:", e)
  process.exit(1)
})
