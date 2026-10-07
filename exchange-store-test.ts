/**
 * The exchange connection store, run twice: once on the map, once on Postgres.
 *
 * There are two backends behind lib/exchanges/store.ts, and the one that
 * matters in production is the one that is hardest to run. The usual outcome of
 * that is a memory backend that quietly stops matching the table — a revoke
 * that forgets to blank a column, a list that orders differently, an ownership
 * filter missing from one query. So this file states the invariants once and
 * drives *both* implementations through them, and the run is only complete when
 * both have passed.
 *
 *   node --experimental-strip-types --import ./scripts/node-alias-hook.mjs exchange-store-test.ts
 *
 * The database half runs only when DATABASE_URL points at a database with the
 * migration applied:
 *
 *   DATABASE_URL=postgresql://… pnpm db:migrate && pnpm test:exchange-store
 *
 * Without it the suite still runs, says that it skipped the database, and exits
 * non-zero only on a real failure — so a contributor with no Postgres is not
 * blocked, while CI, which has one, gets the full battery.
 */

import assert from "node:assert"

// Before the store is imported: it reads both of these once, at module load.
process.env.EXCHANGE_ENCRYPTION_KEY = "store-unit-test-master-key-at-least-32-chars"
process.env.EXCHANGE_MAX_PER_USER = "3"
const MAX_PER_USER = 3

// Saved and cleared, so the memory half runs with no database however the
// process was invoked. The database half puts it back.
const DATABASE_URL = (process.env.DATABASE_URL ?? "").trim()
delete process.env.DATABASE_URL

const store = await import("@/lib/exchanges/store")
const db = await import("@/lib/exchanges/db")

let passed = 0
let failed = 0
let suite = ""

async function check(name: string, fn: () => Promise<void> | void) {
  try {
    await fn()
    console.log(`✅ [${suite}] ${name}`)
    passed++
  } catch (e) {
    console.log(`❌ [${suite}] ${name} — ${e instanceof Error ? e.message : String(e)}`)
    failed++
  }
}

const ALICE = "did:privy:alice"
const BOB = "did:privy:bob"

const CREDS = {
  apiKey: "alice-kraken-api-key-0001",
  apiSecret: Buffer.from("alice-kraken-api-secret").toString("base64"),
  passphrase: null as string | null,
}

function add(userId: string, overrides: Partial<typeof CREDS> & { exchange?: string } = {}) {
  return store.createConnection({
    userId,
    exchange: overrides.exchange ?? "kraken",
    apiKey: overrides.apiKey ?? CREDS.apiKey,
    apiSecret: overrides.apiSecret ?? CREDS.apiSecret,
    passphrase: overrides.passphrase ?? CREDS.passphrase,
  })
}

const VALIDATION = { status: "valid" as const, reason: "Kraken accepted the credential", checkedAt: 1_700_000_000_123 }

/** Every assertion that must hold on both backends. */
async function battery(expectedKind: "memory" | "database") {
  await check("the live backend is the one under test", async () => {
    assert.equal(await store.storageBackend(), expectedKind)
  })

  await check("a stored connection is listed for its owner and nobody else", async () => {
    await store.resetConnections()
    const record = await add(ALICE)
    const mine = await store.listConnections(ALICE)
    assert.equal(mine.length, 1)
    assert.equal(mine[0].id, record.id)
    assert.deepEqual(await store.listConnections(BOB), [])
  })

  await check("the stored record holds ciphertext, a fingerprint and a hint", async () => {
    await store.resetConnections()
    const record = await add(ALICE)
    assert.ok(record.sealedApiKey.startsWith("v1."), "api key is not a sealed envelope")
    assert.ok(record.sealedApiSecret.startsWith("v1."), "api secret is not a sealed envelope")
    assert.ok(!record.sealedApiKey.includes(CREDS.apiKey), "the plaintext key is in the envelope")
    assert.ok(record.fingerprint.length > 0)
    assert.equal(record.hint, `…${CREDS.apiKey.slice(-4)}`)
  })

  await check("the view that goes to a client has no field that could hold a secret", async () => {
    await store.resetConnections()
    const record = await add(ALICE)
    const view = store.describeConnection(record)
    const serialized = JSON.stringify(view)
    assert.ok(!serialized.includes(CREDS.apiKey), "the view leaked the api key")
    assert.ok(!serialized.includes(CREDS.apiSecret), "the view leaked the api secret")
    assert.ok(!serialized.includes("v1."), "the view leaked ciphertext")
    for (const key of Object.keys(view)) {
      assert.ok(!key.startsWith("sealed"), `the view has a ${key} field`)
    }
  })

  await check("createdAt survives storage as the same millisecond", async () => {
    await store.resetConnections()
    const record = await add(ALICE)
    const found = await store.findConnection(ALICE, record.id)
    assert.equal(found?.createdAt, record.createdAt)
  })

  await check("a connection is findable by its owner only", async () => {
    await store.resetConnections()
    const record = await add(ALICE)
    assert.ok(await store.findConnection(ALICE, record.id))
    assert.equal(await store.findConnection(BOB, record.id), null, "Bob reached Alice's connection")
    assert.equal(await store.findConnection(ALICE, "exc_does_not_exist"), null)
  })

  await check("opening round-trips the exact credentials", async () => {
    await store.resetConnections()
    const record = await add(ALICE, { passphrase: "a-passphrase", exchange: "okx" })
    const opened = await store.openConnection(ALICE, record.id)
    assert.equal(opened?.apiKey, CREDS.apiKey)
    assert.equal(opened?.apiSecret, CREDS.apiSecret)
    assert.equal(opened?.passphrase, "a-passphrase")
  })

  await check("a connection with no passphrase opens with null, not an empty string", async () => {
    await store.resetConnections()
    const record = await add(ALICE)
    const opened = await store.openConnection(ALICE, record.id)
    assert.equal(opened?.passphrase, null)
    const found = await store.findConnection(ALICE, record.id)
    assert.equal(found?.sealedPassphrase, null)
    assert.equal(store.describeConnection(found!).hasPassphrase, false)
  })

  await check("opening records when the credential was last used", async () => {
    await store.resetConnections()
    const record = await add(ALICE)
    assert.equal(record.lastUsedAt, null)
    await store.openConnection(ALICE, record.id)
    const found = await store.findConnection(ALICE, record.id)
    assert.ok(typeof found?.lastUsedAt === "number", "lastUsedAt was not set")
  })

  await check("another user cannot open a connection, or mark it used", async () => {
    await store.resetConnections()
    const record = await add(ALICE)
    assert.equal(await store.openConnection(BOB, record.id), null, "Bob opened Alice's credential")
    const found = await store.findConnection(ALICE, record.id)
    assert.equal(found?.lastUsedAt, null, "Bob's attempt touched Alice's record")
  })

  await check("revoking makes the connection unreachable through every accessor", async () => {
    await store.resetConnections()
    const record = await add(ALICE)
    assert.equal(await store.revokeConnection(ALICE, record.id), true)
    assert.deepEqual(await store.listConnections(ALICE), [])
    assert.equal(await store.findConnection(ALICE, record.id), null)
    assert.equal(await store.openConnection(ALICE, record.id), null)
    assert.equal(await store.recordValidation(ALICE, record.id, VALIDATION), false)
  })

  await check("revoking twice is false the second time", async () => {
    await store.resetConnections()
    const record = await add(ALICE)
    assert.equal(await store.revokeConnection(ALICE, record.id), true)
    assert.equal(await store.revokeConnection(ALICE, record.id), false)
  })

  await check("unknown and not-yours are the same answer to a revoke", async () => {
    await store.resetConnections()
    const record = await add(ALICE)
    assert.equal(await store.revokeConnection(BOB, record.id), false, "Bob revoked Alice's connection")
    assert.equal(await store.revokeConnection(BOB, "exc_does_not_exist"), false)
    // And Alice's connection is untouched by the attempt.
    assert.ok(await store.openConnection(ALICE, record.id))
  })

  await check("a validation outcome round-trips exactly", async () => {
    await store.resetConnections()
    const record = await add(ALICE)
    assert.equal(record.validation, null)
    assert.equal(await store.recordValidation(ALICE, record.id, VALIDATION), true)
    const found = await store.findConnection(ALICE, record.id)
    assert.deepEqual(found?.validation, VALIDATION)
    const listed = await store.listConnections(ALICE)
    assert.deepEqual(listed[0].validation, VALIDATION)
  })

  await check("another user cannot write a validation outcome", async () => {
    await store.resetConnections()
    const record = await add(ALICE)
    assert.equal(await store.recordValidation(BOB, record.id, VALIDATION), false)
    const found = await store.findConnection(ALICE, record.id)
    assert.equal(found?.validation, null, "Bob wrote onto Alice's record")
  })

  await check("the cooldown is zero until something is attempted, then positive", async () => {
    await store.resetConnections()
    const record = await add(ALICE)
    assert.equal(await store.validationCooldownRemaining(ALICE, record.id), 0)
    await store.recordValidation(ALICE, record.id, VALIDATION)
    const remaining = await store.validationCooldownRemaining(ALICE, record.id)
    assert.ok(remaining > 0, `expected a positive cooldown, got ${remaining}`)
  })

  await check("a refused attempt still starts the cooldown, and invents no outcome", async () => {
    await store.resetConnections()
    const record = await add(ALICE)
    await store.markValidationAttempt(ALICE, record.id)
    assert.ok((await store.validationCooldownRemaining(ALICE, record.id)) > 0)
    const found = await store.findConnection(ALICE, record.id)
    assert.equal(found?.validation, null, "an attempt fabricated a validation result")
  })

  await check("another user's attempt does not start the cooldown", async () => {
    await store.resetConnections()
    const record = await add(ALICE)
    await store.markValidationAttempt(BOB, record.id)
    assert.equal(await store.validationCooldownRemaining(ALICE, record.id), 0)
  })

  await check("the cooldown of an unknown connection is zero, not an error", async () => {
    await store.resetConnections()
    assert.equal(await store.validationCooldownRemaining(ALICE, "exc_does_not_exist"), 0)
  })

  await check(`at most ${MAX_PER_USER} active connections per user`, async () => {
    await store.resetConnections()
    for (let i = 0; i < MAX_PER_USER; i++) await add(ALICE, { apiKey: `alice-key-${i}-padded` })
    await assert.rejects(
      () => add(ALICE, { apiKey: "one-too-many-key" }),
      (e: unknown) => e instanceof Error && e.name === "ConnectionLimitError"
    )
    assert.equal((await store.listConnections(ALICE)).length, MAX_PER_USER)
  })

  await check("revoking frees a slot, and the cap is per user", async () => {
    await store.resetConnections()
    const first = await add(ALICE, { apiKey: "alice-key-0-padded" })
    for (let i = 1; i < MAX_PER_USER; i++) await add(ALICE, { apiKey: `alice-key-${i}-padded` })
    // Bob is unaffected by Alice being full.
    assert.ok(await add(BOB, { apiKey: "bob-key-0-padded" }))
    await store.revokeConnection(ALICE, first.id)
    assert.ok(await add(ALICE, { apiKey: "alice-replacement-key" }))
    assert.equal((await store.listConnections(ALICE)).length, MAX_PER_USER)
  })

  await check("the list is oldest first, with the id breaking a same-millisecond tie", async () => {
    await store.resetConnections()
    const created = await Promise.all([
      add(ALICE, { apiKey: "alice-key-a-padded" }),
      add(ALICE, { apiKey: "alice-key-b-padded" }),
      add(ALICE, { apiKey: "alice-key-c-padded" }),
    ])
    const expected = [...created]
      .sort((a, b) => a.createdAt - b.createdAt || (a.id < b.id ? -1 : 1))
      .map((c) => c.id)
    assert.deepEqual((await store.listConnections(ALICE)).map((c) => c.id), expected)
  })

  await check("what a caller is handed cannot be mutated into the store", async () => {
    await store.resetConnections()
    const record = await add(ALICE)
    const found = (await store.findConnection(ALICE, record.id))!
    found.label = "mutated"
    found.sealedApiKey = "tampered"
    const again = await store.findConnection(ALICE, record.id)
    assert.notEqual(again?.label, "mutated")
    assert.notEqual(again?.sealedApiKey, "tampered")
  })

  await check("resetting leaves no connection for any user", async () => {
    await add(ALICE, { apiKey: "alice-final-key-pad" })
    await add(BOB, { apiKey: "bob-final-key-padded" })
    await store.resetConnections()
    assert.deepEqual(await store.listConnections(ALICE), [])
    assert.deepEqual(await store.listConnections(BOB), [])
  })
}

// ─── memory ────────────────────────────────────────────────────────────────

suite = "memory"
console.log("— the in-process map, with no DATABASE_URL —")
await battery("memory")

// ─── database ──────────────────────────────────────────────────────────────

console.log("\n— the exchange_connections table —")

if (!DATABASE_URL) {
  console.log("⏭️  skipped: DATABASE_URL is not set, so the table half did not run")
} else {
  suite = "database"
  process.env.DATABASE_URL = DATABASE_URL
  db.resetConnectionTableCache()

  await battery("database")


  // Assertions that need to see the row itself, so they only make sense here.
  // They reach past the store's own interface deliberately, with their own
  // client: the store exposes only active rows, and the point of one of these
  // is to look at a revoked one.
  console.log("— and what the row actually holds —")

  const { PrismaClient } = await import("@prisma/client")
  const { PrismaPg } = await import("@prisma/adapter-pg")
  const raw = new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) })
  const rows = () => raw.exchangeConnection.findMany({ orderBy: { createdAt: "asc" } })

  await check("revoking empties the sealed columns rather than flagging them", async () => {
    await store.resetConnections()
    const record = await add(ALICE, { passphrase: "a-passphrase", exchange: "okx" })
    await store.revokeConnection(ALICE, record.id)
    const all = await rows()
    assert.equal(all.length, 1, "the revoked row was deleted rather than kept")
    const [row] = all
    assert.ok(row.revokedAt instanceof Date, "revokedAt was not stamped")
    assert.equal(row.sealedApiKey, "", "the sealed api key survived revocation")
    assert.equal(row.sealedApiSecret, "", "the sealed api secret survived revocation")
    assert.equal(row.sealedPassphrase, null, "the sealed passphrase survived revocation")
  })

  await check("nothing in the table is a plaintext credential", async () => {
    await store.resetConnections()
    await add(ALICE, { passphrase: "a-passphrase", exchange: "okx" })
    const dump = JSON.stringify(await rows())
    assert.ok(!dump.includes(CREDS.apiKey), "the api key is in the table in clear")
    assert.ok(!dump.includes(CREDS.apiSecret), "the api secret is in the table in clear")
    assert.ok(!dump.includes("a-passphrase"), "the passphrase is in the table in clear")
  })

  await check("a validation status the code does not know reads as unchecked", async () => {
    await store.resetConnections()
    const record = await add(ALICE)
    await raw.exchangeConnection.update({
      where: { id: record.id },
      data: {
        validationStatus: "definitely-fine",
        validationReason: "trust me",
        validationCheckedAt: new Date(),
      },
    })
    const found = await store.findConnection(ALICE, record.id)
    assert.equal(found?.validation, null, "an unknown status reached the caller")
  })

  await check("a half-written validation reads as unchecked, not as a partial result", async () => {
    await store.resetConnections()
    const record = await add(ALICE)
    await raw.exchangeConnection.update({
      where: { id: record.id },
      data: { validationStatus: "valid", validationReason: null, validationCheckedAt: null },
    })
    const found = await store.findConnection(ALICE, record.id)
    assert.equal(found?.validation, null)
  })

  await check("the timestamps keep millisecond precision through timestamptz", async () => {
    await store.resetConnections()
    const record = await add(ALICE)
    await store.recordValidation(ALICE, record.id, VALIDATION)
    const [row] = await rows()
    assert.equal(row.createdAt.getTime(), record.createdAt, "createdAt lost precision")
    assert.equal(row.validationCheckedAt?.getTime(), VALIDATION.checkedAt)
  })

  await store.resetConnections()
  await raw.$disconnect()
}

console.log("\n" + "=".repeat(60))
console.log(`✅ Passed: ${passed}`)
console.log(`❌ Failed: ${failed}`)
if (!DATABASE_URL) console.log("⏭️  Database half skipped (set DATABASE_URL to run it)")
console.log("=".repeat(60))
process.exit(failed > 0 ? 1 : 0)
