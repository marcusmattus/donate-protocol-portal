"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"

export default function PrivateWalletLoginPage() {
  const router = useRouter()
  const { login, signup } = useAuth()
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState("")
  const [signupFullName, setSignupFullName] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const result = await login({
      email: loginEmail,
      password: loginPassword,
      rememberMe,
    })

    if (!result.ok) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSuccess("Login successful! Redirecting...")
    setTimeout(() => router.push("/private-wallet"), 1000)
    setLoading(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (signupPassword !== signupPasswordConfirm) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    const result = await signup({
      email: signupEmail,
      password: signupPassword,
      passwordConfirm: signupPasswordConfirm,
      fullName: signupFullName,
    })

    if (!result.ok) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSuccess("Account created! Redirecting...")
    setTimeout(() => router.push("/private-wallet"), 1000)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 terminal-grid">
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <div className="w-full h-[2px] bg-teal-500/10 animate-scanline opacity-20" />
      </div>

      <nav className="border-b border-teal-500/20 glass-panel px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span
              style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              className="font-extrabold tracking-tighter text-xl uppercase italic text-white"
            >
              Donate<span className="text-teal-400">.Protocol</span>
            </span>
          </Link>
          <div className="flex gap-3 text-xs uppercase tracking-widest" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
            <Link href="/login" className="text-slate-400 hover:text-teal-400">
              Sign in
            </Link>
            <Link href="/signup" className="text-teal-400 hover:text-lime-400">
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-md mx-auto px-6 py-16">
        <h1
          className="text-3xl font-extrabold uppercase tracking-tighter mb-2"
          style={{ fontFamily: "var(--font-inter), sans-serif" }}
        >
          Private Wallet Access
        </h1>
        <p className="text-slate-500 text-sm mb-8" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
          Email connection required for encrypted exchange keys
        </p>

        <div className="flex gap-1 mb-6" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab("login")
              setError(null)
            }}
            className={`flex-1 py-2 text-[10px] uppercase tracking-widest border transition-all ${
              activeTab === "login"
                ? "border-teal-500 text-teal-400 bg-teal-500/10"
                : "border-slate-800 text-slate-500"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("signup")
              setError(null)
            }}
            className={`flex-1 py-2 text-[10px] uppercase tracking-widest border transition-all ${
              activeTab === "signup"
                ? "border-teal-500 text-teal-400 bg-teal-500/10"
                : "border-slate-800 text-slate-500"
            }`}
          >
            Signup
          </button>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 border border-red-500/40 bg-red-500/10 text-red-300 text-xs">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-3 py-2 border border-teal-500/40 bg-teal-500/10 text-teal-300 text-xs">
            {success}
          </div>
        )}

        {activeTab === "login" && (
          <form onSubmit={handleLogin} className="glass-panel p-8 space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="tech-input"
                placeholder="demo@donate.protocol"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="tech-input"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-400 text-slate-950 font-bold uppercase tracking-widest hover:bg-lime-400 disabled:opacity-70"
              style={{ fontFamily: "var(--font-jetbrains), monospace" }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        )}

        {activeTab === "signup" && (
          <form onSubmit={handleSignup} className="glass-panel p-8 space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={signupFullName}
                onChange={(e) => setSignupFullName(e.target.value)}
                className="tech-input"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                className="tech-input"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                className="tech-input"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={signupPasswordConfirm}
                onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                className="tech-input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-400 text-slate-950 font-bold uppercase tracking-widest hover:bg-lime-400 disabled:opacity-70"
              style={{ fontFamily: "var(--font-jetbrains), monospace" }}
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-[10px] text-slate-600" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
          Demo: demo@donate.protocol / password123
        </p>
      </main>
    </div>
  )
}
