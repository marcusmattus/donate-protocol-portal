"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function PrivateWalletLoginPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Login state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  // Signup state
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState("")
  const [signupFullName, setSignupFullName] = useState("")

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          rememberMe,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Login failed")
        return
      }

      // Store token
      localStorage.setItem("authToken", data.token)
      setSuccess("Login successful! Redirecting...")

      setTimeout(() => {
        router.push("/private-wallet")
      }, 1500)
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Handle signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (signupPassword !== signupPasswordConfirm) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
          passwordConfirm: signupPasswordConfirm,
          fullName: signupFullName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Signup failed")
        return
      }

      // Store token
      localStorage.setItem("authToken", data.token)
      setSuccess("Account created! Redirecting...")

      setTimeout(() => {
        router.push("/private-wallet")
      }, 1500)
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 terminal-grid">
      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <div className="w-full h-[2px] bg-teal-500/10 animate-scanline opacity-20" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-teal-500/20 bg-black/80 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            <span className="text-white">Donate</span>
            <span className="text-teal-400">.Wallet</span>
          </Link>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="py-20 px-6 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-extrabold uppercase tracking-tighter mb-2">
                Private <span className="text-teal-400">Wallet</span>
              </h1>
              <p className="text-slate-400">Secure authentication & auto-trading</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => {
                  setActiveTab("login")
                  setError(null)
                }}
                className={`flex-1 py-2 px-4 text-[10px] uppercase font-bold tracking-widest transition border ${
                  activeTab === "login"
                    ? "border-teal-400 bg-teal-500/10 text-teal-400"
                    : "border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => {
                  setActiveTab("signup")
                  setError(null)
                }}
                className={`flex-1 py-2 px-4 text-[10px] uppercase font-bold tracking-widest transition border ${
                  activeTab === "signup"
                    ? "border-lime-400 bg-lime-500/10 text-lime-400"
                    : "border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-lime-500/10 border border-lime-500/30 rounded text-lime-400 text-sm">
                {success}
              </div>
            )}

            {/* Login Form */}
            {activeTab === "login" && (
              <form onSubmit={handleLogin} className="glass-panel p-8 space-y-4">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-bold mb-2 block">
                    Email
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-bold mb-2 block">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded"
                    required
                  />
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-400">Remember me for 30 days</span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 mt-6 text-[10px] uppercase font-bold tracking-widest border border-teal-400 text-teal-400 hover:bg-teal-400 hover:text-slate-950 transition disabled:opacity-50"
                >
                  {loading ? "Logging in..." : "Login 🔐"}
                </button>
              </form>
            )}

            {/* Signup Form */}
            {activeTab === "signup" && (
              <form onSubmit={handleSignup} className="glass-panel p-8 space-y-4">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-bold mb-2 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-bold mb-2 block">
                    Email
                  </label>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-bold mb-2 block">
                    Password (min 8 chars)
                  </label>
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-bold mb-2 block">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={signupPasswordConfirm}
                    onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 mt-6 text-[10px] uppercase font-bold tracking-widest border border-lime-400 text-lime-400 hover:bg-lime-400 hover:text-slate-950 transition disabled:opacity-50"
                >
                  {loading ? "Creating account..." : "Sign Up ✨"}
                </button>
              </form>
            )}

            {/* Footer */}
            <p className="text-center text-[10px] text-slate-500 uppercase mt-6">
              Questions? Read our{" "}
              <Link href="/docs/private-wallet" className="text-teal-400 hover:underline">
                documentation
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
