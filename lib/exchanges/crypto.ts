/**
 * Sealing for exchange API credentials.
 *
 * Deliberately not `lib/wallet-encryption.ts`. That module falls back to a key
 * committed in this repo ("donate-protocol-secure-key-2026"), so anyone with a
 * checkout can decrypt anything it produced, and it derives the AES key by
 * `key.padEnd(32, "0")` — padding is not a KDF, so a short key stays short on
 * entropy. Neither is acceptable for a live exchange API secret.
 *
 * What this does instead:
 *
 *   - **No fallback key.** With EXCHANGE_ENCRYPTION_KEY unset or under 32
 *     characters, sealing is unavailable and callers must refuse to store
 *     anything. A key that ships in the repo is not a key.
 *   - **HKDF-SHA256 per record**, with 16 random salt bytes kept beside the
 *     ciphertext, so two records never share a derived key — even for the same
 *     plaintext under the same master key.
 *   - **AES-256-GCM** with a 12-byte random IV (the size GCM is specified for)
 *     and the auth tag retained, so tampering fails loudly instead of
 *     decrypting to garbage.
 *   - **Context binding.** The caller's context string — user, exchange, record
 *     id, field — goes into both the HKDF `info` and the GCM AAD. A ciphertext
 *     lifted from one user's record cannot be opened as another user's, or as a
 *     different field of the same record, even by someone holding the master key.
 *
 * Plaintext secrets exist only inside a request. Nothing here logs them, and
 * `open` is never reachable over HTTP.
 */

import crypto from "node:crypto"

const VERSION = "v1"
const SALT_BYTES = 16
const IV_BYTES = 12
const KEY_BYTES = 32
const MIN_MASTER_KEY_CHARS = 32

export class SealingUnavailableError extends Error {
  constructor() {
    super("EXCHANGE_ENCRYPTION_KEY is not configured (needs at least 32 characters)")
    this.name = "SealingUnavailableError"
  }
}

export class SealedDataError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SealedDataError"
  }
}

function masterKey(): Buffer | null {
  const raw = process.env.EXCHANGE_ENCRYPTION_KEY
  if (!raw || raw.length < MIN_MASTER_KEY_CHARS) return null
  return Buffer.from(raw, "utf8")
}

export function isSealingConfigured(): boolean {
  return masterKey() !== null
}

function deriveKey(master: Buffer, salt: Buffer, context: string): Buffer {
  return Buffer.from(
    crypto.hkdfSync("sha256", master, salt, Buffer.from(context, "utf8"), KEY_BYTES)
  )
}

const b64 = (b: Buffer) => b.toString("base64url")
const unb64 = (s: string) => Buffer.from(s, "base64url")

/**
 * Seal a secret. `context` must be reproduced exactly to open it again.
 *
 * Returns `v1.<salt>.<iv>.<tag>.<ciphertext>`, all base64url — self-describing,
 * so a later version can change scheme without guessing at old records.
 */
export function seal(plaintext: string, context: string): string {
  const master = masterKey()
  if (!master) throw new SealingUnavailableError()
  if (typeof plaintext !== "string" || plaintext.length === 0) {
    throw new SealedDataError("nothing to seal")
  }

  const salt = crypto.randomBytes(SALT_BYTES)
  const iv = crypto.randomBytes(IV_BYTES)
  const key = deriveKey(master, salt, context)

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
  cipher.setAAD(Buffer.from(context, "utf8"))
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()

  return [VERSION, b64(salt), b64(iv), b64(tag), b64(ciphertext)].join(".")
}

/** Open a sealed secret. Throws if the context differs or the bytes were altered. */
export function open(sealed: string, context: string): string {
  const master = masterKey()
  if (!master) throw new SealingUnavailableError()

  const parts = String(sealed).split(".")
  if (parts.length !== 5 || parts[0] !== VERSION) {
    throw new SealedDataError("unrecognized sealed format")
  }
  const [, saltB64, ivB64, tagB64, ctB64] = parts

  try {
    const key = deriveKey(master, unb64(saltB64), context)
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, unb64(ivB64))
    decipher.setAAD(Buffer.from(context, "utf8"))
    decipher.setAuthTag(unb64(tagB64))
    return Buffer.concat([decipher.update(unb64(ctB64)), decipher.final()]).toString("utf8")
  } catch {
    // A wrong context and a tampered ciphertext get the same answer: not
    // openable. Which of the two it was is deliberately not reported.
    throw new SealedDataError("could not open sealed data")
  }
}

/**
 * Stable, non-reversing identifier for an API key, so a connection can be
 * recognised in the UI and in an audit trail without storing the key in clear.
 * Keyed with the master key, so these digests are not a lookup table against
 * known exchange keys.
 */
export function keyFingerprint(apiKey: string): string {
  const master = masterKey()
  if (!master) throw new SealingUnavailableError()
  return crypto.createHmac("sha256", master).update(apiKey, "utf8").digest("hex").slice(0, 16)
}

/**
 * The context string bound into one field of one credential record.
 *
 * Defined here rather than in the store so that sealing and opening cannot drift
 * apart: both sides call this, so there is no second copy of the format to get
 * subtly wrong. Changing the shape invalidates existing records by design —
 * they cannot be opened under a different context, which is exactly the property
 * that stops a ciphertext being replayed as another user's or another field's.
 */
export function credentialContext(parts: {
  userId: string
  connectionId: string
  exchange: string
  field: "apiKey" | "apiSecret" | "passphrase"
}): string {
  return `dp:exchange:v1|user=${parts.userId}|conn=${parts.connectionId}|ex=${parts.exchange}|field=${parts.field}`
}

/** Last four characters, for recognition only. Never more than four. */
export function keyHint(apiKey: string): string {
  return apiKey.length <= 4 ? "…" : `…${apiKey.slice(-4)}`
}
