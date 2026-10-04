/**
 * Does this exchange credential actually work?
 *
 * Each adapter signs a request to a **read-only balance endpoint** and reports
 * what the exchange said. Reading a balance proves the key authenticates without
 * proving anything about trading, which is the point: this validates a
 * credential, it does not exercise a permission we do not want to use.
 *
 * ## Why only three exchanges
 *
 * Every exchange signs differently, and a signing bug is worse than no
 * validation at all: a correct key would come back "rejected" and the user would
 * delete a working credential. So an adapter ships only where its scheme was
 * verified against the live API, by a test that distinguishes the two failures.
 *
 * These APIs answer differently for an unknown key than for a bad signature, so
 * sending a well-formed request with a key the exchange has never seen is a real
 * proof of correct signing. All three returned the *key* error, not the
 * *signature* error:
 *
 *   Kraken  HTTP 200  {"error":["EAPI:Invalid key"]}          (not Invalid signature)
 *   OKX     HTTP 401  {"code":"50111","msg":"Invalid OK-ACCESS-KEY"}  (not 50113)
 *   KuCoin  HTTP 401  {"code":"400003","msg":"The API key does not exist…"} (not 400005)
 *
 * Binance and Bybit are absent because that proof was unavailable: from this
 * environment Binance answers 451 ("restricted location") and Bybit 403
 * (CloudFront country block), so their signing could not be confirmed the same
 * way. They report `unsupported` rather than a guess. Coinbase is absent for a
 * different reason: it has two incompatible key generations (legacy HMAC and CDP
 * ES256 JWT) and nothing in a key tells us which one the user holds, so a single
 * adapter would reject half of them.
 *
 * ## Never claim valid
 *
 * Anything unexpected classifies as `unreachable`, never `valid`. A validator
 * that fails open is worse than none, because it launders an unchecked
 * credential as a checked one.
 *
 * ## No SSRF surface
 *
 * Hosts are compile-time constants. No part of a request's destination comes
 * from user input — the exchange id only selects from this table.
 */

import crypto from "node:crypto"

export type ValidationStatus = "valid" | "rejected" | "unreachable" | "unsupported"

export interface ValidationResult {
  status: ValidationStatus
  /** Short, fixed phrase. Never the exchange's raw body, which can echo the key. */
  reason: string
  checkedAt: number
}

export interface Credentials {
  apiKey: string
  apiSecret: string
  passphrase: string | null
}

export interface ProbeOptions {
  /** Injected in tests so classification is checked without a network. */
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 8000

/** Turn the kill switch off for deployments that permit no outbound traffic. */
export function isValidationEnabled(): boolean {
  return (process.env.EXCHANGE_VALIDATION ?? "on").toLowerCase() !== "off"
}

function result(status: ValidationStatus, reason: string): ValidationResult {
  return { status, reason, checkedAt: Date.now() }
}

/**
 * One probe. Returns the raw response text and status, or null when the request
 * could not be completed at all — a timeout, DNS failure, or refused connection.
 */
async function send(
  url: string,
  init: RequestInit,
  opts: ProbeOptions
): Promise<{ status: number; text: string } | null> {
  const doFetch = opts.fetchImpl ?? fetch
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  try {
    const res = await doFetch(url, { ...init, signal: controller.signal, redirect: "manual" })
    return { status: res.status, text: (await res.text()).slice(0, 2000) }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Decode base64, strictly.
 *
 * `Buffer.from(s, "base64")` does not throw on invalid input — Node silently
 * drops characters outside the alphabet, so `Buffer.from("!!!", "base64")`
 * returns an empty buffer rather than failing. A try/catch around it is
 * therefore dead code. This checks the alphabet, the length, and that the value
 * round-trips, so a mistyped secret is caught before a signature is computed
 * from whatever survived.
 */
function decodeBase64Strict(value: string): Buffer | null {
  const cleaned = value.trim()
  if (cleaned.length === 0 || cleaned.length % 4 !== 0) return null
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(cleaned)) return null
  const buf = Buffer.from(cleaned, "base64")
  if (buf.length === 0 || buf.toString("base64") !== cleaned) return null
  return buf
}

/** A body that means "we blocked you", not "your key is wrong". */
function looksGeoBlocked(status: number, text: string): boolean {
  if (status === 451 || status === 403) return true
  return /restricted location|not available in your|cloudfront|blocked|forbidden/i.test(text)
}

// ─── Kraken ────────────────────────────────────────────────────────────
// POST /0/private/Balance. Signature is
// HMAC-SHA512(base64-decoded secret, path + SHA256(nonce + body)), base64.
// Note Kraken answers HTTP 200 even for auth failures, with the problem in
// `error[]` — so the status code alone decides nothing here.
async function probeKraken(c: Credentials, opts: ProbeOptions): Promise<ValidationResult> {
  const path = "/0/private/Balance"
  const nonce = String(Date.now() * 1000)
  const body = new URLSearchParams({ nonce }).toString()

  // Kraken secrets are base64; one that will not decode cannot be theirs, and
  // checking here avoids sending a signature derived from garbage.
  const secretBytes = decodeBase64Strict(c.apiSecret)
  if (!secretBytes) {
    return result("rejected", "the secret is not valid base64, which Kraken requires")
  }

  const hash = crypto.createHash("sha256").update(nonce + body).digest()
  const mac = crypto.createHmac("sha512", secretBytes)
  mac.update(path)
  mac.update(hash)
  const sign = mac.digest("base64")

  const res = await send(
    "https://api.kraken.com" + path,
    {
      method: "POST",
      headers: {
        "API-Key": c.apiKey,
        "API-Sign": sign,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
    opts
  )
  if (!res) return result("unreachable", "Kraken did not respond in time")
  if (looksGeoBlocked(res.status, res.text)) return result("unreachable", "Kraken blocked this request")

  if (/EAPI:Invalid key|EAPI:Invalid signature|EAPI:Invalid nonce|EGeneral:Permission denied/i.test(res.text)) {
    return result("rejected", "Kraken rejected the credential")
  }
  if (/"error"\s*:\s*\[\s*\]/.test(res.text) && /"result"/.test(res.text)) {
    return result("valid", "Kraken accepted the credential")
  }
  return result("unreachable", `Kraken returned an unrecognized response (HTTP ${res.status})`)
}

// ─── OKX ───────────────────────────────────────────────────────────────
// GET /api/v5/account/balance. Sign is
// base64(HMAC-SHA256(secret, timestamp + "GET" + path)), plus the passphrase
// in clear in its own header.
async function probeOkx(c: Credentials, opts: ProbeOptions): Promise<ValidationResult> {
  if (!c.passphrase) return result("rejected", "OKX requires a passphrase")
  const path = "/api/v5/account/balance"
  const ts = new Date().toISOString()
  const sign = crypto.createHmac("sha256", c.apiSecret).update(ts + "GET" + path).digest("base64")

  const res = await send(
    "https://www.okx.com" + path,
    {
      headers: {
        "OK-ACCESS-KEY": c.apiKey,
        "OK-ACCESS-SIGN": sign,
        "OK-ACCESS-TIMESTAMP": ts,
        "OK-ACCESS-PASSPHRASE": c.passphrase,
        "Content-Type": "application/json",
      },
    },
    opts
  )
  if (!res) return result("unreachable", "OKX did not respond in time")
  if (looksGeoBlocked(res.status, res.text)) return result("unreachable", "OKX blocked this request")

  // 501xx is OKX's authentication family: bad key, bad sign, bad passphrase,
  // stale timestamp, missing permission.
  if (/"code"\s*:\s*"501\d\d"/.test(res.text)) {
    return result("rejected", "OKX rejected the credential")
  }
  if (/"code"\s*:\s*"0"/.test(res.text)) {
    return result("valid", "OKX accepted the credential")
  }
  return result("unreachable", `OKX returned an unrecognized response (HTTP ${res.status})`)
}

// ─── KuCoin ────────────────────────────────────────────────────────────
// GET /api/v1/accounts. Sign is base64(HMAC-SHA256(secret, ts + "GET" + path)),
// and for key version 2 the passphrase is itself HMAC'd with the secret.
async function probeKucoin(c: Credentials, opts: ProbeOptions): Promise<ValidationResult> {
  if (!c.passphrase) return result("rejected", "KuCoin requires a passphrase")
  const path = "/api/v1/accounts"
  const ts = String(Date.now())
  const sign = crypto.createHmac("sha256", c.apiSecret).update(ts + "GET" + path).digest("base64")
  const passphrase = crypto.createHmac("sha256", c.apiSecret).update(c.passphrase).digest("base64")

  const res = await send(
    "https://api.kucoin.com" + path,
    {
      headers: {
        "KC-API-KEY": c.apiKey,
        "KC-API-SIGN": sign,
        "KC-API-TIMESTAMP": ts,
        "KC-API-PASSPHRASE": passphrase,
        "KC-API-KEY-VERSION": "2",
        "Content-Type": "application/json",
      },
    },
    opts
  )
  if (!res) return result("unreachable", "KuCoin did not respond in time")
  if (looksGeoBlocked(res.status, res.text)) return result("unreachable", "KuCoin blocked this request")

  // 4000xx is KuCoin's authentication family.
  if (/"code"\s*:\s*"400\d\d\d"/.test(res.text)) {
    return result("rejected", "KuCoin rejected the credential")
  }
  if (/"code"\s*:\s*"200000"/.test(res.text)) {
    return result("valid", "KuCoin accepted the credential")
  }
  return result("unreachable", `KuCoin returned an unrecognized response (HTTP ${res.status})`)
}

type Prober = (c: Credentials, opts: ProbeOptions) => Promise<ValidationResult>

/** Only exchanges whose signing was verified against the live API. */
const PROBERS: Record<string, Prober> = {
  kraken: probeKraken,
  okx: probeOkx,
  kucoin: probeKucoin,
}

export function supportsValidation(exchange: string): boolean {
  return Object.prototype.hasOwnProperty.call(PROBERS, exchange.toLowerCase())
}

export async function validateCredentials(
  exchange: string,
  credentials: Credentials,
  opts: ProbeOptions = {}
): Promise<ValidationResult> {
  if (!isValidationEnabled()) {
    return result("unsupported", "credential validation is switched off on this server")
  }
  const probe = PROBERS[exchange.toLowerCase()]
  if (!probe) {
    return result("unsupported", "validation is not available for this exchange yet")
  }
  try {
    return await probe(credentials, opts)
  } catch {
    // An adapter throwing is our bug, not a bad credential. Never "rejected".
    return result("unreachable", "the validation attempt failed")
  }
}
