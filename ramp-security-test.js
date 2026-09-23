#!/usr/bin/env node

/**
 * Focused security regression for the two surfaces the Charity Swap Ramp added:
 *
 *   POST /api/webhooks/tradingview/:token   (now accepts action:"ramp")
 *   GET|POST /api/ramp                      (quote + execute)
 *
 * The webhook is the security-sensitive one: it is unauthenticated apart from a
 * path token, and the ramp action lets a caller move a position forward. These
 * assertions pin the properties that keep that safe — the token gate, bounded
 * fills, clamped inputs, and malformed bodies failing closed rather than 500ing.
 *
 * Usage: node ramp-security-test.js         (server on $BASE_URL, default :3000)
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000"
const VALID_TOKEN = "demo123"

let passed = 0
let failed = 0

async function req(method, path, body) {
  const res = await fetch(BASE_URL + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  })
  const text = await res.text()
  let parsed = null
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    parsed = text
  }
  return { status: res.status, body: parsed, raw: text }
}

function check(name, condition, detail = "") {
  if (condition) {
    console.log(`✅ ${name}`)
    passed++
  } else {
    console.log(`❌ ${name}${detail ? ` — ${detail}` : ""}`)
    failed++
  }
}

async function run() {
  console.log("=".repeat(60))
  console.log("🔒 Charity Ramp — security regression")
  console.log(`   ${BASE_URL}`)
  console.log("=".repeat(60) + "\n")

  // ── Webhook token gate ────────────────────────────────────────────
  console.log("— webhook auth —")

  for (const token of ["nope", "demo123x", "../demo123", "demo123 ", "DEMO123"]) {
    const r = await req("POST", `/api/webhooks/tradingview/${encodeURIComponent(token)}`, {
      action: "ramp",
    })
    check(
      `ramp action rejected for token ${JSON.stringify(token)}`,
      r.status === 401 || r.status === 404,
      `got ${r.status}`
    )
  }

  const tradeBadToken = await req("POST", "/api/webhooks/tradingview/nope", {
    symbol: "SOLUSDT",
    side: "BUY",
    price: "180",
    size: 10,
    strategy: "Momentum Alpha",
  })
  check("trade action rejected for bad token", tradeBadToken.status === 401, `got ${tradeBadToken.status}`)

  // The legacy untokenized route (POST /api/webhooks/tradingview) predates this
  // work and has no auth at all — it simulates a trade and a donation for any
  // caller. That is a known pre-existing gap, tracked separately. What this PR
  // must guarantee is that it cannot reach the ramp machinery: only the
  // token-gated route advances a position.
  const legacyRamp = await req("POST", "/api/webhooks/tradingview", {
    action: "ramp",
    rampId: "ramp-anything",
  })
  const legacyText = JSON.stringify(legacyRamp.body)
  check(
    "untokenized legacy route cannot advance a ramp",
    !/\brampId\b|"tranche"|"venue"/.test(legacyText),
    legacyText.slice(0, 160)
  )

  // ── Malformed bodies fail closed ──────────────────────────────────
  console.log("\n— malformed input —")

  const badJson = await req("POST", `/api/webhooks/tradingview/${VALID_TOKEN}`, "{not json")
  check("webhook rejects non-JSON with 400, not 500", badJson.status === 400, `got ${badJson.status}`)

  const badJsonRamp = await req("POST", "/api/ramp", "{not json")
  check("/api/ramp rejects non-JSON with 400, not 500", badJsonRamp.status === 400, `got ${badJsonRamp.status}`)

  const unknownAction = await req("POST", "/api/ramp", { action: "drain" })
  check("/api/ramp rejects unknown action", unknownAction.status === 400, `got ${unknownAction.status}`)

  // ── Input clamping ────────────────────────────────────────────────
  console.log("\n— input clamping —")

  const hostile = await req("POST", "/api/ramp", {
    action: "quote",
    principalUsd: -5,
    tranches: 9999,
    intervalHours: -100,
    donationRatePct: 500,
    venueId: "../../etc/passwd",
    charityId: "bogus",
    harvestCadence: "hourly",
    horizonDays: 0,
  })
  const cfg = hostile.body?.projection?.config
  check("hostile quote still returns 200", hostile.status === 200, `got ${hostile.status}`)
  check("negative principal clamped above zero", cfg && cfg.principalUsd > 0, JSON.stringify(cfg?.principalUsd))
  check("tranche count capped", cfg && cfg.tranches <= 52, JSON.stringify(cfg?.tranches))
  check("negative interval clamped to >= 0", cfg && cfg.intervalHours >= 0, JSON.stringify(cfg?.intervalHours))
  check("donation rate capped at 100%", cfg && cfg.donationRatePct <= 100, JSON.stringify(cfg?.donationRatePct))
  check("unknown venue falls back to a known one", cfg && cfg.venueId === "kamino-usdc", JSON.stringify(cfg?.venueId))
  check("unknown charity falls back to a known one", cfg && cfg.charityId === "solar-future", JSON.stringify(cfg?.charityId))
  check("unknown cadence falls back to a known one", cfg && ["daily", "weekly", "monthly", "quarterly"].includes(cfg.harvestCadence), JSON.stringify(cfg?.harvestCadence))
  check("horizon clamped to a positive window", cfg && cfg.horizonDays >= 7, JSON.stringify(cfg?.horizonDays))

  const nonNumeric = await req("POST", "/api/ramp", {
    action: "quote",
    principalUsd: "NaN",
    tranches: "abc",
    horizonDays: null,
  })
  check(
    "non-numeric fields fall back rather than producing NaN",
    nonNumeric.status === 200 && Number.isFinite(nonNumeric.body?.projection?.grossYieldUsd),
    JSON.stringify(nonNumeric.body?.projection?.grossYieldUsd)
  )

  // ── Ramp fills are bounded (replay containment) ───────────────────
  console.log("\n— ramp fill bounds —")

  const TRANCHES = 3
  const opened = await req("POST", "/api/ramp", {
    action: "execute",
    principalUsd: 1000,
    venueId: "kamino-usdc",
    tranches: TRANCHES,
    intervalHours: 1,
    donationRatePct: 50,
    charityId: "kids-first",
    harvestCadence: "weekly",
    horizonDays: 90,
  })
  const rampId = opened.body?.position?.id
  check("execute opens a position", opened.status === 200 && !!rampId, `got ${opened.status}`)
  check("position starts with one tranche filled", opened.body?.position?.filled === 1, JSON.stringify(opened.body?.position?.filled))

  // Fire many more alerts than the schedule has tranches.
  let lastFill = null
  let okFills = 0
  for (let i = 0; i < TRANCHES + 5; i++) {
    const r = await req("POST", `/api/webhooks/tradingview/${VALID_TOKEN}`, { action: "ramp", rampId })
    if (r.body?.ok) {
      okFills++
      lastFill = r.body
    }
  }
  check(
    `replayed alerts cannot fill past the schedule (${okFills} accepted for ${TRANCHES - 1} remaining)`,
    okFills === TRANCHES - 1,
    `accepted ${okFills}`
  )
  check("position ends active, not over-filled", lastFill?.status === "active", JSON.stringify(lastFill?.status))
  check(
    "final tranche index never exceeds the configured count",
    lastFill && lastFill.tranche.index <= lastFill.tranche.of,
    JSON.stringify(lastFill?.tranche)
  )

  const unknownRamp = await req("POST", `/api/webhooks/tradingview/${VALID_TOKEN}`, {
    action: "ramp",
    rampId: "ramp-does-not-exist",
  })
  check("unknown rampId returns ok:false, not a crash", unknownRamp.status === 200 && unknownRamp.body?.ok === false, `got ${unknownRamp.status}`)
  check("unknown rampId does not leak other positions", !JSON.stringify(unknownRamp.body).includes(rampId), unknownRamp.raw.slice(0, 120))

  // ── Response hygiene ──────────────────────────────────────────────
  console.log("\n— response hygiene —")

  const catalog = await req("GET", "/api/ramp")
  const catalogText = JSON.stringify(catalog.body)
  check("catalog returns 200", catalog.status === 200, `got ${catalog.status}`)
  check(
    "catalog exposes no env/secret-shaped keys",
    !/("|\b)(api[_-]?key|secret|private[_-]?key|seed|mnemonic|password|token)("|\b)\s*:/i.test(catalogText),
    "possible secret-shaped key in response"
  )

  console.log("\n" + "=".repeat(60))
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log("=".repeat(60))
  process.exit(failed > 0 ? 1 : 0)
}

run().catch((e) => {
  console.error("Fatal error:", e)
  process.exit(1)
})
