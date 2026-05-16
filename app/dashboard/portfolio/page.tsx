import { DEMO_USERS, RECENT_SIGNALS, DONATIONS, formatUSD, shortWallet } from "@/lib/demo-data"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

const HOLDINGS = [
  { symbol: "SOL", balance: 142.3, value: 25_960.42, change24h: 4.1 },
  { symbol: "USDC", balance: 8_120.0, value: 8_120.0, change24h: 0 },
  { symbol: "JTO", balance: 1_204, value: 4_106.44, change24h: -2.3 },
  { symbol: "BONK", balance: 18_400_000, value: 410.8, change24h: 12.4 },
  { symbol: "JUP", balance: 920, value: 1_104.0, change24h: 1.2 },
]

export default function PortfolioPage() {
  const me = DEMO_USERS[0]
  const total = HOLDINGS.reduce((a, h) => a + h.value, 0)
  const totalDonated = DONATIONS.filter((d) => d.fromUser === me.name).reduce((a, d) => a + d.amount, 0)
  return (
    <div className="space-y-6">
      <header>
        <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400">/dashboard/portfolio</div>
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <p style={mono} className="text-[11px] text-slate-500 mt-1">
          Devnet wallet {shortWallet(me.wallet)} — SPL balances, simulated P&L, and donation receipts.
        </p>
      </header>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Portfolio Value" value={formatUSD(total)} color="teal" />
        <KpiCard label="Realized PnL" value={`+${formatUSD(me.pnl)}`} color="lime" />
        <KpiCard label="Auto-Donated" value={formatUSD(totalDonated)} color="teal" />
        <KpiCard label="Open Trades" value={String(RECENT_SIGNALS.filter((s) => s.status !== "complete").length)} color="lime" />
      </section>

      <section className="glass-panel p-4">
        <div style={mono} className="text-[11px] uppercase tracking-widest text-slate-300 border-b border-slate-800 pb-2">
          SPL Token Holdings
        </div>
        <table className="w-full text-sm mt-3" style={mono}>
          <thead className="text-[10px] uppercase text-slate-500 tracking-widest">
            <tr>
              <th className="text-left py-2">Asset</th>
              <th className="text-right py-2">Balance</th>
              <th className="text-right py-2">USD Value</th>
              <th className="text-right py-2">24h %</th>
            </tr>
          </thead>
          <tbody>
            {HOLDINGS.map((h) => (
              <tr key={h.symbol} className="border-t border-slate-800/60">
                <td className="py-3 text-white">{h.symbol}</td>
                <td className="py-3 text-right text-slate-300">{h.balance.toLocaleString()}</td>
                <td className="py-3 text-right text-slate-300">{formatUSD(h.value)}</td>
                <td className={`py-3 text-right ${h.change24h >= 0 ? "text-lime-400" : "text-rose-400"}`}>
                  {h.change24h >= 0 ? "+" : ""}
                  {h.change24h.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid lg:grid-cols-2 gap-3">
        <div className="glass-panel p-4">
          <div style={mono} className="text-[11px] uppercase tracking-widest text-slate-300 border-b border-slate-800 pb-2">
            Recent Trades
          </div>
          <div className="mt-3 divide-y divide-slate-800/60">
            {RECENT_SIGNALS.map((s) => (
              <div key={s.id} className="py-2 flex items-center justify-between text-sm" style={mono}>
                <div>
                  <div className="text-white">{s.symbol} <span className="text-slate-500">·</span> {s.side}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{s.strategy}</div>
                </div>
                <div className={`text-right ${typeof s.pnl === "number" && s.pnl >= 0 ? "text-lime-300" : "text-rose-400"}`}>
                  {typeof s.pnl === "number" ? `${s.pnl >= 0 ? "+" : ""}$${s.pnl.toFixed(2)}` : "pending"}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-panel p-4">
          <div style={mono} className="text-[11px] uppercase tracking-widest text-slate-300 border-b border-slate-800 pb-2">
            Donation Receipts
          </div>
          <div className="mt-3 divide-y divide-slate-800/60">
            {DONATIONS.filter((d) => d.fromUser === me.name).map((d) => (
              <div key={d.id} className="py-2 text-sm" style={mono}>
                <div className="flex justify-between">
                  <div className="text-white">${d.amount.toFixed(2)} → {d.toCharity}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{d.status}</div>
                </div>
                <div className="text-[10px] text-slate-500">tx {d.txSignature.slice(0, 8)}…{d.txSignature.slice(-6)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function KpiCard({ label, value, color }: { label: string; value: string; color: "teal" | "lime" }) {
  const c = color === "teal" ? "text-teal-300" : "text-lime-400"
  return (
    <div className="glass-panel p-4">
      <div style={mono} className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${c}`} style={mono}>{value}</div>
    </div>
  )
}
