/**
 * Server-side verification of a Privy access token.
 *
 * Privy issues the browser an ES256-signed JWT. This verifies it against
 * Privy's published JWKS, which is what makes a client-side login mean anything
 * on the server: before this existed, "authenticated" was a React state flag
 * and every API route still treated the caller as the demo user.
 *
 * Uses `jose` (already a dependency) rather than @privy-io/server-auth so there
 * is no new package and the check runs under the edge runtime. Nothing here
 * needs PRIVY_APP_SECRET — the app secret is for Privy's management API, not
 * for validating a token, and keeping it out means this module can be imported
 * anywhere on the server without widening what a leak would expose.
 */

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose"
import { PRIVY_APP_ID } from "@/lib/privy/config"

const PRIVY_ISSUER = "privy.io"

function jwksUrl(appId: string): URL {
  return new URL(`https://auth.privy.io/api/v1/apps/${appId}/jwks.json`)
}

/**
 * Cached per app id. createRemoteJWKSet does its own key caching and rotation,
 * so building it once avoids refetching the key set on every request.
 */
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

function getJwks(appId: string) {
  let jwks = jwksCache.get(appId)
  if (!jwks) {
    jwks = createRemoteJWKSet(jwksUrl(appId), {
      cooldownDuration: 30_000,
      timeoutDuration: 8_000,
    })
    jwksCache.set(appId, jwks)
  }
  return jwks
}

export interface PrivyIdentity {
  /** Privy DID, e.g. "did:privy:clxxxx". The stable user id. */
  userId: string
  /** Token issue and expiry, epoch seconds. */
  issuedAt: number | null
  expiresAt: number | null
  /** Privy session id, when present. */
  sessionId: string | null
}

export type VerifyFailure =
  | "not_configured"
  | "missing_token"
  | "invalid_token"
  | "expired_token"
  | "wrong_audience"
  | "jwks_unavailable"

export type VerifyResult =
  | { ok: true; identity: PrivyIdentity }
  | { ok: false; reason: VerifyFailure; message: string }

/**
 * Verify a Privy access token.
 *
 * Distinguishes "we could not reach Privy's JWKS" from "this token is invalid",
 * because the first is an outage the caller may want to surface differently and
 * the second is a rejection. Never treats an unreachable JWKS as a pass.
 */
export async function verifyPrivyToken(token: string | null | undefined): Promise<VerifyResult> {
  if (!PRIVY_APP_ID) {
    return {
      ok: false,
      reason: "not_configured",
      message: "NEXT_PUBLIC_PRIVY_APP_ID is not set, so no Privy token can be verified",
    }
  }
  if (!token) {
    return { ok: false, reason: "missing_token", message: "no Privy access token supplied" }
  }

  let payload: JWTPayload
  try {
    const verified = await jwtVerify(token, getJwks(PRIVY_APP_ID), {
      issuer: PRIVY_ISSUER,
      audience: PRIVY_APP_ID,
      algorithms: ["ES256"],
    })
    payload = verified.payload
  } catch (e) {
    const message = e instanceof Error ? e.message : "verification failed"
    // jose uses stable `code` values; map the ones worth distinguishing.
    const code = (e as { code?: string })?.code
    if (code === "ERR_JWT_EXPIRED") {
      return { ok: false, reason: "expired_token", message: "Privy access token has expired" }
    }
    if (code === "ERR_JWT_CLAIM_VALIDATION_FAILED" && /audience/i.test(message)) {
      return {
        ok: false,
        reason: "wrong_audience",
        message: "token was issued for a different Privy app",
      }
    }
    if (code === "ERR_JWKS_TIMEOUT" || code === "ERR_JWKS_NO_MATCHING_KEY" || /fetch|network/i.test(message)) {
      return {
        ok: false,
        reason: "jwks_unavailable",
        message: "could not reach Privy's key set to verify the token",
      }
    }
    return { ok: false, reason: "invalid_token", message: "Privy access token is not valid" }
  }

  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    return { ok: false, reason: "invalid_token", message: "token carries no subject" }
  }

  return {
    ok: true,
    identity: {
      userId: payload.sub,
      issuedAt: typeof payload.iat === "number" ? payload.iat : null,
      expiresAt: typeof payload.exp === "number" ? payload.exp : null,
      sessionId: typeof payload.sid === "string" ? payload.sid : null,
    },
  }
}

/** Test seam — drops the cached key set. */
export function resetJwksCache(): void {
  jwksCache.clear()
}
