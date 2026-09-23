/**
 * TradingView MCP — OAuth 2.1 authorization lifecycle.
 *
 * Donate Protocol never sees a TradingView password. The only credential path
 * is the authorization-code flow with PKCE (RFC 7636), which is mandatory under
 * OAuth 2.1 for public clients. The user authorizes on TradingView's own
 * domain; we receive a code and exchange it for tokens.
 *
 * Nothing here logs or returns a token, a code, a code_verifier or a client
 * secret. `describeTokens()` is the only outward-facing view of token state and
 * it deliberately exposes metadata only.
 */

import crypto from "crypto"
import { encryptData, decryptData } from "@/lib/wallet-encryption"

/** Official TradingView MCP endpoint; override per environment. */
export const TRADINGVIEW_MCP_URL =
  process.env.TRADINGVIEW_MCP_URL || "https://mcp.tradingview.com/mcp"

const CLIENT_ID = process.env.TRADINGVIEW_OAUTH_CLIENT_ID || ""
const CLIENT_SECRET = process.env.TRADINGVIEW_OAUTH_CLIENT_SECRET || ""
const REDIRECT_URI =
  process.env.TRADINGVIEW_OAUTH_REDIRECT_URI ||
  `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/tradingview/oauth/callback`

/** Refresh this many ms before actual expiry, so a call never races the clock. */
const REFRESH_SKEW_MS = 60_000

export interface AuthServerMetadata {
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
  revocation_endpoint?: string
  registration_endpoint?: string
  scopes_supported?: string[]
  code_challenge_methods_supported?: string[]
}

export interface TokenSet {
  /** Encrypted at rest. Never returned to a caller outside this module. */
  encryptedAccessToken: string
  encryptedRefreshToken?: string
  /** Epoch ms. */
  expiresAt: number
  scopes: string[]
  tokenType: string
  obtainedAt: number
}

export interface PendingAuthorization {
  state: string
  /** Encrypted at rest — a leaked verifier defeats PKCE. */
  encryptedCodeVerifier: string
  userId: string
  createdAt: number
  redirectUri: string
}

export class TradingViewOAuthError extends Error {
  constructor(
    message: string,
    readonly code:
      | "not_configured"
      | "discovery_failed"
      | "state_mismatch"
      | "state_expired"
      | "exchange_failed"
      | "refresh_failed"
      | "no_refresh_token"
      | "revoke_failed"
  ) {
    super(message)
    this.name = "TradingViewOAuthError"
  }
}

export function isOAuthConfigured(): boolean {
  return CLIENT_ID.length > 0
}

// ── PKCE ────────────────────────────────────────────────────────────────────

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export function createPkcePair(): { verifier: string; challenge: string } {
  const verifier = base64url(crypto.randomBytes(32))
  const challenge = base64url(crypto.createHash("sha256").update(verifier).digest())
  return { verifier, challenge }
}

// ── Authorization server discovery (RFC 8414) ───────────────────────────────

let metadataCache: { value: AuthServerMetadata; fetchedAt: number } | null = null
const METADATA_TTL_MS = 3_600_000

/**
 * Discover the authorization server for the MCP resource.
 *
 * Tries RFC 9728 protected-resource metadata first (which is how an MCP server
 * advertises its auth server), then RFC 8414 on the resource origin. Falls back
 * to explicitly configured endpoints so a deployment can pin them.
 */
export async function discoverAuthServer(
  fetchImpl: typeof fetch = fetch
): Promise<AuthServerMetadata> {
  if (metadataCache && Date.now() - metadataCache.fetchedAt < METADATA_TTL_MS) {
    return metadataCache.value
  }

  const origin = new URL(TRADINGVIEW_MCP_URL).origin
  const candidates = [
    `${origin}/.well-known/oauth-protected-resource`,
    `${origin}/.well-known/oauth-authorization-server`,
    `${origin}/.well-known/openid-configuration`,
  ]

  for (const url of candidates) {
    try {
      const res = await fetchImpl(url, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(8_000),
      })
      if (!res.ok) continue
      const doc = (await res.json()) as Record<string, unknown>

      // RFC 9728 points at a separate authorization server.
      const authServers = doc.authorization_servers
      if (Array.isArray(authServers) && authServers.length > 0) {
        const asUrl = `${String(authServers[0]).replace(/\/$/, "")}/.well-known/oauth-authorization-server`
        const asRes = await fetchImpl(asUrl, {
          headers: { accept: "application/json" },
          signal: AbortSignal.timeout(8_000),
        })
        if (asRes.ok) {
          const md = (await asRes.json()) as AuthServerMetadata
          if (md.authorization_endpoint && md.token_endpoint) {
            metadataCache = { value: md, fetchedAt: Date.now() }
            return md
          }
        }
        continue
      }

      const md = doc as unknown as AuthServerMetadata
      if (md.authorization_endpoint && md.token_endpoint) {
        metadataCache = { value: md, fetchedAt: Date.now() }
        return md
      }
    } catch {
      // Try the next candidate.
    }
  }

  // Pinned fallback, for deployments that would rather not rely on discovery.
  const pinnedAuth = process.env.TRADINGVIEW_OAUTH_AUTHORIZE_URL
  const pinnedToken = process.env.TRADINGVIEW_OAUTH_TOKEN_URL
  if (pinnedAuth && pinnedToken) {
    const md: AuthServerMetadata = {
      issuer: origin,
      authorization_endpoint: pinnedAuth,
      token_endpoint: pinnedToken,
      revocation_endpoint: process.env.TRADINGVIEW_OAUTH_REVOKE_URL,
    }
    metadataCache = { value: md, fetchedAt: Date.now() }
    return md
  }

  throw new TradingViewOAuthError(
    "could not discover the TradingView authorization server; set TRADINGVIEW_OAUTH_AUTHORIZE_URL and TRADINGVIEW_OAUTH_TOKEN_URL to pin it",
    "discovery_failed"
  )
}

/** Test seam — clears the discovery cache. */
export function resetDiscoveryCache(): void {
  metadataCache = null
}

// ── Authorization request ───────────────────────────────────────────────────

const STATE_TTL_MS = 10 * 60_000

export async function beginAuthorization(
  userId: string,
  scopes: string[] = [],
  fetchImpl: typeof fetch = fetch
): Promise<{ authorizationUrl: string; pending: PendingAuthorization }> {
  if (!isOAuthConfigured()) {
    throw new TradingViewOAuthError(
      "TRADINGVIEW_OAUTH_CLIENT_ID is not set",
      "not_configured"
    )
  }

  const md = await discoverAuthServer(fetchImpl)
  const { verifier, challenge } = createPkcePair()
  const state = base64url(crypto.randomBytes(24))

  const url = new URL(md.authorization_endpoint)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("client_id", CLIENT_ID)
  url.searchParams.set("redirect_uri", REDIRECT_URI)
  url.searchParams.set("state", state)
  url.searchParams.set("code_challenge", challenge)
  url.searchParams.set("code_challenge_method", "S256")
  if (scopes.length) url.searchParams.set("scope", scopes.join(" "))
  // RFC 8707 — bind the token to this resource.
  url.searchParams.set("resource", TRADINGVIEW_MCP_URL)

  return {
    authorizationUrl: url.toString(),
    pending: {
      state,
      encryptedCodeVerifier: encryptData(verifier),
      userId,
      createdAt: Date.now(),
      redirectUri: REDIRECT_URI,
    },
  }
}

// ── Code exchange and refresh ───────────────────────────────────────────────

interface RawTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  scope?: string
  token_type?: string
}

function toTokenSet(raw: RawTokenResponse, fallbackScopes: string[]): TokenSet {
  const now = Date.now()
  return {
    encryptedAccessToken: encryptData(raw.access_token),
    encryptedRefreshToken: raw.refresh_token ? encryptData(raw.refresh_token) : undefined,
    expiresAt: now + (raw.expires_in ?? 3600) * 1000,
    scopes: raw.scope ? raw.scope.split(/\s+/).filter(Boolean) : fallbackScopes,
    tokenType: raw.token_type ?? "Bearer",
    obtainedAt: now,
  }
}

async function postToken(
  tokenEndpoint: string,
  body: URLSearchParams,
  fetchImpl: typeof fetch
): Promise<RawTokenResponse> {
  if (CLIENT_SECRET) {
    body.set("client_secret", CLIENT_SECRET)
  }
  const res = await fetchImpl(tokenEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
    },
    body: body.toString(),
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) {
    // The response body can echo the code or assertion; keep it out of the error.
    throw new Error(`token endpoint returned ${res.status}`)
  }
  return (await res.json()) as RawTokenResponse
}

export async function completeAuthorization(
  pending: PendingAuthorization,
  params: { code: string; state: string },
  fetchImpl: typeof fetch = fetch
): Promise<TokenSet> {
  if (!pending || pending.state !== params.state) {
    throw new TradingViewOAuthError("OAuth state mismatch", "state_mismatch")
  }
  if (Date.now() - pending.createdAt > STATE_TTL_MS) {
    throw new TradingViewOAuthError("OAuth state expired", "state_expired")
  }

  const md = await discoverAuthServer(fetchImpl)
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: pending.redirectUri,
    client_id: CLIENT_ID,
    code_verifier: decryptData(pending.encryptedCodeVerifier),
    resource: TRADINGVIEW_MCP_URL,
  })

  try {
    return toTokenSet(await postToken(md.token_endpoint, body, fetchImpl), [])
  } catch (e) {
    throw new TradingViewOAuthError(
      `authorization code exchange failed: ${e instanceof Error ? e.message : "unknown"}`,
      "exchange_failed"
    )
  }
}

export async function refreshTokens(
  tokens: TokenSet,
  fetchImpl: typeof fetch = fetch
): Promise<TokenSet> {
  if (!tokens.encryptedRefreshToken) {
    throw new TradingViewOAuthError(
      "no refresh token; the user must reauthorize",
      "no_refresh_token"
    )
  }
  const md = await discoverAuthServer(fetchImpl)
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: decryptData(tokens.encryptedRefreshToken),
    client_id: CLIENT_ID,
    resource: TRADINGVIEW_MCP_URL,
  })

  try {
    const raw = await postToken(md.token_endpoint, body, fetchImpl)
    const next = toTokenSet(raw, tokens.scopes)
    // Some servers omit refresh_token on refresh; keep the existing one.
    if (!next.encryptedRefreshToken) {
      next.encryptedRefreshToken = tokens.encryptedRefreshToken
    }
    return next
  } catch (e) {
    throw new TradingViewOAuthError(
      `token refresh failed: ${e instanceof Error ? e.message : "unknown"}`,
      "refresh_failed"
    )
  }
}

export async function revokeTokens(
  tokens: TokenSet,
  fetchImpl: typeof fetch = fetch
): Promise<void> {
  const md = await discoverAuthServer(fetchImpl).catch(() => null)
  if (!md?.revocation_endpoint) return // Nothing to call; caller still drops local state.

  const body = new URLSearchParams({
    token: decryptData(tokens.encryptedRefreshToken ?? tokens.encryptedAccessToken),
    token_type_hint: tokens.encryptedRefreshToken ? "refresh_token" : "access_token",
    client_id: CLIENT_ID,
  })
  if (CLIENT_SECRET) body.set("client_secret", CLIENT_SECRET)

  const res = await fetchImpl(md.revocation_endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) {
    throw new TradingViewOAuthError(`revocation returned ${res.status}`, "revoke_failed")
  }
}

// ── Token state, without exposing the tokens ────────────────────────────────

export function isExpired(tokens: TokenSet, now = Date.now()): boolean {
  return now >= tokens.expiresAt - REFRESH_SKEW_MS
}

/**
 * The bearer value, for the MCP transport only.
 *
 * Keep the return value on the stack: do not log it, store it, put it in an
 * error message, or return it through an API route.
 */
export function bearerFor(tokens: TokenSet): string {
  return decryptData(tokens.encryptedAccessToken)
}

/** Safe-to-surface description of token state. Contains no secret material. */
export function describeTokens(tokens: TokenSet | null) {
  if (!tokens) return { present: false as const }
  return {
    present: true as const,
    tokenType: tokens.tokenType,
    scopes: tokens.scopes,
    obtainedAt: tokens.obtainedAt,
    expiresAt: tokens.expiresAt,
    expiresInSec: Math.max(0, Math.round((tokens.expiresAt - Date.now()) / 1000)),
    expired: isExpired(tokens),
    canRefresh: Boolean(tokens.encryptedRefreshToken),
  }
}
