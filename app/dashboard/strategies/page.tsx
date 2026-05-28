import Link from "next/link"
import { STRATEGIES, DEMO_USERS, shortWallet } from "@/lib/demo-data"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

export default function StrategiesPage() {
  const me = DEMO_USERS[0]
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400">/dashboard/strategies</div>
          <h1 className="text-2xl font-bold">Copy-Trading Strategies</h1>
          <p style={mono} className="text-[11px] text-slate-500 mt-1">
            Subscribe to verified operator strategies. Each fill auto-allocates a donation slice to your chosen charity.
          </p>
        </div>
        <Link href="/dashboard/strategies/new" className="px-4 py-2 text-[10px] uppercase border border-teal-500/40 text-teal-300" style={mono}>
          + New Strategy
        </Link>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {STRATEGIES.map((s) => {
          const following = me.followingStrategies.includes(s.id)
          return (
            <div key={s.id} className={`glass-panel p-4 transition-colors ${s.trending ? "border-lime-400/40 glow-lime" : "hover:border-teal-500/40"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div style={mono} className="text-white text-lg">{s.name}</div>
                  <div style={mono} className="text-[10px] text-slate-500 uppercase">by {s.author} · {shortWallet(s.authorWallet)}</div>
                </div>
                {s.trending && (
                  <span className="px-2 py-0.5 text-[9px] bg-lime-400 text-slate-950 font-bold" style={mono}>HOT</span>
                )}
              </div>
              <p style={mono} className="text-[11px] text-slate-400 mt-3 leading-relaxed">{s.description}</p>

              <div className="grid grid-cols-3 gap-3 mt-4" style={mono}>
                <Stat label="Win" value={`${s.winRate}%`} color="lime" />
                <Stat label="PnL" value={`+${s.pnlPct}%`} color="teal" />
                <Stat label="Donate" value={`${s.donationRate}%`} color="lime" />
              </div>

              <div className="mt-4 flex items-center justify-between text-[10px] uppercase text-slate-500" style={mono}>
                <span>{s.followers.toLocaleString()} followers</span>
                <span>{s.trades24h} trades / 24h · {s.asset}</span>
              </div>

              <div className="mt-4 flex gap-2" style={mono}>
                {following ? (
                  <button className="flex-1 px-3 py-2 text-[10px] uppercase border border-teal-500 text-teal-300">
                    Following
                  </button>
                ) : (
                  <button className="flex-1 px-3 py-2 text-[10px] uppercase bg-teal-400 text-slate-950 font-bold hover:bg-lime-400">
                    Copy Strategy
                  </button>
                )}
                <Link href={`/dashboard/strategies/${s.id}`} className="px-3 py-2 text-[10px] uppercase border border-slate-700 text-slate-300 hover:border-teal-500/40">
                  Details
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: "teal" | "lime" }) {
  const c = color === "teal" ? "text-teal-300" : "text-lime-400"
  return (
    <div className="p-2 bg-slate-900/60 border border-slate-800">
      <div className="text-[9px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`${c} text-sm`}>{value}</div>
    </div>
  )
}
