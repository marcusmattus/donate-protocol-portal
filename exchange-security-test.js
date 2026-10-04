#!/usr/bin/env node
/**
 * Exchange connection — security regression.
 *
 * Storing a live exchange API secret is the most sensitive thing this app does,
 * so these assertions pin the properties that make it safe at the HTTP boundary:
 *
 *   - a session is required, and no path falls back to the demo identity
 *   - one user can never see or revoke another user's connection
 *   - no response, on any path, carries the key, secret or passphrase back
 *   - revocation actually removes it
 *   - with no master key configured the server refuses rather than storing
 *     something it cannot protect
 *
 * What happens *inside* the sealing boundary is not observable from here — from
 * outside, "sealed" and "stored in clear but never echoed" look the same. That
 * is what exchange-crypto-test.ts is for; the two suites are complements.
 *
 * Usage: BASE_URL=http://localhost:3000 SESSION_SECRET=... node exchange-security-test.js
 */

const crypto = require("crypto")

const BASE_URL = process.env.BASE_URL || "http://localhost:3000"
const SESSION_SECRET = process.env.SESSION_SECRET
const SESSION_COOKIE = "dp_session"

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

async function req(method, path, body, extraHeaders = {}) {
  const res = await fetch(BASE_URL + path, {
    method,
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const raw = await res.text()
  let parsed = null
  try {
    parsed = JSON.parse(raw)
  } catch {}
  return { status: res.status, body: parsed, raw }
}

/** Mint a session cookie the server will accept, the way the app's own does. */
function sessionCookie(did) {
  const b = (o) => Buffer.from(JSON.stringify(o)).toString("base64url")
  const now = Math.floor(Date.now() / 1000)
  const header = b({ alg: "HS256", typ: "JWT" })
  const payload = b({
    userId: did,
    sub: did,
    iss: "donate-protocol",
    aud: "donate-protocol-session",
    iat: now,
    exp: now + 3600,
  })
  const sig = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url")
  return `${SESSION_COOKIE}=${header}.${payload}.${sig}`
}

const SECRETS = {
  apiKey: "alice-api-key-abcdef123456",
  apiSecret: "alice-api-secret-zyxwvu987654",
  passphrase: "alice-passphrase-value",
}

/** Does this response body leak any submitted secret, anywhere? */
function leaksSecret(raw) {
  return Object.values(SECRETS).some((v) => raw.includes(v))
}

async function run() {
  console.log("🔐 Exchange Connection Security Suite")
  console.log(`Base URL: ${BASE_URL}\n`)

  if (!SESSION_SECRET || SESSION_SECRET.length < 16) {
    console.log("SESSION_SECRET must be set to the server's value to run this suite.")
    process.exit(1)
  }

  // ── No session, no access ────────────────────────────────────────
  console.log("— authentication —")
  const anonGet = await req("GET", "/api/exchanges")
  check("GET without a session is 401", anonGet.status === 401, `got ${anonGet.status}`)
  check(
    "GET without a session lists nothing",
    !anonGet.raw.includes("connections") || anonGet.body?.connections === undefined,
    anonGet.raw.slice(0, 120)
  )

  const anonPost = await req("POST", "/api/exchanges", { exchange: "kraken", ...SECRETS })
  check("POST without a session is 401", anonPost.status === 401, `got ${anonPost.status}`)
  check("POST without a session never echoes the secret", !leaksSecret(anonPost.raw))

  const anonDelete = await req("DELETE", "/api/exchanges?id=exc_whatever")
  check("DELETE without a session is 401", anonDelete.status === 401, `got ${anonDelete.status}`)

  // ── Storing ──────────────────────────────────────────────────────
  console.log("— storing —")
  const alice = sessionCookie("did:privy:alice" + crypto.randomBytes(4).toString("hex"))
  const bob = sessionCookie("did:privy:bob" + crypto.randomBytes(4).toString("hex"))

  const aliceGet = await req("GET", "/api/exchanges", undefined, { cookie: alice })
  check("GET with a session is 200", aliceGet.status === 200, `got ${aliceGet.status}`)
  check(
    "a new user starts with no connections",
    Array.isArray(aliceGet.body?.connections) && aliceGet.body.connections.length === 0,
    JSON.stringify(aliceGet.body?.connections)
  )
  const sealingConfigured = aliceGet.body?.sealingConfigured === true

  const created = await req("POST", "/api/exchanges", { exchange: "kraken", ...SECRETS }, { cookie: alice })

  if (!sealingConfigured) {
    console.log("\n   EXCHANGE_ENCRYPTION_KEY is not set on the server.")
    console.log("   Asserting the refusal path instead — it must not store anything.\n")
    check("storing is refused with 503 when no master key is set", created.status === 503, `got ${created.status}`)
    check("the refusal never echoes the secret", !leaksSecret(created.raw))
    const afterRefusal = await req("GET", "/api/exchanges", undefined, { cookie: alice })
    check(
      "nothing was stored by the refused request",
      afterRefusal.body?.connections?.length === 0,
      JSON.stringify(afterRefusal.body?.connections)
    )
  } else {
    check("storing a connection is 201", created.status === 201, `got ${created.status}`)
    check("the create response never echoes the secret", !leaksSecret(created.raw))
    check(
      "the create response exposes at most four key characters",
      created.body?.connection?.hint === "…3456",
      JSON.stringify(created.body?.connection?.hint)
    )
    check(
      "the create response carries a fingerprint, not the key",
      typeof created.body?.connection?.fingerprint === "string" &&
        !created.body.connection.fingerprint.includes(SECRETS.apiKey),
      JSON.stringify(created.body?.connection?.fingerprint)
    )
    check(
      "the stored connection records that a passphrase is held, without showing it",
      created.body?.connection?.hasPassphrase === true && !created.raw.includes(SECRETS.passphrase),
      JSON.stringify(created.body?.connection?.hasPassphrase)
    )

    const connectionId = created.body?.connection?.id

    const aliceList = await req("GET", "/api/exchanges", undefined, { cookie: alice })
    check(
      "the connection appears in the owner's list",
      aliceList.body?.connections?.some((c) => c.id === connectionId),
      JSON.stringify(aliceList.body?.connections?.map((c) => c.id))
    )
    check("listing never echoes the secret", !leaksSecret(aliceList.raw))

    // ── Isolation ─────────────────────────────────────────────────
    console.log("— isolation between users —")
    const bobList = await req("GET", "/api/exchanges", undefined, { cookie: bob })
    check(
      "another user does not see it",
      bobList.status === 200 && bobList.body?.connections?.length === 0,
      JSON.stringify(bobList.body?.connections)
    )

    const bobRevoke = await req("DELETE", `/api/exchanges?id=${connectionId}`, undefined, { cookie: bob })
    check("another user cannot revoke it", bobRevoke.status === 404, `got ${bobRevoke.status}`)
    const stillThere = await req("GET", "/api/exchanges", undefined, { cookie: alice })
    check(
      "it survives another user's revoke attempt",
      stillThere.body?.connections?.some((c) => c.id === connectionId),
      "the connection disappeared after a foreign revoke"
    )

    // ── Input validation ──────────────────────────────────────────
    console.log("— input validation —")
    const unknown = await req("POST", "/api/exchanges", { exchange: "not-an-exchange", ...SECRETS }, { cookie: alice })
    check("an unknown exchange is rejected", unknown.status === 400, `got ${unknown.status}`)
    check("the rejection never echoes the secret", !leaksSecret(unknown.raw))

    const short = await req("POST", "/api/exchanges", { exchange: "kraken", apiKey: "a", apiSecret: "b" }, { cookie: alice })
    check("an implausibly short credential is rejected", short.status === 400, `got ${short.status}`)

    const noPass = await req(
      "POST",
      "/api/exchanges",
      { exchange: "okx", apiKey: SECRETS.apiKey, apiSecret: SECRETS.apiSecret },
      { cookie: alice }
    )
    check("an exchange needing a passphrase rejects one without", noPass.status === 400, `got ${noPass.status}`)

    const garbage = await req("POST", "/api/exchanges", "not-an-object", { cookie: alice })
    check("a malformed body fails closed", garbage.status === 400 || garbage.status === 500, `got ${garbage.status}`)

    // ── Validation ────────────────────────────────────────────────
    // These must not depend on an exchange being reachable from CI, so the
    // assertions allow any non-"valid" outcome: the credentials here are fake,
    // so a pass would mean the validator fails open.
    console.log("— validation —")
    check(
      "the catalog says which exchanges can be validated",
      aliceList.body?.exchanges?.some((e) => e.canValidate === true) &&
        aliceList.body.exchanges.some((e) => e.canValidate === false),
      JSON.stringify(aliceList.body?.exchanges?.map((e) => [e.id, e.canValidate]))
    )
    check(
      "an exchange without a verified signer explains why",
      aliceList.body?.exchanges
        ?.filter((e) => !e.canValidate)
        .every((e) => typeof e.validationNote === "string" && e.validationNote.length > 0),
      "a non-validatable exchange carries no note"
    )
    check(
      "the server reports whether validation is switched on",
      typeof aliceList.body?.validationEnabled === "boolean",
      JSON.stringify(aliceList.body?.validationEnabled)
    )

    // validate:false stores without probing anything.
    const unvalidated = await req(
      "POST",
      "/api/exchanges",
      { exchange: "kraken", apiKey: SECRETS.apiKey, apiSecret: SECRETS.apiSecret, validate: false },
      { cookie: alice }
    )
    check("validate:false stores without checking", unvalidated.status === 201, `got ${unvalidated.status}`)
    check(
      "an unchecked connection reports no validation",
      unvalidated.body?.connection?.validation === null,
      JSON.stringify(unvalidated.body?.connection?.validation)
    )
    const unvalidatedId = unvalidated.body?.connection?.id

    // A fake credential must never come back valid.
    const checked = await req(
      "POST",
      "/api/exchanges",
      { exchange: "kraken", apiKey: SECRETS.apiKey, apiSecret: SECRETS.apiSecret },
      { cookie: alice }
    )
    check("a validated create still stores", checked.status === 201, `got ${checked.status}`)
    check(
      "a fake credential is never reported valid",
      checked.body?.connection?.validation?.status !== undefined &&
        checked.body.connection.validation.status !== "valid",
      JSON.stringify(checked.body?.connection?.validation)
    )
    check(
      "a rejected credential is still stored rather than discarded",
      Boolean(checked.body?.connection?.id),
      "the connection was not stored"
    )
    check("the validation response never echoes the secret", !leaksSecret(checked.raw))

    // ── Re-validation ─────────────────────────────────────────────
    console.log("— re-validation —")
    const anonPut = await req("PUT", `/api/exchanges?id=${unvalidatedId}`)
    check("PUT without a session is 401", anonPut.status === 401, `got ${anonPut.status}`)

    const bobPut = await req("PUT", `/api/exchanges?id=${unvalidatedId}`, undefined, { cookie: bob })
    check("another user cannot re-validate it", bobPut.status === 404, `got ${bobPut.status}`)

    const putUnknown = await req("PUT", "/api/exchanges?id=exc_doesnotexist", undefined, { cookie: alice })
    check("re-validating an unknown id is 404", putUnknown.status === 404, `got ${putUnknown.status}`)

    const revalidated = await req("PUT", `/api/exchanges?id=${unvalidatedId}`, undefined, { cookie: alice })
    check("the owner can re-validate", revalidated.status === 200, `got ${revalidated.status}`)
    check(
      "re-validation records an outcome",
      typeof revalidated.body?.connection?.validation?.status === "string" &&
        revalidated.body.connection.validation.status !== "valid",
      JSON.stringify(revalidated.body?.connection?.validation)
    )
    check("re-validation never echoes the secret", !leaksSecret(revalidated.raw))

    const tooSoon = await req("PUT", `/api/exchanges?id=${unvalidatedId}`, undefined, { cookie: alice })
    check(
      "a second re-validation is rate limited",
      tooSoon.status === 429,
      `got ${tooSoon.status} — the cooldown did not apply`
    )
    check(
      "the rate limit says how long to wait",
      typeof tooSoon.body?.retryAfterMs === "number" && tooSoon.body.retryAfterMs > 0,
      JSON.stringify(tooSoon.body)
    )

    // ── Revocation ────────────────────────────────────────────────
    console.log("— revocation —")
    const revoked = await req("DELETE", `/api/exchanges?id=${connectionId}`, undefined, { cookie: alice })
    check("the owner can revoke it", revoked.status === 200, `got ${revoked.status}`)
    const afterRevoke = await req("GET", "/api/exchanges", undefined, { cookie: alice })
    check(
      "a revoked connection is gone from the list",
      !afterRevoke.body?.connections?.some((c) => c.id === connectionId),
      JSON.stringify(afterRevoke.body?.connections?.map((c) => c.id))
    )
    const revokeAgain = await req("DELETE", `/api/exchanges?id=${connectionId}`, undefined, { cookie: alice })
    check("revoking twice is 404, not an error", revokeAgain.status === 404, `got ${revokeAgain.status}`)
  }

  // ── The audit trail must not become a secret store ───────────────
  console.log("— audit trail —")
  const auditRes = await req("GET", "/api/audit?limit=25")
  check("audit endpoint responds", auditRes.status === 200, `got ${auditRes.status}`)
  check("the audit ledger holds no exchange secret", !leaksSecret(auditRes.raw))

  console.log("\n" + "=".repeat(64))
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log("=".repeat(64))
  process.exit(failed > 0 ? 1 : 0)
}

run().catch((e) => {
  console.error("Fatal error:", e)
  process.exit(1)
})
