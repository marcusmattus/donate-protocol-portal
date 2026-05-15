import { NavDark } from "@/components/nav-dark"
import Link from "next/link"

const strategies = [
  {
    name: "Momentum Alpha",
    author: "Marcus Solana",
    winRate: "73% WIN",
    pnl: "+18.4%",
    followers: "8,321",
    donationRate: "2.0% FIX",
    trending: false,
    accentColor: "teal",
    chartPath: "M0 20 L5 18 L10 19 L15 15 L20 16 L25 10 L30 14 L35 8 L40 10 L45 5 L50 9 L55 4 L60 8 L65 3 L70 6 L75 2 L80 4 L85 0 L90 2 L95 1 L100 0 V20 H0 Z",
  },
  {
    name: "Meme Rotator",
    author: "CryptoNova",
    winRate: "82% WIN",
    pnl: "+245.1%",
    followers: "18,932",
    donationRate: "3.0% PER PROFIT",
    trending: true,
    accentColor: "lime",
    chartPath: "M0 20 L10 15 L20 18 L30 10 L40 15 L50 5 L60 12 L70 0 L80 10 L90 2 L100 5 V20 H0 Z",
  },
  {
    name: "Whale Tracker",
    author: "Sarah Quant",
    winRate: "68% WIN",
    pnl: "+11.2%",
    followers: "5,231",
    donationRate: "1.0% FIX",
    trending: false,
    accentColor: "teal",
    chartPath: "M0 20 L10 18 L20 16 L30 14 L40 12 L50 10 L60 8 L70 6 L80 4 L90 2 L100 0 V20 H0 Z",
  },
]

const charities = [
  {
    name: "Solar Future Foundation",
    category: "Climate",
    raised: "$410,000",
    followers: "12,045",
    impact: "98",
    color: "lime",
  },
  {
    name: "Kids First DAO",
    category: "Children",
    raised: "$180,000",
    followers: "8,332",
    impact: "94",
    color: "teal",
  },
  {
    name: "Open Water Relief",
    category: "Humanitarian",
    raised: "$1.4M",
    followers: "25,101",
    impact: "99",
    color: "teal",
  },
]

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-50 terminal-grid">
      {/* Global scanline */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <div className="w-full h-[2px] bg-teal-500/10 animate-scanline opacity-20" />
      </div>

      <NavDark />

      <main className="flex-grow">
        {/* ─── Hero ─── */}
        <section className="relative pt-20 pb-32 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            {/* Left copy */}
            <div className="space-y-8 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[10px] uppercase tracking-widest" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                <span>Status: Stable Release v2.4.0</span>
              </div>

              <h1
                className="text-6xl md:text-8xl font-extrabold tracking-tighter leading-none uppercase"
                style={{ fontFamily: "var(--font-inter), sans-serif" }}
              >
                Trade{" "}
                <span className="text-teal-400" style={{ WebkitTextStroke: "1px #14b8a6" }}>
                  Smarter.
                </span>
                <br />
                Give{" "}
                <span className="text-lime-400 underline decoration-2 underline-offset-8">
                  Auto.
                </span>
              </h1>

              <p className="text-slate-400 text-lg max-w-lg leading-relaxed font-light">
                The agentic financial layer that converts trading alpha into real-world impact.
                Automate strategies, sync with groups, and distribute profits to global causes via
                ultra-fast Solana infrastructure.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href="/auth"
                  className="px-8 py-4 bg-teal-400 text-slate-950 font-bold uppercase tracking-widest hover:bg-lime-400 transition-colors transform hover:-translate-y-1 active:translate-y-0"
                  style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                >
                  Launch Terminal
                </Link>
                <Link
                  href="/waitlist"
                  className="px-8 py-4 border border-slate-700 font-bold uppercase tracking-widest hover:border-teal-500 transition-all glass-panel"
                  style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                >
                  Join Waitlist
                </Link>
              </div>

              {/* Terminal Stats */}
              <div
                className="grid grid-cols-3 gap-4 pt-12 border-t border-slate-800"
                style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              >
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-tighter">Total Volume</div>
                  <div className="text-xl text-white font-bold">$1.4B+</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-tighter">Impact Generated</div>
                  <div className="text-xl text-teal-400 font-bold">$12.8M</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-tighter">Active Agents</div>
                  <div className="text-xl text-white font-bold">48,201</div>
                </div>
              </div>
            </div>

            {/* Right visual: Agent Core terminal */}
            <div className="relative mt-12 lg:mt-0 group">
              <div className="absolute -inset-20 bg-teal-500/5 rounded-full blur-[120px] group-hover:bg-teal-500/10 transition-colors duration-1000" />

              <div className="relative glass-panel p-1 glow-teal">
                <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-teal-400" />
                <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-teal-400" />

                <div
                  className="bg-black p-4 leading-tight space-y-2"
                  style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px" }}
                >
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-4">
                    <span className="text-teal-400">[ SYSTEM_EX_AGENT_01 ]</span>
                    <span className="text-slate-600">LIVE_FEED</span>
                  </div>
                  <div className="text-slate-500">&gt;&gt;&gt; ANALYZING SIGNAL: SOL/USDT...</div>
                  <div className="text-teal-400">&gt;&gt;&gt; JUPITER_ROUTED: 50.00 SOL</div>
                  <div className="text-white">&gt;&gt;&gt; PROFIT ACHIEVED: +$412.20 (2.4%)</div>
                  <div className="text-lime-400 font-bold animate-pulse">
                    &gt;&gt;&gt; DONATION_TRIGGERED: 5% -&gt; SOLAR FUTURE DAO
                  </div>
                  <div className="text-slate-500">&gt;&gt;&gt; HASH: 5e6x...9k2n</div>
                  <div className="flex gap-1 mt-6 h-12 items-end">
                    {[40, 60, 100, 75, 50, 65, 45, 80, 55, 90].map((h, i) => (
                      <div
                        key={i}
                        className="w-1 bg-teal-400/60"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Float cards */}
              <div
                className="absolute -right-8 top-12 glass-panel p-3 max-w-[200px] animate-float"
                style={{ animationDuration: "4s", animationDelay: "0s" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-teal-400" />
                  <span className="text-[9px] uppercase text-slate-400" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                    Copy Trade Group
                  </span>
                </div>
                <div className="text-sm font-bold text-white">Alpha Whale V3</div>
                <div className="text-[10px] text-teal-400" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                  +82.4% APR
                </div>
              </div>

              <div
                className="absolute -left-12 -bottom-6 glass-panel p-3 max-w-[180px] animate-float"
                style={{ animationDuration: "6s", animationDelay: "-2s" }}
              >
                <span className="text-[9px] text-slate-400 uppercase" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                  Impact Verified
                </span>
                <div className="text-xs mt-1 text-white">2.4 Tons CO2 Removed</div>
                <div className="w-full h-1 bg-slate-800 mt-2">
                  <div className="w-full h-full bg-lime-400" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Impact Ticker ─── */}
        <div className="border-y border-teal-500/20 py-4 bg-teal-500/5 overflow-hidden">
          <div
            className="whitespace-nowrap animate-marquee flex gap-12 text-[10px] uppercase font-bold tracking-[0.2em] text-teal-500/80"
            style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          >
            {[1, 2].map((k) => (
              <span key={k} className="flex items-center gap-4 shrink-0">
                <span className="text-slate-500">RECENT IMPACT:</span>
                <span>
                  $422.00 TO RAINFOREST ALLIANCE • 0.2 SOL TO OPEN SOURCE GITHUB • $1,204 TO CLEAN WATER
                  FUND • 1,240 TREES PLANTED VIA UNISWAP-V4 SIGNAL • PROFIT-SHARE EXECUTED FOR EDUCATION CORP •
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* ─── Strategy Leaderboard ─── */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <div className="space-y-4">
              <h2
                className="text-3xl font-extrabold uppercase tracking-tighter"
                style={{ fontFamily: "var(--font-inter), sans-serif" }}
              >
                Leaderboard{" "}
                <span className="text-teal-400">Strategies</span>
              </h2>
              <p
                className="text-slate-500 text-sm tracking-tighter"
                style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              >
                Real-time performance tracking of verified protocol agents.
              </p>
            </div>
            <div className="flex gap-2" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
              {["24 Hours", "7 Days", "All Time"].map((label, i) => (
                <button
                  key={label}
                  className={`px-4 py-2 border text-[10px] uppercase glass-panel ${
                    i === 0
                      ? "border-teal-500 text-teal-400"
                      : "border-slate-800 text-slate-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {strategies.map((s) => (
              <div
                key={s.name}
                className={`glass-panel group overflow-hidden transition-all duration-500 relative ${
                  s.trending
                    ? "border-lime-400/30 scale-105 glow-lime"
                    : "hover:border-lime-400"
                }`}
              >
                {s.trending && (
                  <div
                    className="absolute top-0 right-0 px-3 py-1 bg-lime-400 text-slate-950 text-[9px] font-bold uppercase z-10"
                    style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                  >
                    Trending
                  </div>
                )}
                <div className="p-6 border-b border-slate-800 flex justify-between items-start">
                  <div>
                    <h3
                      className="text-xl font-bold tracking-tighter mb-1 text-white"
                      style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                    >
                      {s.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                      by {s.author}
                    </p>
                  </div>
                  <div
                    className={`px-2 py-1 text-[10px] border font-bold ${
                      s.accentColor === "lime"
                        ? "bg-lime-500/10 text-lime-400 border-lime-400/20"
                        : "bg-teal-500/10 text-teal-400 border-teal-500/20"
                    }`}
                    style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                  >
                    {s.winRate}
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  {[
                    { label: "PNL (MONTH)", value: s.pnl, accent: true },
                    { label: "FOLLOWERS", value: s.followers, accent: false },
                    { label: "DONATION RATE", value: s.donationRate, teal: true },
                  ].map(({ label, value, accent, teal }) => (
                    <div
                      key={label}
                      className="flex justify-between text-xs"
                      style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                    >
                      <span className="text-slate-400">{label}</span>
                      <span
                        className={`font-bold ${
                          accent
                            ? "text-lime-400"
                            : teal
                            ? "text-teal-400"
                            : "text-white"
                        }`}
                      >
                        {value}
                      </span>
                    </div>
                  ))}

                  {/* Mini chart */}
                  <div className="w-full h-[60px] bg-slate-900/50 relative overflow-hidden flex items-end">
                    <svg
                      className={`w-full h-full opacity-60 ${
                        s.accentColor === "lime" ? "text-lime-400" : "text-teal-400"
                      }`}
                      viewBox="0 0 100 20"
                      preserveAspectRatio="none"
                    >
                      <path d={s.chartPath} fill="currentColor" />
                    </svg>
                  </div>

                  <button
                    className={`w-full py-3 font-bold text-[10px] uppercase tracking-widest transition-all ${
                      s.trending
                        ? "bg-lime-400 text-slate-950 hover:brightness-110 shadow-lg shadow-lime-400/20"
                        : "bg-slate-900 border border-slate-800 group-hover:bg-teal-400 group-hover:text-slate-950"
                    }`}
                    style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                  >
                    Copy Strategy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Charity Marketplace Preview ─── */}
        <section className="py-24 px-6 border-t border-teal-500/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
              <div className="space-y-4">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 bg-lime-500/10 border border-lime-500/30 text-lime-400 text-[10px] uppercase tracking-widest"
                  style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                >
                  Verified Impact Destinations
                </div>
                <h2
                  className="text-3xl font-extrabold uppercase tracking-tighter"
                  style={{ fontFamily: "var(--font-inter), sans-serif" }}
                >
                  Charity <span className="text-lime-400">Marketplace</span>
                </h2>
              </div>
              <Link
                href="/waitlist"
                className="px-6 py-3 border border-teal-500 text-teal-400 text-[10px] uppercase font-bold tracking-widest glass-panel hover:bg-teal-500/10 transition-colors"
                style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              >
                Browse All Causes
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {charities.map((c) => (
                <div
                  key={c.name}
                  className={`glass-panel p-6 group hover:border-${c.color}-400 transition-all duration-300`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div
                      className={`px-2 py-1 text-[9px] uppercase font-bold border ${
                        c.color === "lime"
                          ? "bg-lime-500/10 text-lime-400 border-lime-400/20"
                          : "bg-teal-500/10 text-teal-400 border-teal-500/20"
                      }`}
                      style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                    >
                      {c.category}
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-lime-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[9px] text-lime-400 font-bold uppercase" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                        Verified
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                    {c.name}
                  </h3>

                  <div
                    className="space-y-3 mt-6 pt-4 border-t border-slate-800"
                    style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                  >
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500 uppercase">Total Raised</span>
                      <span className="text-white font-bold">{c.raised}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500 uppercase">Followers</span>
                      <span className="text-white font-bold">{c.followers}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500 uppercase">Impact Score</span>
                      <span className={`font-bold ${c.color === "lime" ? "text-lime-400" : "text-teal-400"}`}>
                        {c.impact}/100
                      </span>
                    </div>
                  </div>

                  <button
                    className={`w-full mt-6 py-3 text-[10px] uppercase font-bold tracking-widest border transition-all ${
                      c.color === "lime"
                        ? "border-lime-400 text-lime-400 hover:bg-lime-400 hover:text-slate-950"
                        : "border-teal-500 text-teal-400 hover:bg-teal-500 hover:text-slate-950"
                    }`}
                    style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                  >
                    Donate Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section className="py-32 px-6 border-t border-teal-500/10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[10px] uppercase tracking-widest mb-6"
                style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              >
                Protocol Flow
              </div>
              <h2
                className="text-4xl md:text-5xl font-extrabold uppercase tracking-tighter"
                style={{ fontFamily: "var(--font-inter), sans-serif" }}
              >
                Seamless impact,{" "}
                <span className="text-teal-400">no friction.</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: "01", title: "Connect Account", desc: "Securely link your exchange or wallet via read-only API keys or OAuth." },
                { step: "02", title: "Trade Normally", desc: "Execute your strategy exactly as you always do. We don't touch your liquidity." },
                { step: "03", title: "Auto-Donate", desc: "System deducts a tiny % from profits automatically on every win." },
                { step: "04", title: "Track Impact", desc: "See on-chain verified data from the lives you've improved on your dashboard." },
              ].map(({ step, title, desc }) => (
                <div
                  key={step}
                  className="glass-panel p-8 group hover:border-teal-400 transition-all duration-500 relative overflow-hidden"
                >
                  <span
                    className="absolute -right-4 -top-8 text-9xl font-extrabold opacity-5 text-teal-400 select-none"
                    style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                  >
                    {step}
                  </span>
                  <div className="relative z-10">
                    <div
                      className="text-[10px] text-teal-400 font-bold uppercase tracking-widest mb-4"
                      style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                    >
                      Phase_{step}
                    </div>
                    <h3
                      className="text-xl font-bold text-white mb-3"
                      style={{ fontFamily: "var(--font-inter), sans-serif" }}
                    >
                      {title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto text-center glass-panel p-12 md:p-20 glow-teal relative overflow-hidden">
            <div className="absolute inset-0 bg-teal-500/5 pointer-events-none" />
            <div className="relative z-10">
              <h2
                className="text-4xl md:text-5xl font-extrabold uppercase tracking-tighter text-white mb-6"
                style={{ fontFamily: "var(--font-inter), sans-serif" }}
              >
                Ready to trade with{" "}
                <span className="text-teal-400">intentionality?</span>
              </h2>
              <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
                Join the waitlist today and be among the first to prove that wealth and impact are not mutually exclusive.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/waitlist"
                  className="px-10 py-4 bg-teal-400 text-slate-950 font-bold uppercase tracking-widest hover:bg-lime-400 transition-colors"
                  style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                >
                  Get Early Access
                </Link>
                <Link
                  href="/partner"
                  className="px-10 py-4 border border-slate-700 text-slate-300 font-bold uppercase tracking-widest hover:border-teal-500 transition-colors glass-panel"
                  style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                >
                  Institutional Access
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-teal-500/10 bg-black/40 px-8 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span
              className="font-extrabold tracking-tighter text-lg uppercase italic text-white"
              style={{ fontFamily: "var(--font-jetbrains), monospace" }}
            >
              Donate<span className="text-teal-400">.Protocol</span>
            </span>
          </div>
          <div
            className="flex gap-8 text-[10px] uppercase tracking-widest text-slate-500"
            style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          >
            <Link href="/transparency" className="hover:text-teal-400 transition-colors">
              Security
            </Link>
            <Link href="/partner" className="hover:text-teal-400 transition-colors">
              Partners
            </Link>
            <Link href="/waitlist" className="hover:text-teal-400 transition-colors">
              Waitlist
            </Link>
          </div>
          <div
            className="text-[8px] uppercase text-slate-700 tracking-tighter"
            style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          >
            Donate Architecture // 32.882.11.002
          </div>
        </div>
      </footer>
    </div>
  )
}
