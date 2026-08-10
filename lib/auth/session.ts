import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import type { NextResponse } from "next/server"
import type { AuthSession, AuthUser, JwtPayload } from "./types"
import { findUserByEmail, toPublic } from "./user-store"

export const AUTH_COOKIE = "authToken"

const DEFAULT_SECRET = "donate-protocol-jwt-secret-2026-dev-only"

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || DEFAULT_SECRET)
}

export async function createSessionToken(
  user: AuthUser,
  rememberMe = false
): Promise<{ token: string; maxAge: number }> {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60
  const expiresIn = rememberMe ? "30d" : "7d"

  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    rememberMe,
  } satisfies JwtPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret())

  return { token, maxAge }
}

export async function verifySessionToken(
  token: string
): Promise<(JwtPayload & { exp?: number }) | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.fullName !== "string"
    ) {
      return null
    }
    return {
      userId: payload.userId,
      email: payload.email,
      fullName: payload.fullName,
      rememberMe: Boolean(payload.rememberMe),
      exp: typeof payload.exp === "number" ? payload.exp : undefined,
    }
  } catch {
    return null
  }
}

export function applyAuthCookie(
  response: NextResponse,
  token: string,
  maxAge: number
) {
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  })
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
}

export async function getSessionFromCookies(): Promise<AuthSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE)?.value
  if (!token) return null

  const payload = await verifySessionToken(token)
  if (!payload) return null

  const stored = await findUserByEmail(payload.email)
  const user = stored
    ? toPublic(stored)
    : {
        id: payload.userId,
        email: payload.email,
        fullName: payload.fullName,
        createdAt: new Date().toISOString(),
      }

  return {
    user,
    expiresAt: payload.exp ? payload.exp * 1000 : Date.now() + 7 * 24 * 60 * 60 * 1000,
  }
}
