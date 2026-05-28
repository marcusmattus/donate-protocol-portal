import { DEMO_USERS, STRATEGIES, CHARITIES, formatUSD, shortWallet } from "@/lib/demo-data"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

export default function LeaderboardPage() {
  const traders = [...DEMO_USERS].sort((a, b) => b.pnl - a.pnl)
  const strategies = [...STRATEGIES].sort((a, b) => b.followers - a.followers)
  const charities = [...CHARITIES].sort((a, b) => b.raised - a.raised)
  return (
    <div className="space-y-6">
      <header>
        <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400">/dashboard/leaderboard</div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p style={mono} className="text-[11px] text-slate-500 mt-1">
          Top traders, strategies, and charities — by P&L, followers, and impact volume.
        </p>
      </header>

      <section className="grid lg:grid-cols-3 gap-3">
        <Board title="Top Traders" rows={traders.map((u, i) => ({
          rank: i + 1, primary: u.name, secondary: shortWallet(u.wallet), value: `+${formatUSD(u.pnl)}`, sub: `${formatUSD(u.donations)} donated`,
        }))} />
        <Board title="Top Strategies" rows={strategies.map((s, i) => ({
          rank: i + 1, primary: s.name, secondary: `by ${s.author}`, value: `+${s.pnlPct}%`, sub: `${s.followers.toLocaleString()} followers`,
        }))} />
        <Board title="Top Charities" rows={charities.slice(0, 8).map((c, i) => ({
          rank: i + 1, primary: c.name, secondary: c.country, value: formatUSD(c.raised), sub: `${c.followers.toLocaleString()} followers`,
        }))} />
      </section>
    </div>
  )
}

function Board({ title, rows }: { title: string; rows: { rank: number; primary: string; secondary: string; value: string; sub: string }[] }) {
  return (
    <div className="glass-panel p-4">
      <div style={mono} className="text-[11px] uppercase tracking-widest text-slate-300 border-b border-slate-800 pb-2">{title}</div>
      <div className="mt-3 space-y-2">
        {rows.map((r) => (
          <div key={r.rank} className="flex items-center justify-between text-sm" style={mono}>
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-7 h-7 grid place-items-center text-[10px] border border-teal-500/30 text-teal-300">{r.rank}</span>
              <div className="min-w-0">
                <div className="text-white truncate">{r.primary}</div>
                <div className="text-[10px] text-slate-500 uppercase truncate">{r.secondary}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lime-400">{r.value}</div>
              <div className="text-[10px] text-slate-500">{r.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
