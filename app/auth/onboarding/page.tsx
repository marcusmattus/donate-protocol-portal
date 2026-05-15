"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const CAUSES = [
  { id: "climate", label: "Climate & Oceans", icon: "🌊" },
  { id: "education", label: "Education", icon: "📚" },
  { id: "food", label: "Food Security", icon: "🌾" },
  { id: "health", label: "Global Health", icon: "💊" },
  { id: "disaster", label: "Disaster Relief", icon: "🚨" },
  { id: "opensource", label: "Open Source", icon: "💻" },
]

const STRATEGIES = [
  { id: "fixed", label: "Fixed Amount", desc: "Donate a fixed amount on every trade close." },
  { id: "percent_profit", label: "% Of Profit", desc: "Donate a percentage of profitable trade returns." },
  { id: "monthly", label: "Monthly Budget", desc: "Set a monthly donation cap from P&L." },
]

const FREQUENCY = [
  { id: "immediately", label: "Immediately" },
  { id: "daily", label: "Daily Batch" },
  { id: "weekly", label: "Weekly" },
]

const STEPS = [
  "Profile",
  "Mission",
  "Donation Preferences",
  "Connect Exchange",
  "Confirm",
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedCauses, setSelectedCauses] = useState<string[]>([])
  const [donationStrategy, setDonationStrategy] = useState("percent_profit")
  const [donationAmount, setDonationAmount] = useState(2)
  const [frequency, setFrequency] = useState("immediately")
  const [completing, setCompleting] = useState(false)

  const totalSteps = STEPS.length

  function toggleCause(id: string) {
    setSelectedCauses((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  function handleComplete() {
    setCompleting(true)
    setTimeout(() => router.push("/"), 2000)
  }

  const progressWidth = `${((currentStep + 1) / totalSteps) * 100}%`

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 terminal-grid flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-30 glass-panel px-6 py-4 flex justify-between items-center">
        <Link href="/" style={{ fontFamily: "var(--font-jetbrains), monospace" }} className="font-extrabold tracking-tighter text-lg uppercase italic">
          Donate<span className="text-teal-400">.Protocol</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex gap-1" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
            {STEPS.map((label, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= currentStep ? "bg-teal-400" : "bg-slate-800"}`}
                style={{ width: i <= currentStep ? "40px" : "8px" }}
              />
            ))}
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
            {currentStep + 1} / {totalSteps}
          </span>
        </div>
        <button
          onClick={() => router.push("/")}
          className="text-slate-600 hover:text-slate-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-900">
        <div
          className="h-full bg-teal-400 transition-all duration-700"
          style={{ width: progressWidth }}
        />
      </div>

      {/* Content */}
      <main className="flex-grow flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl">

          {/* ─── Step 0: Profile ─── */}
          {currentStep === 0 && (
            <div className="space-y-10 animate-slide-up">
              <div>
                <div className="text-[10px] text-teal-400 uppercase tracking-[0.3em] mb-4" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                  Step 01 / Profile
                </div>
                <h1 className="text-4xl font-extrabold uppercase tracking-tighter" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                  Tell us who you are.
                </h1>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                    Display Name / Handle
                  </label>
                  <input type="text" defaultValue="Crypto_Trader_01" className="tech-input" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                    Public Bio
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: 'Long SOL, short the status quo. Profits fund clean water globally.'"
                    className="tech-input resize-none"
                    style={{ background: "rgba(0,0,0,0.4)", border: "1px solid #1e293b", fontFamily: "var(--font-jetbrains), monospace", padding: "1rem", width: "100%", outline: "none", color: "#14b8a6" }}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-[10px] uppercase tracking-widest text-slate-400" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                    Visibility
                  </label>
                  <div className="flex gap-2">
                    {["Public", "Private"].map((v) => (
                      <button key={v} className="px-4 py-2 border border-slate-800 text-[10px] uppercase glass-panel hover:border-teal-500 first:border-teal-500 first:text-teal-400 transition-all" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 1: Mission ─── */}
          {currentStep === 1 && (
            <div className="space-y-10 animate-slide-up">
              <div>
                <div className="text-[10px] text-teal-400 uppercase tracking-[0.3em] mb-4" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                  Step 02 / Your Mission
                </div>
                <h1 className="text-4xl font-extrabold uppercase tracking-tighter" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                  What do you fight for?
                </h1>
                <p className="text-slate-400 mt-4">Select causes that resonate. Your profits will be routed here automatically.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {CAUSES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCause(c.id)}
                    className={`p-6 glass-panel text-left transition-all duration-300 ${
                      selectedCauses.includes(c.id)
                        ? "border-teal-400 bg-teal-500/10 glow-teal"
                        : "hover:border-slate-600"
                    }`}
                  >
                    <div className="text-2xl mb-3">{c.icon}</div>
                    <div className="text-sm font-bold text-white" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                      {c.label}
                    </div>
                    {selectedCauses.includes(c.id) && (
                      <div className="mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[9px] text-teal-400 uppercase" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>Selected</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Step 2: Donation Preferences ─── */}
          {currentStep === 2 && (
            <div className="space-y-10 animate-slide-up">
              <div>
                <div className="text-[10px] text-teal-400 uppercase tracking-[0.3em] mb-4" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                  Step 03 / Donation Rules
                </div>
                <h1 className="text-4xl font-extrabold uppercase tracking-tighter" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                  How do you want to give?
                </h1>
              </div>

              <div className="space-y-4">
                {STRATEGIES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setDonationStrategy(s.id)}
                    className={`w-full p-6 glass-panel text-left transition-all flex items-center gap-6 ${
                      donationStrategy === s.id ? "border-teal-500 bg-teal-500/10" : "hover:border-slate-600"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 shrink-0 ${
                        donationStrategy === s.id ? "border-teal-400 bg-teal-400" : "border-slate-600"
                      }`}
                    />
                    <div>
                      <div className="font-bold text-white text-sm" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                        {s.label}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                        {s.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase tracking-widest text-slate-400" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                    Donation Rate: <span className="text-teal-400 font-bold">{donationAmount}%</span>
                  </label>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: "#14b8a6" }}
                />
                <div className="flex justify-between text-[9px] text-slate-600 uppercase" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                  <span>1% (Minimal)</span>
                  <span>5% (Balanced)</span>
                  <span>10% (Altruist)</span>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-4">
                  {FREQUENCY.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFrequency(f.id)}
                      className={`p-3 glass-panel text-[10px] uppercase tracking-widest transition-all ${
                        frequency === f.id ? "border-teal-500 text-teal-400 bg-teal-500/10" : "text-slate-500 hover:border-slate-600"
                      }`}
                      style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 3: Connect Exchange ─── */}
          {currentStep === 3 && (
            <div className="space-y-10 animate-slide-up">
              <div>
                <div className="text-[10px] text-teal-400 uppercase tracking-[0.3em] mb-4" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                  Step 04 / Exchange Link
                </div>
                <h1 className="text-4xl font-extrabold uppercase tracking-tighter" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                  Connect your trading account.
                </h1>
                <p className="text-slate-400 mt-4 text-sm">Read-only API access. We cannot execute trades on your behalf.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {["Binance", "Coinbase", "Kraken", "Bybit", "OKX", "Hyperliquid"].map((ex) => (
                  <button
                    key={ex}
                    className="p-6 glass-panel hover:border-teal-500 transition-all text-left group"
                  >
                    <div className="w-10 h-10 bg-slate-800 mb-4 flex items-center justify-center text-teal-400 font-bold text-xs" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                      {ex.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="font-bold text-sm text-white group-hover:text-teal-400 transition-colors" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                      {ex}
                    </div>
                  </button>
                ))}
              </div>

              <div className="glass-panel p-6 space-y-4">
                <div className="text-[10px] text-teal-400 uppercase tracking-widest" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                  Or manual API entry
                </div>
                <input type="text" placeholder="API Key (read-only)" className="tech-input" />
                <input type="text" placeholder="API Secret" className="tech-input" />
              </div>
            </div>
          )}

          {/* ─── Step 4: Confirm ─── */}
          {currentStep === 4 && (
            <div className="space-y-10 animate-slide-up">
              <div>
                <div className="text-[10px] text-teal-400 uppercase tracking-[0.3em] mb-4" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                  Step 05 / Activation
                </div>
                <h1 className="text-4xl font-extrabold uppercase tracking-tighter text-white" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                  You&apos;re ready,
                  <br />
                  <span className="text-teal-400">Agent.</span>
                </h1>
                <p className="text-slate-400 mt-4 text-sm leading-relaxed">
                  Confirm your trading impact agent configuration below. You can modify these settings anytime from your dashboard.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Donation Strategy", value: STRATEGIES.find((s) => s.id === donationStrategy)?.label ?? "N/A" },
                  { label: "Contribution Rate", value: `${donationAmount}%` },
                  { label: "Disbursement Frequency", value: FREQUENCY.find((f) => f.id === frequency)?.label ?? "N/A" },
                  {
                    label: "Linked Causes",
                    value: selectedCauses.length > 0
                      ? selectedCauses.map((id) => CAUSES.find((c) => c.id === id)?.label).join(", ")
                      : "None selected",
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="glass-panel p-5 flex justify-between items-center"
                  >
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                      {label}
                    </span>
                    <span className="text-sm font-bold text-teal-400 text-right max-w-[60%]" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between items-center pt-12 mt-12 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep((p) => Math.max(0, p - 1))}
              disabled={currentStep === 0}
              className="px-6 py-3 border border-slate-800 text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:border-slate-600 transition-all disabled:opacity-20"
              style={{ fontFamily: "var(--font-jetbrains), monospace" }}
            >
              Previous
            </button>

            {currentStep < totalSteps - 1 ? (
              <button
                onClick={() => setCurrentStep((p) => p + 1)}
                className="px-10 py-4 bg-teal-400 text-slate-950 font-bold uppercase tracking-widest text-[10px] hover:bg-lime-400 transition-colors"
                style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              >
                Next_Step →
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={completing}
                className="px-10 py-4 bg-lime-400 text-slate-950 font-bold uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-70 flex items-center gap-2"
                style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              >
                {completing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Initializing...
                  </>
                ) : (
                  "Launch Agent →"
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
