import Link from "next/link"
import { CHARITIES, DONATIONS, formatUSD, timeAgo } from "@/lib/demo-data"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

export default function OnboardDonationDashboard() {
  const c = CHARITIES[0]
  const donations = DONATIONS.filter((d) => d.toCharityId === c.id)
  const total = donations.reduce((a, d) => a + d.amount, 0)
  return (
    <div className="space-y-6">
      <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400">/onboard · step 07</div>
      <h1 className="text-3xl font-extrabold">{c.name} · Donation Dashboard</h1>

      <div className="grid sm:grid-cols-3 gap-3" style={mono}>
        <Kpi label="Available to Withdraw" value={formatUSD(total)} color="lime" />
        <Kpi label="All-Time Raised" value={formatUSD(c.raised)} color="teal" />
        <Kpi label="Donor Followers" value={c.followers.toLocaleString()} color="teal" />
      </div>

      <div className="glass-panel p-5">
        <div style={mono} className="text-[11px] uppercase tracking-widest text-slate-300 border-b border-slate-800 pb-2 flex justify-between">
          <span>Recent Donations</span>
          <button className="px-3 py-1 text-[10px] bg-teal-400 text-slate-950 font-bold uppercase">Withdraw to Wallet</button>
        </div>
        <table className="w-full text-sm mt-3" style={mono}>
          <thead className="text-[10px] uppercase text-slate-500 tracking-widest">
            <tr>
              <th className="text-left py-2">When</th>
              <th className="text-left py-2">Donor</th>
              <th className="text-right py-2">Amount</th>
              <th className="text-left py-2">Tx</th>
            </tr>
          </thead>
          <tbody>
            {donations.map((d) => (
              <tr key={d.id} className="border-t border-slate-800/60">
                <td className="py-3 text-slate-400 text-[11px]">{timeAgo(d.ts)}</td>
                <td className="py-3 text-slate-300">{d.fromUser}</td>
                <td className="py-3 text-right text-lime-300">${d.amount.toFixed(2)}</td>
                <td className="py-3 text-[11px] text-teal-300">{d.txSignature.slice(0, 10)}…{d.txSignature.slice(-6)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between">
        <Link href="/onboard/analytics" className="px-4 py-2 text-[10px] uppercase border border-slate-700 text-slate-400" style={mono}>← Back</Link>
        <Link href="/marketplace" className="px-5 py-2 bg-lime-400 text-slate-950 font-bold uppercase text-[11px]" style={mono}>View Public Listing →</Link>
      </div>
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
