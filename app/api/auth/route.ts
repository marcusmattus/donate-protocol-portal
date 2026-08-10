import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookies, verifySessionToken } from "@/lib/auth"

/**
 * GET /api/auth — current session (also available at /api/auth/session)
 * GET /api/auth?verify=1 with Authorization: Bearer <token>
 */
export async function GET(request: NextRequest) {
  const verify = request.nextUrl.searchParams.get("verify")
  if (verify === "1") {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }
    const payload = await verifySessionToken(authHeader.slice(7))
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    return NextResponse.json({ valid: true, payload })
  }

  const session = await getSessionFromCookies()
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null })
  }
  return NextResponse.json({
    authenticated: true,
    user: session.user,
    expiresAt: session.expiresAt,
  })
}

/**
 * Prefer /api/auth/login, /signup, /logout, /exchange-login.
 * Kept for backward-compatible discovery.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Use /api/auth/login, /api/auth/signup, or /api/auth/logout",
    },
    { status: 404 }
  )
}
