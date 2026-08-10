"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { AuthStatus, AuthUser, LoginInput, SignupInput } from "@/lib/auth/types"

interface AuthContextValue {
  user: AuthUser | null
  status: AuthStatus
  isAuthenticated: boolean
  refresh: () => Promise<void>
  login: (input: LoginInput) => Promise<{ ok: true } | { ok: false; error: string }>
  signup: (input: SignupInput) => Promise<{ ok: true } | { ok: false; error: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>("loading")

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { credentials: "include" })
      const data = await res.json()
      if (data.authenticated && data.user) {
        setUser(data.user)
        setStatus("authenticated")
        if (typeof window !== "undefined" && data.user.email) {
          localStorage.setItem("authUser", JSON.stringify(data.user))
        }
      } else {
        setUser(null)
        setStatus("unauthenticated")
        if (typeof window !== "undefined") {
          localStorage.removeItem("authToken")
          localStorage.removeItem("authUser")
        }
      }
    } catch {
      setUser(null)
      setStatus("unauthenticated")
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(async (input: LoginInput) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      })
      const data = await res.json()
      if (!res.ok) {
        return { ok: false as const, error: data.error || "Login failed" }
      }
      setUser(data.user)
      setStatus("authenticated")
      if (typeof window !== "undefined") {
        localStorage.setItem("authToken", data.token)
        localStorage.setItem("authUser", JSON.stringify(data.user))
      }
      return { ok: true as const }
    } catch {
      return { ok: false as const, error: "Network error. Please try again." }
    }
  }, [])

  const signup = useCallback(async (input: SignupInput) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      })
      const data = await res.json()
      if (!res.ok) {
        return { ok: false as const, error: data.error || "Signup failed" }
      }
      setUser(data.user)
      setStatus("authenticated")
      if (typeof window !== "undefined") {
        localStorage.setItem("authToken", data.token)
        localStorage.setItem("authUser", JSON.stringify(data.user))
      }
      return { ok: true as const }
    } catch {
      return { ok: false as const, error: "Network error. Please try again." }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    } finally {
      setUser(null)
      setStatus("unauthenticated")
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken")
        localStorage.removeItem("authUser")
      }
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated" && !!user,
      refresh,
      login,
      signup,
      logout,
    }),
    [user, status, refresh, login, signup, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
