import { NextRequest, NextResponse } from "next/server"
import { compare } from "bcryptjs"
import {
  applyAuthCookie,
  createSessionToken,
  findUserByEmail,
} from "@/lib/auth"
import { toPublic } from "@/lib/auth/user-store"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body.email ?? "").trim().toLowerCase()
    const password = String(body.password ?? "")
    const rememberMe = Boolean(body.rememberMe)

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    const stored = await findUserByEmail(email)
    if (!stored) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const valid = await compare(password, stored.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const user = toPublic(stored)
    const { token, maxAge } = await createSessionToken(user, rememberMe)

    const response = NextResponse.json({ success: true, user, token }, { status: 200 })
    applyAuthCookie(response, token, maxAge)
    return response
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
