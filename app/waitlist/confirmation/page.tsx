"use client"

import { useState } from "react"
import Link from "next/link"

export default function WaitlistConfirmation() {
  const [monthlyVolume, setMonthlyVolume] = useState(50000)
  const [donationRate, setDonationRate] = useState(0.02)

  const simulatedImpact = (monthlyVolume * (donationRate / 100)).toFixed(2)
  const livesReady = Math.floor(Number(simulatedImpact) / 2.5)

  const rates = [0.01, 0.02, 0.05, 0.1]

  return (
    <div className="mesh-gradient font-sans text-slate-900 min-h-screen flex flex-col">
      {/* Fixed blobs */}
      <div className="fixed top-[10%] left-[5%] w-32 h-32 rounded-full blur-2xl animate-float pointer-events-none" style={{ background: "rgba(79,70,229,0.05)" }} />
      <div className="fixed bottom-[20%] right-[10%] w-64 h-64 rounded-full blur-3xl animate-float pointer-events-none" style={{ background: "rgba(20,184,166,0.05)", animationDelay: "-3s" }} />

      {/* ─── Nav ─── */}
      <nav className="fixed top-0 w-full z-50 py-8">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl rotate-3 shadow-lg"
              style={{ backgroundColor: "#4f46e5", fontFamily: "var(--font-space-grotesk), sans-serif" }}
            >
              D
            </div>
            <span style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }} className="font-bold text-2xl tracking-tight">
              Donate<span className="text-teal-500">.</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:block text-xs font-bold uppercase tracking-widest text-slate-400">
              Launch Alpha 2025
            </span>
            <div className="h-8 w-px bg-slate-200 hidden md:block" />
            <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full border border-white">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#14b8a6" }} />
              <span className="text-sm font-bold">Queue Active</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-start">

          {/* ─── Left: Confirmation & Referral ─── */}
          <div className="lg:col-span-7 space-y-8 animate-slide-up">
            <div>
              <div
                className="inline-flex items-center gap-2 border px-4 py-1.5 rounded-full mb-6"
                style={{ background: "rgba(20,184,166,0.10)", borderColor: "rgba(20,184,166,0.20)" }}
              >
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#14b8a6" }}>
                  Registration Confirmed
                </span>
              </div>
              <h1 style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }} className="text-5xl md:text-7xl font-bold leading-[0.9] mb-6 tracking-tighter">
                You&apos;re part of the{" "}
                <br />
                <span className="shimmer-text italic font-light">movement.</span>
              </h1>
              <p className="text-xl text-slate-600 max-w-xl leading-relaxed">
                Welcome to the vanguard of ethical finance. We&apos;re verifying accounts in batches to ensure platform stability. Your position is secured.
              </p>
            </div>

            {/* Referral card */}
            <div className="glass-card rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center animate-float" style={{ background: "rgba(79,70,229,0.05)", color: "#4f46e5" }}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                  </svg>
                </div>
              </div>

              <div className="relative z-10">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Your Current Status</p>
                <div className="flex items-baseline gap-3 mb-8">
                  <h2 style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }} className="text-6xl font-bold text-slate-900">
                    #1,422
                  </h2>
                  <span className="font-bold" style={{ color: "#14b8a6" }}>↑ 42 spots moved</span>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-2xl border border-white/50" style={{ background: "rgba(15,23,42,0.05)" }}>
                    <p className="text-sm font-semibold text-slate-500 mb-4">Invite fellow traders to skip the queue:</p>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value="donate.io/join/ref-492k"
                        className="flex-grow bg-white px-5 py-3 rounded-xl border border-slate-200 font-mono text-sm"
                        style={{ color: "#4f46e5" }}
                      />
                      <button
                        onClick={() => navigator.clipboard?.writeText("donate.io/join/ref-492k")}
                        className="text-white px-6 rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all"
                        style={{ background: "#4f46e5" }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm font-bold text-slate-400">
                    <div className="flex -space-x-2">
                      {["bg-slate-200", "bg-slate-300", "bg-teal-500"].map((bg, i) => (
                        <div key={i} className={`w-8 h-8 rounded-full border-2 border-white ${bg} flex items-center justify-center text-[10px] text-white`}>
                          {i === 2 && "+12"}
                        </div>
                      ))}
                    </div>
                    <span>Friends already joined</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Share buttons */}
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: "Share on X",
                  icon: (
                    <svg className="w-5 h-5 text-slate-600 fill-current" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  ),
                },
                {
                  label: "Other Channels",
                  icon: (
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  ),
                },
              ].map(({ label, icon }) => (
                <div key={label} className="p-6 rounded-3xl border border-slate-200 flex flex-col gap-4 hover:border-teal-500 transition-colors cursor-pointer">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">{icon}</div>
                  <p className="font-bold">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Right: Impact Simulator ─── */}
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <div className="glass-card rounded-[3rem] p-10 border relative overflow-hidden" style={{ borderColor: "rgba(20,184,166,0.20)" }}>
              <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(20,184,166,0.10)" }} />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ background: "#14b8a6" }}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }} className="text-2xl font-bold">
                      Impact Simulator
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Projection based on volume</p>
                  </div>
                </div>

                <div className="space-y-8 mb-12">
                  {/* Volume slider */}
                  <div>
                    <div className="flex justify-between mb-4">
                      <label className="text-sm font-bold text-slate-500">Estimated Monthly Volume</label>
                      <span className="font-bold" style={{ fontFamily: "var(--font-space-grotesk), sans-serif", color: "#4f46e5" }}>
                        ${parseInt(String(monthlyVolume)).toLocaleString()}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1000}
                      max={1000000}
                      step={1000}
                      value={monthlyVolume}
                      onChange={(e) => setMonthlyVolume(Number(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: "#4f46e5" }}
                    />
                  </div>

                  {/* Donation rate */}
                  <div>
                    <div className="flex justify-between mb-4">
                      <label className="text-sm font-bold text-slate-500">Contribution Rate</label>
                      <span className="font-bold" style={{ fontFamily: "var(--font-space-grotesk), sans-serif", color: "#14b8a6" }}>
                        {donationRate}%
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {rates.map((r) => (
                        <button
                          key={r}
                          onClick={() => setDonationRate(r)}
                          className={`flex-1 py-3 rounded-xl border font-bold text-xs transition-all`}
                          style={
                            donationRate === r
                              ? { background: "#14b8a6", color: "white", borderColor: "#14b8a6" }
                              : { background: "white", color: "#94a3b8", borderColor: "#e2e8f0" }
                          }
                        >
                          {r}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Result box */}
                <div className="rounded-3xl p-8 text-white relative overflow-hidden" style={{ background: "#0f172a" }}>
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl translate-x-10 -translate-y-10" style={{ background: "rgba(20,184,166,0.20)" }} />
                  <div className="relative z-10 space-y-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: "rgba(255,255,255,0.40)" }}>
                        Projected Monthly Contribution
                      </p>
                      <h4 style={{ fontFamily: "var(--font-space-grotesk), sans-serif", color: "#14b8a6" }} className="text-5xl font-bold">
                        ${simulatedImpact}
                      </h4>
                    </div>
                    <div className="h-px bg-white/10" />
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.10)" }}>
                        <svg className="w-6 h-6" style={{ color: "#14b8a6" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0l-4-4a4 4 0 015.656-5.656l1.103 1.101m-.758 4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold opacity-80 leading-snug">
                        This amount provides{" "}
                        <span className="font-bold" style={{ color: "#14b8a6" }}>{livesReady}</span>{" "}
                        days of clean water and nutrition for a family in need.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  * Calculation based on standard network throughput
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-slate-100 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <Link href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-indigo-600 transition-colors">Terms of Impact</Link>
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            © 2025 Donate Protocol. Verified Early Access.
          </div>
        </div>
      </footer>
    </div>
  )
}
