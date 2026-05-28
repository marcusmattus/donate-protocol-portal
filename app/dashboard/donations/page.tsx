import Link from "next/link"
import { CHARITIES, DONATIONS, formatUSD, timeAgo } from "@/lib/demo-data"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

export default function DonationsPage() {
  const totalAll = DONATIONS.reduce((a, d) => a + d.amount, 0)
  const byCharity = new Map<string, number>()
  for (const d of DONATIONS) byCharity.set(d.toCharityId, (byCharity.get(d.toCharityId) ?? 0) + d.amount)
  const sorted = [...byCharity.entries()].sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-6">
      <header>
        <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400">/dashboard/donations</div>
        <h1 className="text-2xl font-bold">Donation Impact</h1>
        <p style={mono} className="text-[11px] text-slate-500 mt-1">
          Every settled trade routes a slice of profit to a charity wallet via the Donation Vault program.
        </p>
      </header>

      <section className="grid sm:grid-cols-3 gap-3">
        <Kpi label="Total Routed" value={formatUSD(totalAll)} color="lime" />
        <Kpi label="Charities Funded" value={String(byCharity.size)} color="teal" />
        <Kpi label="Settled Events" value={String(DONATIONS.length)} color="teal" />
      </section>

      <section className="glass-panel p-4">
        <div style={mono} className="text-[11px] uppercase tracking-widest text-slate-300 border-b border-slate-800 pb-2">
          Allocation by Charity
        </div>
        <div className="mt-3 space-y-3">
          {sorted.map(([id, amt]) => {
            const c = CHARITIES.find((x) => x.id === id)
            if (!c) return null
            const pct = (amt / totalAll) * 100
            return (
              <Link key={id} href={`/marketplace/${id}`} className="block">
                <div className="flex items-center justify-between text-sm" style={mono}>
                  <span className="text-white">{c.name}</span>
                  <span className="text-teal-300">{formatUSD(amt)} · {pct.toFixed(1)}%</span>
                </div>
                <div className="h-1 mt-1 bg-slate-800">
                  <div className="h-full bg-gradient-to-r from-teal-400 to-lime-400" style={{ width: `${pct}%` }} />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="glass-panel p-4">
        <div style={mono} className="text-[11px] uppercase tracking-widest text-slate-300 border-b border-slate-800 pb-2">
          On-Chain Donation Log
        </div>
        <table className="w-full text-sm mt-3" style={mono}>
          <thead className="text-[10px] uppercase text-slate-500 tracking-widest">
            <tr>
              <th className="text-left py-2">When</th>
              <th className="text-left py-2">From</th>
              <th className="text-left py-2">Charity</th>
              <th className="text-right py-2">Amount</th>
              <th className="text-left py-2">Tx</th>
            </tr>
          </thead>
          <tbody>
            {DONATIONS.map((d) => (
              <tr key={d.id} className="border-t border-slate-800/60">
                <td className="py-3 text-slate-400 text-[11px]">{timeAgo(d.ts)}</td>
                <td className="py-3 text-slate-300">{d.fromUser}</td>
                <td className="py-3 text-white">{d.toCharity}</td>
                <td className="py-3 text-right text-lime-300">${d.amount.toFixed(2)}</td>
                <td className="py-3 text-[11px] text-teal-300">{d.txSignature.slice(0, 10)}…{d.txSignature.slice(-6)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function Kpi({ label, value, color }: { label: string; value: string; color: "teal" | "lime" }) {
  const c = color === "teal" ? "text-teal-300" : "text-lime-400"
  return (
    <div className="glass-panel p-4">
      <div style={mono} className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${c}`} style={mono}>{value}</div>
    </div>
  )
}
