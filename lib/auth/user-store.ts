import { hash } from "bcryptjs"
import { generateSecureToken } from "@/lib/wallet-encryption"
import type { AuthUser, StoredUser } from "./types"

/**
 * Demo-friendly in-memory user store.
 * Survives Next.js HMR via globalThis; resets on process restart.
 * Replace with a database for production.
 */

const GLOBAL_KEY = "__donate_protocol_auth_users__"

type UserMap = Map<string, StoredUser>

function getStore(): UserMap {
  const g = globalThis as typeof globalThis & { [GLOBAL_KEY]?: UserMap }
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = new Map()
  }
  return g[GLOBAL_KEY]!
}

let seeded = false

async function ensureSeed() {
  if (seeded) return
  seeded = true
  const store = getStore()
  if (store.size > 0) return

  const demoEmail = "demo@donate.protocol"
  const passwordHash = await hash("password123", 10)
  store.set(demoEmail, {
    id: "user_demo_001",
    email: demoEmail,
    fullName: "Demo Agent",
    passwordHash,
    createdAt: new Date().toISOString(),
  })
}

function toPublic(user: StoredUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    createdAt: user.createdAt,
  }
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  await ensureSeed()
  const normalized = email.trim().toLowerCase()
  return getStore().get(normalized) ?? null
}

export async function createUser(input: {
  email: string
  fullName: string
  passwordHash: string
}): Promise<AuthUser> {
  await ensureSeed()
  const store = getStore()
  const normalized = input.email.trim().toLowerCase()

  if (store.has(normalized)) {
    throw new Error("An account with this email already exists")
  }

  const user: StoredUser = {
    id: `user_${generateSecureToken(8)}`,
    email: normalized,
    fullName: input.fullName.trim(),
    passwordHash: input.passwordHash,
    createdAt: new Date().toISOString(),
  }

  store.set(normalized, user)
  return toPublic(user)
}

export async function getPublicUser(email: string): Promise<AuthUser | null> {
  const user = await findUserByEmail(email)
  return user ? toPublic(user) : null
}

export { toPublic }
