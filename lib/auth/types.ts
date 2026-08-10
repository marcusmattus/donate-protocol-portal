/** Public user shape returned to the client (never includes password hash). */
export interface AuthUser {
  id: string
  email: string
  fullName: string
  createdAt: string
}

/** Stored user record (server-only). */
export interface StoredUser {
  id: string
  email: string
  fullName: string
  passwordHash: string
  createdAt: string
}

export interface AuthSession {
  user: AuthUser
  expiresAt: number
}

export interface JwtPayload {
  userId: string
  email: string
  fullName: string
  rememberMe?: boolean
}

export interface SignupInput {
  email: string
  password: string
  passwordConfirm: string
  fullName: string
}

export interface LoginInput {
  email: string
  password: string
  rememberMe?: boolean
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated"
