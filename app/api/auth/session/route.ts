import { NextResponse } from "next/server"
import { getSessionFromCookies } from "@/lib/auth"

export async function GET() {
  const session = await getSessionFromCookies()

  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 })
  }

  return NextResponse.json({
    authenticated: true,
    user: session.user,
    expiresAt: session.expiresAt,
  })
}
