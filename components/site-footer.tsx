import Link from "next/link"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

const COLS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Protocol",
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/dashboard/strategies", label: "Strategies" },
      { href: "/dashboard/signals", label: "Signals" },
      { href: "/dashboard/leaderboard", label: "Leaderboard" },
    ],
  },
  {
    title: "Marketplace",
    links: [
      { href: "/marketplace", label: "Browse Charities" },
      { href: "/marketplace?category=climate", label: "Climate" },
      { href: "/marketplace?category=children", label: "Children" },
      { href: "/marketplace?category=healthcare", label: "Healthcare" },
    ],
  },
  {
    title: "Organizations",
    links: [
      { href: "/onboard", label: "Onboard Charity" },
      { href: "/partner", label: "Partners" },
      { href: "/transparency", label: "Security" },
      { href: "/dashboard/donations", label: "Impact Reports" },
    ],
  },
  {
    title: "Developer",
    links: [
      { href: "/api/charities", label: "Charities API" },
      { href: "/api/strategies", label: "Strategies API" },
      { href: "/api/signals", label: "Signals API" },
      { href: "https://github.com/marcusmattus/donate-protocol-portal", label: "GitHub" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-teal-500/20 bg-[#020617]">
      <div className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-[1.4fr_repeat(4,1fr)] gap-10">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7">
              <svg viewBox="0 0 40 40" className="w-full h-full text-teal-400 fill-current">
                <path d="M20 2c-9.9 0-18 8.1-18 18s8.1 18 18 18 18-8.1 18-18-8.1-18-18-18zm0 32c-7.7 0-14-6.3-14-14s6.3-14 14-14 14 6.3 14 14-6.3 14-14 14z" />
                <path d="M26 14h-12v2h12v-2zm0 4h-12v2h12v-2zm0 4h-12v2h12v-2z" />
              </svg>
            </div>
            <span style={mono} className="font-extrabold tracking-tighter text-lg uppercase italic text-white">
              Donate<span className="text-teal-400">.Protocol</span>
            </span>
          </div>
          <p className="mt-4 text-sm text-slate-400 max-w-sm leading-relaxed">
            A Solana-native protocol that transforms trading activity into continuous impact. Open-source, on-chain, verifiable.
          </p>
          <div style={mono} className="mt-5 inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
            All systems operational
          </div>
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400 mb-3">{col.title}</div>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-400 hover:text-teal-300 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3" style={mono}>
          <div className="text-[10px] uppercase tracking-widest text-slate-500">
            © {new Date().getFullYear()} Donate Protocol · Solana Devnet Demo · No financial advice
          </div>
          <div className="flex items-center gap-5 text-[10px] uppercase tracking-widest text-slate-500">
            <Link href="/transparency" className="hover:text-teal-300">Security</Link>
            <Link href="/partner" className="hover:text-teal-300">Partners</Link>
            <Link href="/onboard" className="hover:text-teal-300">For Charities</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
