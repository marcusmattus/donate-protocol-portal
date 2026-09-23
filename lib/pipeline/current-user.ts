/**
 * Resolve the acting Donate Protocol user for a request.
 *
 * Placeholder while auth is wired: the demo identity is used unless a session
 * is present. Deliberately one function so that when next-auth (already a
 * dependency) becomes the source of truth, every TradingView surface picks it
 * up at once instead of each route growing its own notion of "the user".
 */

import type { NextRequest } from "next/server"

export const DEMO_USER_ID = "demo-user"

export function currentUserId(_req?: NextRequest): string {
  return process.env.TRADINGVIEW_DEMO_USER_ID || DEMO_USER_ID
}
