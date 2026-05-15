"use client"

import Link from "next/link"

const TIMELINE = [
  { step: "01", title: "Application Review", desc: "Our BD team reviews your profile. 12-24 hours." },
  { step: "02", title: "Technical Discovery", desc: "We schedule a 30-min call to scope your integration." },
  { step: "03", title: "API Access Grant", desc: "Test environment credentials issued. Build and test." },
  { step: "04", title: "Mainnet Launch", desc: "Your integration goes live with full monitoring." },
]

export default function PartnerConfirmation() {
  return (
    <div className="mesh-gradient text-slate-900 font-sans min-h-screen flex flex-col">
      {/* Blobs */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[120px] pointer-events-none" style={{ background: "rgba(79,70,229,0.06)" }} />

      {/* ─── Nav ─── */}
      <nav className="fixed top-0 w-full z-50 py-8">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl rotate-3 shadow-lg"
              style={{ backgroundColor: "#4f46e5" }}
            >
              D
            </div>
            <span style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }} className="font-bold text-2xl tracking-tight">
              Donate<span className="text-teal-500">.</span>
            </span>
          </Link>
          <Link href="/" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors" style={{ fontFamily: "var(--font-outfit), sans-serif" }}>
            ← Home
          </Link>
        </div>
      </nav>

      <main className="flex-grow pt-40 pb-20 px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-20">

          {/* Hero */}
          <div className="animate-slide-up space-y-8">
            <div
              className="w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto text-white shadow-2xl"
              style={{ background: "linear-gradient(135deg, #4f46e5, #14b8a6)" }}
            >
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-bold uppercase tracking-widest"
                style={{ background: "rgba(79,70,229,0.10)", color: "#4f46e5" }}>
                Application Received
              </div>
              <h1 style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }} className="text-6xl md:text-8xl font-bold leading-[1] tracking-tighter mb-6">
                Partnership{" "}
                <br />
                <span className="italic font-light" style={{ color: "#4f46e5" }}>Initiated.</span>
              </h1>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Your application has been received and queued for review by our Business Development team. We look forward to building the future of impact finance together.
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="grid md:grid-cols-4 gap-6 text-left">
            {TIMELINE.map(({ step, title, desc }, i) => (
              <div
                key={step}
                className="glass-card p-8 rounded-[2rem] relative overflow-hidden group hover:shadow-xl transition-all"
              >
                <div
                  className="absolute top-4 right-4 text-6xl font-extrabold opacity-[0.04] select-none"
                  style={{ fontFamily: "var(--font-space-grotesk), sans-serif", color: "#4f46e5" }}
                >
                  {step}
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-6 text-white font-bold text-sm"
                  style={{
                    background: i === 0 ? "#4f46e5" : i === 1 ? "#14b8a6" : i === 2 ? "#84cc16" : "#0f172a",
                    fontFamily: "var(--font-space-grotesk), sans-serif"
                  }}
                >
                  {step}
                </div>
                <h4 className="font-bold text-lg mb-2" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                  {title}
                </h4>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* CTA block */}
          <div className="glass-card p-12 rounded-[3rem] max-w-2xl mx-auto">
            <h3 style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }} className="text-3xl font-bold mb-4">
              While you wait...
            </h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Explore our public documentation, developer guides, and existing API specs to prepare for your integration discovery call.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/transparency"
                className="px-8 py-4 rounded-2xl text-white font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
                style={{ background: "#4f46e5" }}
              >
                Security Center
              </Link>
              <Link
                href="/"
                className="px-8 py-4 rounded-2xl font-bold border border-slate-200 bg-white/50 hover:border-indigo-300 transition-all"
              >
                Explore Platform
              </Link>
            </div>
          </div>

          {/* Expected response time */}
          <div className="flex items-center justify-center gap-3">
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: "#14b8a6" }} />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Expected first response: within 24 hours
            </p>
          </div>

        </div>
      </main>

      <footer className="py-12 border-t border-slate-100 bg-white/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            © 2025 Donate Protocol — Partnerships
          </p>
          <Link href="/transparency" className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">
            Security Center
          </Link>
        </div>
      </footer>
    </div>
  )
}
