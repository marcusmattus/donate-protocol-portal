/**
 * TradingView alert webhook security.
 *
 * The webhook is the one place where an outside party can push something that
 * moves money, so it is treated as hostile input end to end: constant-time
 * token comparison, optional HMAC signature, timestamp window, and replay
 * suppression by payload digest.
 *
 * The alert never reaches an exchange. Verified alerts become normalized
 * signals and go through the Risk Engine like any other source.
 */

import crypto from "crypto"

export type VerificationFailure =
  | "missing_token"
  | "unknown_token"
  | "bad_signature"
  | "stale_timestamp"
  | "future_timestamp"
  | "replay"
  | "payload_too_large"

export interface VerificationResult {
  ok: boolean
  failure?: VerificationFailure
  message?: string
  /** Digest of the payload; the replay key and a stable id for the audit trail. */
  digest: string
}

const MAX_BODY_BYTES = 64 * 1024
const DEFAULT_SKEW_MS = 5 * 60_000
const REPLAY_WINDOW_MS = 15 * 60_000

/** Digest → first-seen timestamp. */
const seen = new Map<string, number>()

function sweepReplayCache(now: number): void {
  if (seen.size < 5_000) return
  for (const [k, ts] of seen) if (now - ts > REPLAY_WINDOW_MS) seen.delete(k)
}

/** Constant-time compare that does not leak length through early return. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8")
  const bb = Buffer.from(b, "utf8")
  // timingSafeEqual requires equal lengths, so compare digests of both.
  const ah = crypto.createHash("sha256").update(ab).digest()
  const bh = crypto.createHash("sha256").update(bb).digest()
  return crypto.timingSafeEqual(ah, bh)
}

export function payloadDigest(rawBody: string): string {
  return crypto.createHash("sha256").update(rawBody).digest("hex")
}

/**
 * Verify an inbound alert.
 *
 * `validTokens` are the per-user webhook tokens. `signingSecret` enables the
 * optional HMAC check — TradingView's own alert webhooks cannot sign requests
 * on every plan, so signature verification is enforced only when a secret is
 * configured, while the token check is always enforced.
 */
export function verifyWebhook(input: {
  token: string | null
  rawBody: string
  signatureHeader?: string | null
  timestampHeader?: string | null
  validTokens: Set<string>
  signingSecret?: string
  maxSkewMs?: number
  now?: number
}): VerificationResult {
  const now = input.now ?? Date.now()
  const digest = payloadDigest(input.rawBody)

  if (Buffer.byteLength(input.rawBody, "utf8") > MAX_BODY_BYTES) {
    return { ok: false, failure: "payload_too_large", message: "alert payload exceeds 64KB", digest }
  }

  if (!input.token) {
    return { ok: false, failure: "missing_token", message: "no webhook token supplied", digest }
  }

  // Compare against every configured token so timing does not reveal which
  // prefix matched; `matched` is set without short-circuiting the loop.
  let matched = false
  for (const t of input.validTokens) {
    if (safeEqual(input.token, t)) matched = true
  }
  if (!matched) {
    return { ok: false, failure: "unknown_token", message: "webhook token not recognized", digest }
  }

  if (input.signingSecret) {
    if (!input.signatureHeader) {
      return { ok: false, failure: "bad_signature", message: "signature required but absent", digest }
    }
    const expected = crypto
      .createHmac("sha256", input.signingSecret)
      .update(`${input.timestampHeader ?? ""}.${input.rawBody}`)
      .digest("hex")
    const provided = input.signatureHeader.replace(/^sha256=/, "")
    if (!safeEqual(provided, expected)) {
      return { ok: false, failure: "bad_signature", message: "signature mismatch", digest }
    }
  }

  if (input.timestampHeader) {
    const tsRaw = Number(input.timestampHeader)
    if (Number.isFinite(tsRaw)) {
      const ts = tsRaw > 1e12 ? tsRaw : tsRaw * 1000
      const skew = input.maxSkewMs ?? DEFAULT_SKEW_MS
      if (now - ts > skew) {
        return { ok: false, failure: "stale_timestamp", message: "alert timestamp is too old", digest }
      }
      if (ts - now > skew) {
        return { ok: false, failure: "future_timestamp", message: "alert timestamp is in the future", digest }
      }
    }
  }

  sweepReplayCache(now)
  const firstSeen = seen.get(digest)
  if (firstSeen !== undefined && now - firstSeen < REPLAY_WINDOW_MS) {
    return { ok: false, failure: "replay", message: "duplicate alert payload within the replay window", digest }
  }
  seen.set(digest, now)

  return { ok: true, digest }
}

/** Test seam. */
export function resetReplayCache(): void {
  seen.clear()
}
