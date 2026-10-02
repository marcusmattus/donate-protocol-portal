/**
 * Unit test for the exchange credential sealing layer.
 *
 * The HTTP suites cannot see inside the sealing boundary: from outside, "sealed
 * correctly" and "stored in clear but never returned" look identical. These
 * assertions are the only place the difference is actually checked.
 *
 * Run with Node's type stripping, no build step and no test framework:
 *
 *   node --experimental-strip-types exchange-crypto-test.ts
 */

import assert from "node:assert"

const MASTER = "unit-test-master-key-at-least-32-chars-long"

// Set before importing, since the module reads the environment per call but the
// intent is clearer when the key is in place from the start.
process.env.EXCHANGE_ENCRYPTION_KEY = MASTER

const {
  credentialContext,
  isSealingConfigured,
  keyFingerprint,
  keyHint,
  open,
  seal,
  SealedDataError,
  SealingUnavailableError,
} = await import("./lib/exchanges/crypto.ts")

let passed = 0
let failed = 0

function check(name: string, fn: () => void) {
  try {
    fn()
    console.log(`✅ ${name}`)
    passed++
  } catch (e) {
    console.log(`❌ ${name} — ${e instanceof Error ? e.message : String(e)}`)
    failed++
  }
}

const CTX = "dp:exchange:v1|user=did:privy:alice|conn=exc_1|ex=kraken|field=apiSecret"
const SECRET = "sk-live-0123456789abcdefghijklmnop"

console.log("— sealing —")

check("reports configured with a long enough key", () => {
  assert.equal(isSealingConfigured(), true)
})

check("round-trips a secret", () => {
  assert.equal(open(seal(SECRET, CTX), CTX), SECRET)
})

check("ciphertext does not contain the plaintext", () => {
  const sealed = seal(SECRET, CTX)
  assert.ok(!sealed.includes(SECRET), "plaintext visible in sealed value")
  // Also check the decoded bytes, not just the base64url envelope.
  const raw = sealed
    .split(".")
    .slice(1)
    .map((p) => Buffer.from(p, "base64url").toString("binary"))
    .join("")
  assert.ok(!raw.includes(SECRET), "plaintext visible in decoded bytes")
})

check("same plaintext seals differently every time", () => {
  const a = seal(SECRET, CTX)
  const b = seal(SECRET, CTX)
  assert.notEqual(a, b, "sealing is deterministic — salt or IV is not random")
  assert.equal(open(a, CTX), open(b, CTX))
})

check("is versioned", () => {
  assert.ok(seal(SECRET, CTX).startsWith("v1."), "no version prefix")
})

console.log("— tampering and context binding —")

check("a flipped ciphertext byte fails to open", () => {
  const parts = seal(SECRET, CTX).split(".")
  const ct = Buffer.from(parts[4], "base64url")
  ct[0] ^= 0xff
  parts[4] = ct.toString("base64url")
  assert.throws(() => open(parts.join("."), CTX), SealedDataError)
})

check("a flipped auth tag fails to open", () => {
  const parts = seal(SECRET, CTX).split(".")
  const tag = Buffer.from(parts[3], "base64url")
  tag[0] ^= 0xff
  parts[3] = tag.toString("base64url")
  assert.throws(() => open(parts.join("."), CTX), SealedDataError)
})

check("a different user's context cannot open it", () => {
  const sealed = seal(SECRET, CTX)
  const otherUser = CTX.replace("user=did:privy:alice", "user=did:privy:bob")
  assert.throws(() => open(sealed, otherUser), SealedDataError)
})

check("a different field's context cannot open it", () => {
  const sealed = seal(SECRET, CTX)
  assert.throws(() => open(sealed, CTX.replace("field=apiSecret", "field=apiKey")), SealedDataError)
})

check("a different record id cannot open it", () => {
  const sealed = seal(SECRET, CTX)
  assert.throws(() => open(sealed, CTX.replace("conn=exc_1", "conn=exc_2")), SealedDataError)
})

check("a malformed value is rejected rather than throwing a crypto error", () => {
  assert.throws(() => open("not-sealed", CTX), SealedDataError)
  assert.throws(() => open("v9.a.b.c.d", CTX), SealedDataError)
})

console.log("— key handling —")

check("a different master key cannot open it", () => {
  const sealed = seal(SECRET, CTX)
  process.env.EXCHANGE_ENCRYPTION_KEY = "a-completely-different-master-key-32chars"
  try {
    assert.throws(() => open(sealed, CTX), SealedDataError)
  } finally {
    process.env.EXCHANGE_ENCRYPTION_KEY = MASTER
  }
})

check("no key means unavailable, not a weak default", () => {
  delete process.env.EXCHANGE_ENCRYPTION_KEY
  try {
    assert.equal(isSealingConfigured(), false)
    assert.throws(() => seal(SECRET, CTX), SealingUnavailableError)
    assert.throws(() => keyFingerprint("abc"), SealingUnavailableError)
  } finally {
    process.env.EXCHANGE_ENCRYPTION_KEY = MASTER
  }
})

check("a short key is treated as no key", () => {
  process.env.EXCHANGE_ENCRYPTION_KEY = "too-short"
  try {
    assert.equal(isSealingConfigured(), false)
    assert.throws(() => seal(SECRET, CTX), SealingUnavailableError)
  } finally {
    process.env.EXCHANGE_ENCRYPTION_KEY = MASTER
  }
})

console.log("— fingerprint and hint —")

check("fingerprint is stable and not the key", () => {
  const key = "api-key-abcdef123456"
  assert.equal(keyFingerprint(key), keyFingerprint(key))
  assert.ok(!keyFingerprint(key).includes(key))
  assert.notEqual(keyFingerprint(key), keyFingerprint(key + "x"))
})

check("fingerprint is keyed, not a bare digest of the key", () => {
  const key = "api-key-abcdef123456"
  const withMaster = keyFingerprint(key)
  process.env.EXCHANGE_ENCRYPTION_KEY = "a-completely-different-master-key-32chars"
  try {
    assert.notEqual(keyFingerprint(key), withMaster)
  } finally {
    process.env.EXCHANGE_ENCRYPTION_KEY = MASTER
  }
})

check("hint exposes at most four characters", () => {
  assert.equal(keyHint("abcdefghijkl"), "…ijkl")
  assert.equal(keyHint("abc"), "…")
})

console.log("— record context —")

// The store builds its seal and open contexts with this same function, so these
// assertions cover the binding the store relies on rather than a copy of it.
const aliceSecret = credentialContext({
  userId: "did:privy:alice",
  connectionId: "exc_aaa",
  exchange: "kraken",
  field: "apiSecret",
})

check("a record's own context round-trips", () => {
  assert.equal(open(seal(SECRET, aliceSecret), aliceSecret), SECRET)
})

check("the same record's other field cannot open it", () => {
  const sealed = seal(SECRET, aliceSecret)
  const otherField = credentialContext({
    userId: "did:privy:alice",
    connectionId: "exc_aaa",
    exchange: "kraken",
    field: "apiKey",
  })
  assert.throws(() => open(sealed, otherField), SealedDataError)
})

check("another user's identical record cannot open it", () => {
  const sealed = seal(SECRET, aliceSecret)
  const bob = credentialContext({
    userId: "did:privy:bob",
    connectionId: "exc_aaa",
    exchange: "kraken",
    field: "apiSecret",
  })
  assert.throws(() => open(sealed, bob), SealedDataError)
})

check("a different exchange on the same record cannot open it", () => {
  const sealed = seal(SECRET, aliceSecret)
  const otherExchange = credentialContext({
    userId: "did:privy:alice",
    connectionId: "exc_aaa",
    exchange: "binance",
    field: "apiSecret",
  })
  assert.throws(() => open(sealed, otherExchange), SealedDataError)
})

check("the context carries no secret material", () => {
  assert.ok(!aliceSecret.includes(SECRET))
})

console.log("\n" + "=".repeat(60))
console.log(`✅ Passed: ${passed}`)
console.log(`❌ Failed: ${failed}`)
console.log("=".repeat(60))
process.exit(failed > 0 ? 1 : 0)
