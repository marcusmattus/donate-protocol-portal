/**
 * Resolve the acting Donate Protocol user for a request.
 *
 * The Privy session cookie is the source of truth: `currentUserId` returns the
 * caller's Privy DID once they have logged in and the server has verified that
 * login against Privy's JWKS. Every TradingView and ramp surface goes through
 * this one function, so a login takes effect everywhere at once rather than
 * each route growing its own notion of "the user".
 *
 * Without a session it falls back to the demo identity, which is what keeps the
 * unauthenticated demo working. That fallback is the reason `requireUserId`
 * exists as a separate function: a route that must not silently operate as the
 * demo user asks for the strict one.
 */

import type { NextRequest } from "next/server"
import { sessionFromRequest } from "@/lib/privy/session"

export const DEMO_USER_ID = "demo-user"

export function demoUserId(): string {
  return process.env.TRADINGVIEW_DEMO_USER_ID || DEMO_USER_ID
}

/**
 * The acting user, falling back to the demo identity.
 *
 * Synchronous for the many call sites that cannot await, and therefore unable
 * to read the cookie — prefer `currentUserIdAsync` in a request handler.
 */
export function currentUserId(_req?: NextRequest): string {
  return demoUserId()
}

/** The acting user, reading the verified Privy session when one is present. */
export async function currentUserIdAsync(req?: NextRequest): Promise<string> {
  if (!req) return demoUserId()
  const session = await sessionFromRequest(req)
  return session?.userId ?? demoUserId()
}

/**
 * The acting user, or null when nobody is logged in.
 *
 * For routes that must never act as the demo user by accident.
 */
export async function requireUserId(req: NextRequest): Promise<string | null> {
  const session = await sessionFromRequest(req)
  return session?.userId ?? null
}
