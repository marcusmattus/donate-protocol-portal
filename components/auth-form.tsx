"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

type Mode = "login" | "signup"

interface AuthFormProps {
  mode: Mode
  redirectTo?: string
  showModeToggle?: boolean
}

export function AuthForm({
  mode: initialMode,
  redirectTo = "/dashboard",
  showModeToggle = true,
}: AuthFormProps) {
  const router = useRouter()
  const { login, signup } = useAuth()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const result =
      mode === "login"
        ? await login({ email, password, rememberMe })
        : await signup({ email, password, passwordConfirm, fullName })

    if (!result.ok) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSuccess(mode === "login" ? "Signed in. Redirecting…" : "Account created. Redirecting…")
    setTimeout(() => router.push(redirectTo), 800)
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div>
        <h1
          className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tighter mb-2"
          style={{ fontFamily: "var(--font-inter), sans-serif" }}
        >
          {mode === "login" ? "Sign In" : "Create Account"}
        </h1>
        <p
          className="text-slate-500 text-xs uppercase tracking-widest"
          style={{ fontFamily: "var(--font-jetbrains), monospace" }}
        >
          Email connection · demo-safe · no funds required
        </p>

        {showModeToggle && (
          <div
            className="flex gap-1 mt-4"
            style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          >
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m)
                  setError(null)
                  setSuccess(null)
                }}
                className={`px-5 py-2 text-[10px] uppercase tracking-widest border transition-all ${
                  mode === m
                    ? "border-teal-500 text-teal-400 bg-teal-500/10"
                    : "border-slate-800 text-slate-500 hover:border-slate-600"
                }`}
              >
                {m === "login" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label
              className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1"
              style={{ fontFamily: "var(--font-jetbrains), monospace" }}
            >
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Agent Name"
              className="tech-input"
              autoComplete="name"
            />
          </div>
        )}

        <div>
          <label
            className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1"
            style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          >
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="agent@mail.io"
            className="tech-input"
            autoComplete="email"
          />
        </div>

        <div>
          <label
            className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1"
            style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          >
            Password
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••"
            className="tech-input"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>

        {mode === "signup" && (
          <div>
            <label
              className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1"
              style={{ fontFamily: "var(--font-jetbrains), monospace" }}
            >
              Confirm Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="••••••••••"
              className="tech-input"
              autoComplete="new-password"
            />
          </div>
        )}

        {mode === "login" && (
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-slate-700"
            />
            <span style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
              Remember me for 30 days
            </span>
          </label>
        )}

        {error && (
          <div
            className="px-3 py-2 border border-red-500/40 bg-red-500/10 text-red-300 text-xs"
            role="alert"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="px-3 py-2 border border-teal-500/40 bg-teal-500/10 text-teal-300 text-xs"
            role="status"
          >
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-teal-400 text-slate-950 font-bold uppercase tracking-widest hover:bg-lime-400 transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
          style={{ fontFamily: "var(--font-jetbrains), monospace" }}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              {mode === "login" ? "Signing in…" : "Creating account…"}
            </>
          ) : mode === "login" ? (
            "Sign in with email"
          ) : (
            "Sign up with email"
          )}
        </button>
      </form>

      <p
        className="text-center text-[10px] text-slate-600 leading-relaxed"
        style={{ fontFamily: "var(--font-jetbrains), monospace" }}
      >
        Demo account:{" "}
        <span className="text-teal-400">demo@donate.protocol</span> /{" "}
        <span className="text-teal-400">password123</span>
        <br />
        {mode === "login" ? (
          <>
            Need an account?{" "}
            <Link href="/signup" className="text-teal-400 hover:underline">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already registered?{" "}
            <Link href="/login" className="text-teal-400 hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  )
}
