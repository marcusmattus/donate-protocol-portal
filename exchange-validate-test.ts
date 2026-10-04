/**
 * Unit test for exchange credential validation.
 *
 * `fetch` is injected, so every classification is checked without touching a
 * network: the real exchange responses are pinned here as fixtures, captured
 * from live calls while building the adapters. That makes the suite
 * deterministic in CI, where Binance and Bybit are geo-blocked anyway.
 *
 * The property that matters most is negative: nothing unexpected may classify
 * as `valid`. A validator that fails open is worse than none, because it
 * launders an unchecked credential as a checked one.
 *
 *   node --experimental-strip-types exchange-validate-test.ts
 */

import assert from "node:assert"

const { supportsValidation, validateCredentials } = await import("./lib/exchanges/validate.ts")

let passed = 0
let failed = 0

async function check(name: string, fn: () => Promise<void> | void) {
  try {
    await fn()
    console.log(`✅ ${name}`)
    passed++
  } catch (e) {
    console.log(`❌ ${name} — ${e instanceof Error ? e.message : String(e)}`)
    failed++
  }
}

const CREDS = { apiKey: "key-abcdef123456", apiSecret: Buffer.from("secret-bytes-here").toString("base64"), passphrase: "pp" }

/** A fetch that always answers with one canned response. */
function respondWith(status: number, body: string): typeof fetch {
  return (async () => new Response(body, { status })) as unknown as typeof fetch
}
/** A fetch that fails the way a timeout or refused connection does. */
const networkDown = (async () => {
  throw new Error("ECONNREFUSED")
}) as unknown as typeof fetch

// Fixtures captured from the live APIs with a deliberately unknown key.
const KRAKEN_BAD_KEY = '{"result":null,"error":["EAPI:Invalid key"]}'
const KRAKEN_OK = '{"error":[],"result":{"ZUSD":"0.0000"}}'
const OKX_BAD_KEY = '{"msg":"Invalid OK-ACCESS-KEY","code":"50111"}'
const OKX_OK = '{"code":"0","data":[{"totalEq":"0"}],"msg":""}'
const KUCOIN_BAD_KEY = '{"code":"400003","msg":"The API key does not exist or site mismatch."}'
const KUCOIN_OK = '{"code":"200000","data":[]}'

console.log("— which exchanges have a verified signer —")

await check("the three verified exchanges are supported", () => {
  for (const ex of ["kraken", "okx", "kucoin"]) {
    assert.ok(supportsValidation(ex), `${ex} should be supported`)
  }
})

await check("exchanges whose signing could not be verified are not claimed", () => {
  for (const ex of ["binance", "bybit", "coinbase"]) {
    assert.ok(!supportsValidation(ex), `${ex} must not claim validation support`)
  }
})

await check("an unsupported exchange reports unsupported, not rejected", async () => {
  const r = await validateCredentials("binance", CREDS, { fetchImpl: respondWith(200, "{}") })
  assert.equal(r.status, "unsupported")
})

await check("an unknown exchange id reports unsupported", async () => {
  const r = await validateCredentials("not-an-exchange", CREDS, { fetchImpl: respondWith(200, "{}") })
  assert.equal(r.status, "unsupported")
})

console.log("— rejection, per exchange, from real error bodies —")

await check("Kraken's invalid-key error is a rejection", async () => {
  const r = await validateCredentials("kraken", CREDS, { fetchImpl: respondWith(200, KRAKEN_BAD_KEY) })
  assert.equal(r.status, "rejected")
})

await check("OKX's invalid-key error is a rejection", async () => {
  const r = await validateCredentials("okx", CREDS, { fetchImpl: respondWith(401, OKX_BAD_KEY) })
  assert.equal(r.status, "rejected")
})

await check("KuCoin's missing-key error is a rejection", async () => {
  const r = await validateCredentials("kucoin", CREDS, { fetchImpl: respondWith(401, KUCOIN_BAD_KEY) })
  assert.equal(r.status, "rejected")
})

await check("a Kraken permission error is a rejection, not a pass", async () => {
  const body = '{"result":null,"error":["EGeneral:Permission denied"]}'
  const r = await validateCredentials("kraken", CREDS, { fetchImpl: respondWith(200, body) })
  assert.equal(r.status, "rejected")
})

console.log("— success, per exchange —")

await check("Kraken's empty error array is a pass", async () => {
  const r = await validateCredentials("kraken", CREDS, { fetchImpl: respondWith(200, KRAKEN_OK) })
  assert.equal(r.status, "valid")
})

await check("OKX code 0 is a pass", async () => {
  const r = await validateCredentials("okx", CREDS, { fetchImpl: respondWith(200, OKX_OK) })
  assert.equal(r.status, "valid")
})

await check("KuCoin code 200000 is a pass", async () => {
  const r = await validateCredentials("kucoin", CREDS, { fetchImpl: respondWith(200, KUCOIN_OK) })
  assert.equal(r.status, "valid")
})

console.log("— nothing unexpected may pass —")

await check("a dead network is unreachable, not rejected", async () => {
  for (const ex of ["kraken", "okx", "kucoin"]) {
    const r = await validateCredentials(ex, CREDS, { fetchImpl: networkDown })
    assert.equal(r.status, "unreachable", `${ex} should be unreachable`)
  }
})

await check("Binance's 451 restricted-location body is unreachable", async () => {
  // Binance has no adapter, but the shared geo-block classifier must not treat
  // a block as a rejection for the exchanges that do.
  const body = '{"code":0,"msg":"Service unavailable from a restricted location"}'
  const r = await validateCredentials("kraken", CREDS, { fetchImpl: respondWith(451, body) })
  assert.equal(r.status, "unreachable")
})

await check("a CloudFront country block is unreachable", async () => {
  const body = "The Amazon CloudFront distribution is configured to block access from your country"
  const r = await validateCredentials("okx", CREDS, { fetchImpl: respondWith(403, body) })
  assert.equal(r.status, "unreachable")
})

await check("an HTML error page is unreachable, never valid", async () => {
  for (const ex of ["kraken", "okx", "kucoin"]) {
    const r = await validateCredentials(ex, CREDS, { fetchImpl: respondWith(502, "<html>bad gateway</html>") })
    assert.equal(r.status, "unreachable", `${ex} should be unreachable`)
  }
})

await check("an empty 200 body is unreachable, never valid", async () => {
  for (const ex of ["kraken", "okx", "kucoin"]) {
    const r = await validateCredentials(ex, CREDS, { fetchImpl: respondWith(200, "") })
    assert.equal(r.status, "unreachable", `${ex} should be unreachable`)
  }
})

await check("an adapter that throws is unreachable, never rejected", async () => {
  const throwing = (() => {
    throw new Error("boom")
  }) as unknown as typeof fetch
  const r = await validateCredentials("kraken", CREDS, { fetchImpl: throwing })
  assert.equal(r.status, "unreachable")
})

console.log("— missing inputs —")

await check("a passphrase-requiring exchange rejects without one", async () => {
  for (const ex of ["okx", "kucoin"]) {
    const r = await validateCredentials(ex, { ...CREDS, passphrase: null }, { fetchImpl: respondWith(200, "{}") })
    assert.equal(r.status, "rejected", `${ex} should reject a missing passphrase`)
  }
})

await check("a Kraken secret that is not base64 is rejected locally", async () => {
  // Kraken secrets are base64; this never reaches the network.
  let called = false
  const spy = (async () => {
    called = true
    return new Response(KRAKEN_OK, { status: 200 })
  }) as unknown as typeof fetch
  const r = await validateCredentials("kraken", { ...CREDS, apiSecret: "!!!not base64!!!" }, { fetchImpl: spy })
  assert.equal(r.status, "rejected")
  assert.equal(called, false, "an undecodable secret should not be sent anywhere")
})

console.log("— the result carries no secret —")

await check("no status, reason or result field contains the credential", async () => {
  const fixtures: [string, number, string][] = [
    ["kraken", 200, KRAKEN_BAD_KEY],
    ["okx", 401, OKX_BAD_KEY],
    ["kucoin", 401, KUCOIN_BAD_KEY],
  ]
  for (const [ex, status, body] of fixtures) {
    const r = await validateCredentials(ex, CREDS, { fetchImpl: respondWith(status, body) })
    const serialized = JSON.stringify(r)
    assert.ok(!serialized.includes(CREDS.apiKey), `${ex} leaked the api key`)
    assert.ok(!serialized.includes(CREDS.apiSecret), `${ex} leaked the api secret`)
    assert.ok(!serialized.includes(CREDS.passphrase), `${ex} leaked the passphrase`)
  }
})

await check("the reason never forwards the exchange's raw body", async () => {
  // An exchange error can quote the submitted key back at us; the mapped reason
  // must not carry it through.
  const body = `{"error":["EAPI:Invalid key ${CREDS.apiKey}"]}`
  const r = await validateCredentials("kraken", CREDS, { fetchImpl: respondWith(200, body) })
  assert.equal(r.status, "rejected")
  assert.ok(!r.reason.includes(CREDS.apiKey), "the raw body was forwarded into the reason")
})

console.log("— the kill switch —")

await check("EXCHANGE_VALIDATION=off disables probing entirely", async () => {
  process.env.EXCHANGE_VALIDATION = "off"
  try {
    let called = false
    const spy = (async () => {
      called = true
      return new Response(KRAKEN_OK, { status: 200 })
    }) as unknown as typeof fetch
    const r = await validateCredentials("kraken", CREDS, { fetchImpl: spy })
    assert.equal(r.status, "unsupported")
    assert.equal(called, false, "a probe went out with validation switched off")
  } finally {
    delete process.env.EXCHANGE_VALIDATION
  }
})

console.log("\n" + "=".repeat(60))
console.log(`✅ Passed: ${passed}`)
console.log(`❌ Failed: ${failed}`)
console.log("=".repeat(60))
process.exit(failed > 0 ? 1 : 0)
