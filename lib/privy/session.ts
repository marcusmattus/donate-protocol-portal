/**
 * Donate Protocol session cookie.
 *
 * Once a Privy access token has been verified against Privy's JWKS, we mint our
 * own short-lived httpOnly cookie carrying the Privy DID. API routes then read
 * the cookie instead of re-verifying against a remote key set on every request —
 * a network round trip in the path of a risk decision is not something to add
 * lightly, and a TradingView alert should not fail because Privy is briefly
 * unreachable.
 *
 * The cookie is a signed JWT, not an encrypted blob, and carries only the DID
 * and the issuing token's expiry. It is a claim about identity, never an
 * authorization: what a user may do is still decided by the risk engine and the
 * user's own policy.
 */

import { SignJWT, jwtVerify } from "jose"
import type { NextRequest } from "next/server"
import type { PrivyIdentity } from "@/lib/privy/verify"

export const SESSION_COOKIE = "dp_session"

/** Session lifetime. Kept short; the client re-exchanges from Privy silently. */
const SESSION_TTL_SECONDS = 60 * 60 * 2

const ISSUER = "donate-protocol"
const AUDIENCE = "donate-protocol-session"

function sessionSecret(): Uint8Array | null {
  const raw = process.env.SESSION_SECRET || process.env.JWT_SECRET
  // No dev fallback: a signing key that ships in the repo is not a signing key,
  // and a session cookie anyone can forge is worse than no session at all.
  if (!raw || raw.length < 16) return null
  return new TextEncoder().encode(raw)
}

export function isSessionConfigured(): boolean {
  return sessionSecret() !== null
}

export interface SessionClaims {
  /** Privy DID. */
  userId: string
  /** Expiry of the Privy token this session was minted from, epoch seconds. */
  privyTokenExpiresAt: number | null
  issuedAt: number
  expiresAt: number
}

export async function mintSession(identity: PrivyIdentity): Promise<{ token: string; maxAge: number } | null> {
  const secret = sessionSecret()
  if (!secret) return null

  const now = Math.floor(Date.now() / 1000)
  const token = await new SignJWT({
    userId: identity.userId,
    privyTokenExpiresAt: identity.expiresAt,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(identity.userId)
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_TTL_SECONDS)
    .sign(secret)

  return { token, maxAge: SESSION_TTL_SECONDS }
}

export async function readSession(token: string | null | undefined): Promise<SessionClaims | null> {
  const secret = sessionSecret()
  if (!secret || !token) return null

  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
    })
    if (typeof payload.userId !== "string" || !payload.userId) return null
    return {
      userId: payload.userId,
      privyTokenExpiresAt:
        typeof payload.privyTokenExpiresAt === "number" ? payload.privyTokenExpiresAt : null,
      issuedAt: typeof payload.iat === "number" ? payload.iat : 0,
      expiresAt: typeof payload.exp === "number" ? payload.exp : 0,
    }
  } catch {
    // Expired or forged: both are simply "no session".
    return null
  }
}

/** Read the session straight off a request's cookies. */
export function sessionCookieFrom(req: NextRequest): string | null {
  return req.cookies.get(SESSION_COOKIE)?.value ?? null
}

export async function sessionFromRequest(req: NextRequest): Promise<SessionClaims | null> {
  return readSession(sessionCookieFrom(req))
}

/** Cookie attributes used for both setting and clearing, so they cannot drift. */
export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  }
}
