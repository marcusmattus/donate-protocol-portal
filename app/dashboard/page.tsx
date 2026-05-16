import Link from "next/link"
import {
  CHARITIES,
  DEMO_USERS,
  DONATIONS,
  RECENT_SIGNALS,
  STRATEGIES,
  formatUSD,
  shortWallet,
  timeAgo,
} from "@/lib/demo-data"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

export default function DashboardOverview() {
  const me = DEMO_USERS[0]
  const myStrategies = STRATEGIES.filter((s) => me.followingStrategies.includes(s.id))
  const totalDonated = DONATIONS.filter((d) => d.fromUser === me.name).reduce((a, d) => a + d.amount, 0)
  const pendingSignals = RECENT_SIGNALS.filter((s) => s.status !== "complete").length
  return (
    <div className="space-y-6">
      {/* Greeting / status header */}
      <header className="glass-panel p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400">
            Session OK · Devnet · Helius RPC
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            Welcome back, <span className="text-teal-300">{me.name}</span>
          </h1>
          <div style={mono} className="text-[11px] text-slate-500 mt-1">
            Wallet {shortWallet(me.wallet)} · Default charity: {CHARITIES.find((c) => c.id === me.defaultCharityId)?.name}
          </div>
        </div>
        <div className="flex flex-wrap gap-2" style={mono}>
          <Link href="/connect" className="px-3 py-2 text-[10px] uppercase border border-teal-500/40 text-teal-300 hover:bg-teal-500/10">
            Re-Connect Wallet
          </Link>
          <Link href="/connect/tradingview" className="px-3 py-2 text-[10px] uppercase border border-slate-700 text-slate-300 hover:border-teal-500/60">
            TradingView
          </Link>
          <Link href="/connect/openclaw" className="px-3 py-2 text-[10px] uppercase border border-slate-700 text-slate-300 hover:border-teal-500/60">
            OpenClaw
          </Link>
        </div>
      </header>

      {/* KPI grid */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Realized PnL (30d)" value={`+${formatUSD(me.pnl)}`} color="lime" sub="+18.4% vs prev" />
        <Kpi label="Auto Donations" value={formatUSD(totalDonated)} color="teal" sub={`${DONATIONS.filter((d)=>d.fromUser===me.name).length} events`} />
        <Kpi label="Active Strategies" value={String(myStrategies.length)} color="teal" sub="2 copying, 0 owned" />
        <Kpi label="Signals In-Flight" value={String(pendingSignals)} color="lime" sub="OpenClaw routing" />
      </section>

      {/* Live signal feed + agent terminal */}
      <section className="grid lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 glass-panel p-4">
          <Header title="Live Signal Feed" right={<Link href="/dashboard/signals" className="text-[10px] uppercase text-teal-400" style={mono}>View all →</Link>} />
          <div className="mt-3 divide-y divide-slate-800/70">
            {RECENT_SIGNALS.map((s) => (
              <div key={s.id} className="py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${s.side === "BUY" ? "bg-lime-400" : "bg-rose-400"}`} />
                  <div>
                    <div style={mono} className="text-white">{s.symbol} <span className="text-slate-500">·</span> {s.side}</div>
                    <div style={mono} className="text-[10px] text-slate-500">{s.strategy} · {timeAgo(s.ts)} · {s.source}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div style={mono} className={`text-sm ${typeof s.pnl === "number" ? (s.pnl >= 0 ? "text-lime-300" : "text-rose-400") : "text-slate-400"}`}>
                    {typeof s.pnl === "number" ? `${s.pnl >= 0 ? "+" : ""}${s.pnl.toFixed(2)}` : "—"}
                  </div>
                  <div style={mono} className="text-[10px] text-slate-500 uppercase">{s.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-panel p-4">
          <Header title="Agent Terminal" right={<span className="text-[10px] uppercase text-lime-400 animate-pulse" style={mono}>LIVE</span>} />
          <div className="mt-3 bg-black p-3 text-[11px] leading-relaxed" style={mono}>
            <div className="text-teal-400">[ openclaw://agent_01 ]</div>
            <div className="text-slate-500">&gt;&gt; signal queued: SOLUSDT BUY @181.20</div>
            <div className="text-slate-500">&gt;&gt; risk_score=87 ok</div>
            <div className="text-teal-300">&gt;&gt; jupiter_route: Orca → Raydium</div>
            <div className="text-white">&gt;&gt; fill: 50.00 SOL · pnl=+$144.30</div>
            <div className="text-lime-400 animate-pulse">&gt;&gt; donation: $4.32 → Solar Future Foundation</div>
            <div className="text-slate-500">&gt;&gt; tx: 5e6x…9k2n</div>
            <div className="flex gap-1 mt-3 h-10 items-end">
              {[50, 70, 110, 80, 60, 75, 55, 90, 65, 100].map((h, i) => (
                <div key={i} className="w-1 bg-teal-400/60" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Strategies + Top charities */}
      <section className="grid lg:grid-cols-2 gap-3">
        <div className="glass-panel p-4">
          <Header title="My Strategies" right={<Link href="/dashboard/strategies" className="text-[10px] uppercase text-teal-400" style={mono}>Manage →</Link>} />
          <div className="mt-3 space-y-2">
            {myStrategies.map((s) => (
              <div key={s.id} className="p-3 border border-slate-800 hover:border-teal-500/40 transition-colors flex items-center justify-between">
                <div>
                  <div style={mono} className="text-white">{s.name}</div>
                  <div style={mono} className="text-[10px] text-slate-500 uppercase">by {s.author} · {s.asset}</div>
                </div>
                <div className="text-right" style={mono}>
                  <div className="text-lime-400 text-sm">+{s.pnlPct}%</div>
                  <div className="text-[10px] text-slate-500">{s.followers.toLocaleString()} followers</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-panel p-4">
          <Header title="Routed Charities (24h)" right={<Link href="/marketplace" className="text-[10px] uppercase text-teal-400" style={mono}>Explore →</Link>} />
          <div className="mt-3 space-y-2">
            {CHARITIES.slice(0, 4).map((c) => (
              <Link key={c.id} href={`/marketplace/${c.id}`} className="p-3 border border-slate-800 hover:border-lime-400/40 flex items-center justify-between">
                <div>
                  <div style={mono} className="text-white">{c.name} {c.verified && <span className="text-teal-400">✓</span>}</div>
                  <div style={mono} className="text-[10px] text-slate-500 uppercase">{c.category} · {c.country}</div>
                </div>
                <div className="text-right" style={mono}>
                  <div className="text-lime-400 text-sm">{formatUSD(c.raised)}</div>
                  <div className="text-[10px] text-slate-500">impact {c.impactScore}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function Kpi({ label, value, sub, color }: { label: string; value: string; sub?: string; color: "teal" | "lime" }) {
  const c = color === "teal" ? "text-teal-300" : "text-lime-400"
  return (
    <div className="glass-panel p-4">
      <div style={mono} className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${c}`} style={mono}>{value}</div>
      {sub && <div style={mono} className="text-[10px] text-slate-500 mt-1">{sub}</div>}
    </div>
  )
}

function Header({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
      <div style={mono} className="text-[11px] uppercase tracking-widest text-slate-300">{title}</div>
      {right}
    </div>
  )
}
