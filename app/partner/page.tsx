"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const PARTNER_TYPES = [
  { id: "institution", label: "Institution / Fund", desc: "Hedge funds, family offices, or investment firms" },
  { id: "charity", label: "Charity / NGO", desc: "Register your cause to receive automated donations" },
  { id: "integration", label: "Technical Integration", desc: "Exchanges, wallets, or DeFi protocols" },
  { id: "media", label: "Media / Community", desc: "Content creators, newsletters, or trading groups" },
]

export default function PartnerPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => router.push("/partner/confirmation"), 1800)
  }

  return (
    <div className="mesh-gradient text-slate-900 font-sans min-h-screen flex flex-col overflow-x-hidden">
      {/* Blobs */}
      <div className="fixed top-0 right-0 w-[700px] h-[700px] rounded-full blur-[150px] pointer-events-none" style={{ background: "rgba(79,70,229,0.06)" }} />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none" style={{ background: "rgba(20,184,166,0.04)" }} />

      {/* ─── Nav ─── */}
      <nav className="fixed top-0 w-full z-50 py-8">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl rotate-3 shadow-lg group-hover:rotate-0 transition-transform"
              style={{ backgroundColor: "#4f46e5" }}
            >
              D
            </div>
            <span style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }} className="font-bold text-2xl tracking-tight">
              Donate<span className="text-teal-500">.</span>
            </span>
          </Link>

          <div className="flex items-center gap-8">
            <Link href="/waitlist" className="hidden md:block text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors" style={{ fontFamily: "var(--font-outfit), sans-serif" }}>
              Waitlist
            </Link>
            <Link href="/auth" style={{ fontFamily: "var(--font-outfit), sans-serif" }} className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-lg">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-grow pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-16 items-start">

          {/* ─── Left: Hero ─── */}
          <div className="lg:col-span-5 lg:sticky lg:top-32 space-y-10">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-bold uppercase tracking-widest"
                style={{ background: "rgba(79,70,229,0.10)", color: "#4f46e5" }}>
                Institutional Tier Access
              </div>
              <h1 style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }} className="text-5xl md:text-7xl font-bold leading-[1] tracking-tighter">
                Build the future of
                <br />
                <span className="italic font-light text-teal-500">impact finance.</span>
              </h1>
            </div>

            <p className="text-xl text-slate-500 leading-relaxed max-w-lg">
              Whether you manage billions or run a passionate cause, the Donate Protocol infrastructure is designed to scale with your ambitions.
            </p>

            {/* Benefits */}
            <div className="space-y-6 pt-6 border-t border-slate-200">
              {[
                {
                  icon: "#4f46e5",
                  title: "Institutional-Grade API",
                  desc: "Sub-millisecond execution pipelines with full Solana MEV protection.",
                  svgPath: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
                },
                {
                  icon: "#14b8a6",
                  title: "Custom Matching Pools",
                  desc: "Create branded donation pools with configurable matching ratios.",
                  svgPath: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z",
                },
                {
                  icon: "#84cc16",
                  title: "On-Chain Transparency",
                  desc: "Every donation is publicly verifiable and auditable on Solana.",
                  svgPath: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                },
              ].map(({ icon, title, desc, svgPath }) => (
                <div key={title} className="flex items-start gap-5 group">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform" style={{ background: `${icon}15` }}>
                    <svg className="w-6 h-6" fill="none" stroke={icon} viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={svgPath} />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg leading-tight mb-1" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>{title}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mini trust badge row */}
            <div className="pt-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Current Partners Include</p>
              <div className="flex flex-wrap gap-4">
                {["Circle", "Orca", "Jupiter", "Mango Markets"].map((p) => (
                  <div key={p} className="px-4 py-2 rounded-xl border border-slate-200 bg-white/50 text-sm font-bold text-slate-500">
                    {p}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Right: Form ─── */}
          <div className="lg:col-span-7">
            <div className="glass-card p-8 md:p-12 rounded-[3.5rem] relative overflow-hidden">
              <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(79,70,229,0.06)" }} />

              <div className="relative z-10">
                <header className="mb-10">
                  <h3 style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }} className="text-3xl font-bold mb-2">
                    Apply for Partnership
                  </h3>
                  <p className="text-slate-500">
                    Complete this form to initiate a strategic partnership discussion. Our team responds within 24 hours.
                  </p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Partner type selection */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                      Partnership Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {PARTNER_TYPES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelected(t.id)}
                          className={`p-5 text-left rounded-2xl border transition-all ${
                            selected === t.id
                              ? "border-indigo-500 bg-indigo-50 shadow-sm"
                              : "border-slate-200 bg-white/50 hover:border-slate-300"
                          }`}
                        >
                          <div className={`text-sm font-bold mb-1 ${selected === t.id ? "text-indigo-700" : "text-slate-900"}`}>
                            {t.label}
                          </div>
                          <div className="text-xs text-slate-400 leading-snug">{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Contact Name</label>
                      <input type="text" required placeholder="Jane Smith" className="w-full px-6 py-4 rounded-2xl bg-white/60 border border-slate-200 outline-none input-focus-effect font-medium placeholder:text-slate-300 transition-all" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Organization</label>
                      <input type="text" required placeholder="AlphaFund Capital" className="w-full px-6 py-4 rounded-2xl bg-white/60 border border-slate-200 outline-none input-focus-effect font-medium placeholder:text-slate-300 transition-all" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Work Email</label>
                      <input type="email" required placeholder="jane@alphafund.com" className="w-full px-6 py-4 rounded-2xl bg-white/60 border border-slate-200 outline-none input-focus-effect font-medium placeholder:text-slate-300 transition-all" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">AUM (Optional)</label>
                      <input type="text" placeholder="$50M+" className="w-full px-6 py-4 rounded-2xl bg-white/60 border border-slate-200 outline-none input-focus-effect font-medium placeholder:text-slate-300 transition-all" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Website / Social</label>
                      <input type="url" placeholder="https://" className="w-full px-6 py-4 rounded-2xl bg-white/60 border border-slate-200 outline-none input-focus-effect font-medium placeholder:text-slate-300 transition-all" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Partnership Goals</label>
                      <textarea
                        rows={4}
                        required
                        placeholder="Describe how you envision working with Donate Protocol..."
                        className="w-full px-6 py-4 rounded-2xl bg-white/60 border border-slate-200 outline-none input-focus-effect font-medium placeholder:text-slate-300 transition-all resize-none leading-relaxed"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full text-white py-5 rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-70 flex items-center justify-center gap-3"
                    style={{ background: "#4f46e5" }}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Submitting Application...
                      </>
                    ) : (
                      "Submit Partnership Application"
                    )}
                  </button>

                  <p className="text-center text-xs text-slate-400">
                    All submitted information is encrypted and governed by our{" "}
                    <span className="text-indigo-600 cursor-pointer hover:underline">Privacy Policy</span>.
                  </p>
                </form>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-white/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Donate Protocol — Institutional Division
          </p>
          <div className="flex gap-6 text-xs font-bold text-slate-400">
            <Link href="/transparency" className="hover:text-indigo-600 transition-colors">Security Center</Link>
            <Link href="/" className="hover:text-indigo-600 transition-colors">Platform</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
