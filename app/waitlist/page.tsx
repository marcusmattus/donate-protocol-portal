"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const TRADER_TYPES = [
  "Day Trader",
  "Long-term Investor",
  "Institutional / Whale",
  "Swing Trader",
  "Algo / Bot Developer",
]

export default function WaitlistPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [traderType, setTraderType] = useState("Retail Trader")
  const [dropdownOpen, setDropdownOpen] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      router.push("/waitlist/confirmation")
    }, 1500)
  }

  return (
    <div className="mesh-gradient font-sans text-slate-900 min-h-screen flex flex-col overflow-x-hidden">
      {/* Animated blobs */}
      <div className="fixed top-1/4 -left-20 w-96 h-96 rounded-full blur-[100px] animate-pulse-slow pointer-events-none" style={{ background: "rgba(79,70,229,0.10)" }} />
      <div className="fixed bottom-20 right-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none" style={{ background: "rgba(20,184,166,0.05)" }} />

      {/* ─── Nav ─── */}
      <nav className="fixed top-0 w-full z-50 py-8">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl rotate-3 shadow-lg group-hover:rotate-0 transition-transform"
              style={{ backgroundColor: "#4f46e5", fontFamily: "var(--font-space-grotesk), sans-serif" }}
            >
              D
            </div>
            <span style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }} className="font-bold text-2xl tracking-tight">
              Donate<span className="text-teal-500">.</span>
            </span>
          </Link>

          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="hidden md:block text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
              style={{ fontFamily: "var(--font-outfit), sans-serif" }}
            >
              Back to Home
            </Link>
            <div className="h-4 w-px bg-slate-200 hidden md:block" />
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
              style={{ background: "rgba(20,184,166,0.1)", color: "#14b8a6", fontFamily: "var(--font-outfit), sans-serif" }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#14b8a6" }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#14b8a6" }} />
              </span>
              Early Access Phase 1
            </span>
          </div>
        </div>
      </nav>

      <main className="flex-grow pt-32 pb-20 flex items-center justify-center relative px-6 z-10">
        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-16 items-center">

          {/* ─── Left: storytelling ─── */}
          <div className="order-2 lg:order-1 space-y-8">
            <h1 style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }} className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tighter">
              Trading for a{" "}
              <br />
              <span className="italic font-light text-teal-500">Greater Good.</span>
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed max-w-lg">
              You&apos;re not just signing up for a platform; you&apos;re joining a global community of traders who believe alpha and altruism belong together.
            </p>

            <div className="space-y-6 pt-4">
              {[
                {
                  icon: (
                    <svg className="w-6 h-6" style={{ color: "#4f46e5" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                  title: "Instant Micro-Impact",
                  desc: "Round up every trade to the nearest dollar automatically.",
                },
                {
                  icon: (
                    <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                  title: "Bank-Grade Privacy",
                  desc: "Non-custodial connection. We never touch your private keys.",
                },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    {icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>{title}</h4>
                    <p className="text-slate-400 text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div className="pt-10 flex flex-col gap-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Trusted by early adopters from</p>
              <div className="flex flex-wrap gap-6 opacity-40 grayscale">
                {["BINANCE", "COINBASE", "KRAKEN"].map((b) => (
                  <span key={b} style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }} className="font-bold text-lg">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Right: form ─── */}
          <div className="order-1 lg:order-2">
            <div className="glass-card p-8 md:p-12 rounded-[3.5rem] relative overflow-hidden group">
              {/* Progress bar visible during loading */}
              {loading && (
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 overflow-hidden">
                  <div className="h-full bg-teal-400 animate-glow-line" style={{ width: "33%" }} />
                </div>
              )}

              <header className="mb-10">
                <h3 style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }} className="text-3xl font-bold mb-2">
                  Secure Early Access
                </h3>
                <p className="text-slate-500">
                  Join the waitlist. Early adopters receive 0% fees for the first 12 months.
                </p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      className="w-full px-6 py-4 rounded-2xl bg-white/50 border border-slate-200 outline-none input-glow transition-all font-medium placeholder:text-slate-300"
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">
                      Preferred Handle
                    </label>
                    <input
                      type="text"
                      placeholder="@trader_vibe"
                      className="w-full px-6 py-4 rounded-2xl bg-white/50 border border-slate-200 outline-none input-glow transition-all font-medium placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@domain.com"
                    className="w-full px-6 py-4 rounded-2xl bg-white/50 border border-slate-200 outline-none input-glow transition-all font-medium placeholder:text-slate-300"
                  />
                </div>

                {/* Custom select */}
                <div className="relative">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">
                    Trader Profile
                  </label>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full px-6 py-4 rounded-2xl bg-white/50 border border-slate-200 text-left flex justify-between items-center hover:border-teal-500 transition-colors"
                  >
                    <span className="font-medium">{traderType}</span>
                    <svg
                      className={`w-5 h-5 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 overflow-hidden">
                      {TRADER_TYPES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => { setTraderType(t); setDropdownOpen(false) }}
                          className="w-full px-6 py-3 text-left hover:bg-slate-50 transition-colors text-sm font-medium border-b border-slate-50 last:border-0"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full text-slate-900 py-5 rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all btn-impact-shadow flex items-center justify-center gap-3 disabled:opacity-70"
                    style={{ background: "#14b8a6" }}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        Secure Early Access
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-6">
                    By joining, you agree to our Impact Charter
                  </p>
                </div>
              </form>

              <div className="absolute -right-24 -bottom-24 w-64 h-64 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" style={{ background: "rgba(20,184,166,0.10)" }} />
            </div>
          </div>
        </div>
      </main>

      {/* ─── Footer stats ─── */}
      <footer className="py-12 border-t border-slate-100 bg-white/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Waitlist Size", value: "2,481 Traders" },
              { label: "Impact Goal", value: "$1M / Year" },
              { label: "Supported Chains", value: "12+ Major Networks" },
              { label: "Launch Window", value: "Q1 2025" },
            ].map(({ label, value }) => (
              <div key={label} className="text-center md:text-left">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
