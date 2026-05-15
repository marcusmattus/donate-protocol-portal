"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const WALLETS = [
  {
    id: "phantom",
    name: "Phantom",
    desc: "Solana-native, Mobile + Extension",
    icon: (
      <svg viewBox="0 0 128 128" className="w-full h-full" fill="none">
        <rect width="128" height="128" rx="20" fill="url(#phg)" />
        <defs>
          <linearGradient id="phg" x1="0" x2="128" y1="0" y2="128" gradientUnits="userSpaceOnUse">
            <stop stopColor="#534bb1" />
            <stop offset="1" stopColor="#551bf9" />
          </linearGradient>
        </defs>
        <ellipse cx="64" cy="64" rx="28" ry="30" fill="white" opacity="0.95" />
        <circle cx="52" cy="60" r="5" fill="url(#phg)" />
        <circle cx="76" cy="60" r="5" fill="url(#phg)" />
        <path d="M50 74 Q64 84 78 74" stroke="url(#phg)" strokeWidth="3" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  {
    id: "solflare",
    name: "Solflare",
    desc: "Ledger Support + DeFi Focused",
    icon: (
      <svg viewBox="0 0 128 128" className="w-full h-full" fill="none">
        <rect width="128" height="128" rx="20" fill="url(#sfg)" />
        <defs>
          <linearGradient id="sfg" x1="0" x2="1" y1="0" y2="1" gradientUnits="objectBoundingBox">
            <stop stopColor="#fc6f2a" />
            <stop offset="1" stopColor="#f4a533" />
          </linearGradient>
        </defs>
        <path d="M64 28 L90 90 H38 Z" fill="white" opacity="0.9" />
        <path d="M52 60 L76 60 L64 90 Z" fill="url(#sfg)" />
      </svg>
    ),
  },
  {
    id: "backpack",
    name: "Backpack",
    desc: "xNFT runtime, multi-chain",
    icon: (
      <svg viewBox="0 0 128 128" className="w-full h-full" fill="none">
        <rect width="128" height="128" rx="20" fill="#111" />
        <rect x="30" y="50" width="68" height="50" rx="8" fill="white" opacity="0.9" />
        <rect x="44" y="34" width="40" height="22" rx="6" stroke="white" strokeWidth="5" fill="none" />
        <path d="M54 75 H74" stroke="#111" strokeWidth="5" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [connecting, setConnecting] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function connectWallet(id: string) {
    setConnecting(id)
    setTimeout(() => {
      router.push("/auth/onboarding")
    }, 2000)
  }

  function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => router.push("/auth/onboarding"), 1500)
  }

  return (
    <div className="min-h-screen flex bg-[#020617] text-slate-50 terminal-grid">
      {/* ─── Left panel (brand) ─── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] xl:w-[40%] border-r border-teal-500/20 p-12 relative overflow-hidden glass-panel">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[500px] h-[500px] rounded-full blur-[200px] -top-48 -left-48 opacity-10" style={{ background: "#14b8a6" }} />
          <div className="absolute w-[300px] h-[300px] rounded-full blur-[150px] bottom-0 right-0 opacity-5" style={{ background: "#84cc16" }} />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2">
            <span style={{ fontFamily: "var(--font-jetbrains), monospace" }} className="font-extrabold tracking-tighter text-2xl uppercase italic text-white">
              Donate<span className="text-teal-400">.Protocol</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[10px] uppercase tracking-widest"
            style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            Secure Connection Established
          </div>

          <h2
            style={{ fontFamily: "var(--font-inter), sans-serif" }}
            className="text-4xl font-extrabold uppercase tracking-tighter leading-none"
          >
            Welcome<br />
            <span className="text-teal-400">Back,</span>
            <br />
            Agent.
          </h2>

          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            Initialize authentication to access trading terminals, strategy marketplace, and real-time impact dashboards.
          </p>

          {/* Stats */}
          <div className="space-y-6 pt-8 border-t border-slate-800">
            {[
              { label: "Agents Online", value: "48,201", color: "text-teal-400" },
              { label: "Donations Today", value: "$231,422", color: "text-lime-400" },
              { label: "Block Height", value: "#277,412,102", color: "text-white" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="flex justify-between items-center"
                style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              >
                <span className="text-[10px] uppercase tracking-widest text-slate-500">{label}</span>
                <span className={`font-bold text-sm ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom terminal prompt */}
        <div
          className="relative z-10 text-[10px] text-teal-400/50 leading-tight"
          style={{ fontFamily: "var(--font-jetbrains), monospace" }}
        >
          <span>/ DONATE.PROTOCOL.SEC v2.4.0 / SOLANA_MAINNET /</span>
        </div>
      </div>

      {/* ─── Right panel (form) ─── */}
      <div className="flex-grow flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden p-6 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2">
            <span style={{ fontFamily: "var(--font-jetbrains), monospace" }} className="font-extrabold tracking-tighter text-xl uppercase italic text-white">
              Donate<span className="text-teal-400">.Protocol</span>
            </span>
          </Link>
        </div>

        <div className="flex-grow flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-md space-y-8">
            <div>
              <h1
                className="text-4xl font-extrabold uppercase tracking-tighter mb-2"
                style={{ fontFamily: "var(--font-inter), sans-serif" }}
              >
                {mode === "login" ? "Sign In" : "Create Account"}
              </h1>
              <div
                className="flex gap-1 mt-4"
                style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              >
                {["login", "register"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m as "login" | "register")}
                    className={`px-5 py-2 text-[10px] uppercase tracking-widest border transition-all ${
                      mode === m
                        ? "border-teal-500 text-teal-400 bg-teal-500/10"
                        : "border-slate-800 text-slate-500 hover:border-slate-600"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Email form ── */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    className="tech-input"
                  />
                </div>
              )}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                  Email
                </label>
                <input type="email" required placeholder="agent@mail.io" className="tech-input" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                  Password
                </label>
                <input type="password" required placeholder="••••••••••" className="tech-input" />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-teal-400 text-slate-950 font-bold uppercase tracking-widest hover:bg-lime-400 transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Authenticating...
                  </>
                ) : (
                  mode === "login" ? "Initialize Session" : "Create Agent Account"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-grow h-px bg-slate-800" />
              <span className="text-[10px] text-slate-600 uppercase tracking-widest" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                or connect wallet
              </span>
              <div className="flex-grow h-px bg-slate-800" />
            </div>

            {/* ── Wallet buttons ── */}
            <div className="space-y-3">
              {WALLETS.map((w) => (
                <button
                  key={w.id}
                  onClick={() => connectWallet(w.id)}
                  disabled={connecting !== null}
                  className={`w-full glass-panel p-4 flex items-center gap-4 hover:border-teal-500 transition-all group disabled:opacity-40 ${
                    connecting === w.id ? "border-teal-500" : ""
                  }`}
                >
                  <div className="w-10 h-10 shrink-0">{w.icon}</div>
                  <div className="text-left flex-grow">
                    <div
                      className="font-bold text-sm text-white group-hover:text-teal-400 transition-colors"
                      style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                    >
                      {w.name}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                      {w.desc}
                    </div>
                  </div>
                  {connecting === w.id ? (
                    <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <p
              className="text-center text-[10px] text-slate-600 leading-loose"
              style={{ fontFamily: "var(--font-jetbrains), monospace" }}
            >
              By connecting you agree to the Donate Protocol{" "}
              <span className="text-teal-400 cursor-pointer hover:underline">Impact Charter</span> and{" "}
              <span className="text-teal-400 cursor-pointer hover:underline">Security Policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
