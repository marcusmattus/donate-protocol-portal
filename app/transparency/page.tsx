import { NavDark } from "@/components/nav-dark"
import Link from "next/link"

const AUDIT_TXNS = [
  { hash: "5e6x...9k2n", type: "Donation", amount: "$412.20", cause: "Solar Future", block: "277,412,102", status: "Confirmed" },
  { hash: "9s2m...7r4p", type: "Donation", amount: "$88.00", cause: "Kids First DAO", block: "277,412,011", status: "Confirmed" },
  { hash: "4a1n...3f8t", type: "Donation", amount: "$2,200.00", cause: "Open Water Relief", block: "277,411,920", status: "Confirmed" },
  { hash: "7q8w...5h3l", type: "Donation", amount: "$55.10", cause: "Rainforest Alliance", block: "277,411,855", status: "Confirmed" },
  { hash: "2j9k...1d6z", type: "Donation", amount: "$1,104.00", cause: "Global Literacy Fund", block: "277,411,800", status: "Confirmed" },
]

const SEC_PILLARS = [
  {
    title: "Non-Custodial Architecture",
    desc: "We never hold your private keys. All connections are read-only API or delegated signing — you retain 100% asset ownership at all times.",
    svgPath: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",
    accentColor: "#14b8a6",
  },
  {
    title: "On-Chain Verification",
    desc: "Every donation transaction is published to Solana mainnet. Any third-party auditor can verify fund routing without trusting us.",
    svgPath: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    accentColor: "#84cc16",
  },
  {
    title: "Zero-Knowledge Privacy",
    desc: "Trading signals and strategy logic are processed locally or with ZK proofs. We see results, not positions.",
    svgPath: "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z",
    accentColor: "#4f46e5",
  },
  {
    title: "Smart Contract Audits",
    desc: "All donation routing contracts are audited by Sec3 and Halborn. Source code is fully open and verifiable on GitHub.",
    svgPath: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    accentColor: "#14b8a6",
  },
]

const STATS = [
  { label: "Total Donated", value: "$12.8M", sub: "On-chain, verifiable" },
  { label: "Unique Beneficiaries", value: "240,000+", sub: "Lives touched" },
  { label: "Contracts Audited", value: "4 / 4", sub: "100% coverage" },
  { label: "Protocol Uptime", value: "99.94%", sub: "30-day rolling" },
]

export default function TransparencyPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 terminal-grid flex flex-col">
      {/* Scanline */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <div className="w-full h-[2px] bg-teal-500/5 animate-scanline" />
      </div>

      <NavDark />

      <main className="flex-grow">
        {/* ─── Hero ─── */}
        <section className="relative pt-16 pb-24 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto text-center space-y-6">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[10px] uppercase tracking-widest"
              style={{ fontFamily: "var(--font-jetbrains), monospace" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Mainnet — All Systems Operational
            </div>
            <h1
              className="text-5xl md:text-8xl font-extrabold uppercase tracking-tighter text-white"
              style={{ fontFamily: "var(--font-inter), sans-serif" }}
            >
              Radical{" "}
              <span className="text-teal-400">Transparency.</span>
              <br />
              Proven Security.
            </h1>
            <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">
              Every dollar, every hash. The Donate Protocol is built on the premise that trust must be earned through verifiability, not promises.
            </p>
          </div>

          {/* Stats grid */}
          <div className="max-w-5xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map(({ label, value, sub }) => (
              <div key={label} className="glass-panel p-6 text-center">
                <div className="text-3xl font-extrabold text-teal-400 mb-1" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                  {value}
                </div>
                <div className="text-xs font-bold uppercase text-white mb-1" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                  {label}
                </div>
                <div className="text-[10px] text-slate-500 uppercase" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                  {sub}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Security Pillars ─── */}
        <section className="py-24 px-6 border-t border-teal-500/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-16">
              <h2
                className="text-3xl font-extrabold uppercase tracking-tighter"
                style={{ fontFamily: "var(--font-inter), sans-serif" }}
              >
                Security{" "}
                <span className="text-lime-400">Architecture</span>
              </h2>
              <div
                className="text-[10px] text-slate-500 uppercase tracking-widest border border-slate-800 px-4 py-2 glass-panel"
                style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              >
                Audited By: Sec3 + Halborn
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {SEC_PILLARS.map(({ title, desc, svgPath, accentColor }) => (
                <div key={title} className="glass-panel p-8 group hover:border-teal-400 transition-all duration-300">
                  <div className="flex items-start gap-6">
                    <div
                      className="w-14 h-14 flex items-center justify-center shrink-0 border group-hover:scale-110 transition-transform"
                      style={{ borderColor: `${accentColor}33`, background: `${accentColor}10` }}
                    >
                      <svg className="w-7 h-7" fill="none" stroke={accentColor} viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={svgPath} />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                        {title}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Live Audit Feed ─── */}
        <section className="py-24 px-6 border-t border-teal-500/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div>
                <h2
                  className="text-3xl font-extrabold uppercase tracking-tighter"
                  style={{ fontFamily: "var(--font-inter), sans-serif" }}
                >
                  Live Donation{" "}
                  <span className="text-teal-400">Ledger</span>
                </h2>
                <p className="text-slate-500 text-sm mt-2" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                  Every on-chain transaction from the past 24h.
                </p>
              </div>
              <div
                className="flex items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[10px] uppercase"
                style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              >
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                Live Feed — Auto-Refresh 15s
              </div>
            </div>

            <div className="border border-teal-500/20 overflow-hidden">
              {/* Table header */}
              <div
                className="grid grid-cols-6 gap-4 px-6 py-4 bg-slate-900/80 border-b border-slate-800 text-[9px] uppercase tracking-widest text-slate-500"
                style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              >
                <span>Tx Hash</span>
                <span>Type</span>
                <span>Amount</span>
                <span>Cause</span>
                <span>Block #</span>
                <span className="text-right">Status</span>
              </div>

              {AUDIT_TXNS.map((tx) => (
                <div
                  key={tx.hash}
                  className="grid grid-cols-6 gap-4 px-6 py-5 border-b border-slate-800/50 hover:bg-teal-500/5 transition-colors group"
                >
                  <span
                    className="text-teal-400 text-[11px] font-bold group-hover:underline cursor-pointer"
                    style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                  >
                    {tx.hash}
                  </span>
                  <span
                    className="text-slate-400 text-[11px] uppercase tracking-widest"
                    style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                  >
                    {tx.type}
                  </span>
                  <span
                    className="text-lime-400 font-bold text-[11px]"
                    style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                  >
                    {tx.amount}
                  </span>
                  <span
                    className="text-white text-[11px]"
                    style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                  >
                    {tx.cause}
                  </span>
                  <span
                    className="text-slate-500 text-[11px]"
                    style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                  >
                    #{tx.block}
                  </span>
                  <span className="text-right">
                    <span
                      className="px-2 py-1 bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[9px] uppercase tracking-widest"
                      style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                    >
                      {tx.status}
                    </span>
                  </span>
                </div>
              ))}

              {/* Footer row */}
              <div
                className="px-6 py-4 bg-slate-900/50 text-[10px] text-slate-500 uppercase tracking-widest flex justify-between"
                style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              >
                <span>Showing most recent 5 of 2,481,402 total transactions</span>
                <Link
                  href="https://explorer.solana.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-400 hover:underline"
                >
                  View On Solana Explorer →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── System Status ─── */}
        <section className="py-24 px-6 border-t border-teal-500/10">
          <div className="max-w-7xl mx-auto">
            <h2
              className="text-3xl font-extrabold uppercase tracking-tighter mb-16"
              style={{ fontFamily: "var(--font-inter), sans-serif" }}
            >
              System <span className="text-teal-400">Health</span>
            </h2>

            <div className="space-y-4">
              {[
                { name: "Donation Router", uptime: 99.98, status: "nominal" },
                { name: "Strategy Sync API", uptime: 99.91, status: "nominal" },
                { name: "Jupiter DEX Integration", uptime: 99.80, status: "nominal" },
                { name: "Charity Verification Oracle", uptime: 100, status: "nominal" },
                { name: "Real-time Dashboard WS", uptime: 99.93, status: "nominal" },
              ].map(({ name, uptime, status }) => (
                <div key={name} className="glass-panel p-5 flex items-center gap-6">
                  <div className="w-3 h-3 rounded-full shrink-0 bg-teal-400 animate-pulse" />
                  <div
                    className="flex-grow font-bold text-sm text-white"
                    style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                  >
                    {name}
                  </div>

                  {/* Uptime bar */}
                  <div className="hidden md:flex items-center gap-4 flex-grow max-w-xs">
                    <div className="flex-grow h-2 bg-slate-800">
                      <div
                        className="h-full bg-teal-400"
                        style={{ width: `${uptime}%` }}
                      />
                    </div>
                    <span
                      className="text-[10px] text-teal-400 font-bold w-12 text-right"
                      style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                    >
                      {uptime}%
                    </span>
                  </div>

                  <span
                    className="px-2 py-1 border border-teal-500/20 bg-teal-500/10 text-teal-400 text-[9px] uppercase tracking-widest shrink-0"
                    style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                  >
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-teal-500/10 bg-black/40 px-8 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <span
            className="font-extrabold tracking-tighter text-lg uppercase italic text-white"
            style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          >
            Donate<span className="text-teal-400">.Protocol</span>
          </span>
          <div
            className="flex gap-8 text-[10px] uppercase tracking-widest text-slate-500"
            style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          >
            <Link href="/" className="hover:text-teal-400 transition-colors">Platform</Link>
            <Link href="/partner" className="hover:text-teal-400 transition-colors">Partners</Link>
            <Link href="/waitlist" className="hover:text-teal-400 transition-colors">Waitlist</Link>
          </div>
          <span
            className="text-[8px] uppercase text-slate-700 tracking-tighter"
            style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          >
            Build: 2025.06.2 // Sec3 Audit #4421
          </span>
        </div>
      </footer>
    </div>
  )
}
