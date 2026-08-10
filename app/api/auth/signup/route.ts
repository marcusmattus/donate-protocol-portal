import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import {
  applyAuthCookie,
  createSessionToken,
  createUser,
  findUserByEmail,
} from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body.email ?? "").trim().toLowerCase()
    const password = String(body.password ?? "")
    const passwordConfirm = String(body.passwordConfirm ?? "")
    const fullName = String(body.fullName ?? "").trim()

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Email, password, and full name are required" },
        { status: 400 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    if (password !== passwordConfirm) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
    }

    const existing = await findUserByEmail(email)
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    const passwordHash = await hash(password, 10)
    const user = await createUser({ email, fullName, passwordHash })
    const { token, maxAge } = await createSessionToken(user, false)

    const response = NextResponse.json(
      { success: true, user, token },
      { status: 201 }
    )
    applyAuthCookie(response, token, maxAge)
    return response
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Signup failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
