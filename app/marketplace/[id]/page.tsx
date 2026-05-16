import Link from "next/link"
import { notFound } from "next/navigation"
import { NavDark } from "@/components/nav-dark"
import { CATEGORY_META, CHARITIES, DONATIONS, formatUSD, shortWallet, timeAgo } from "@/lib/demo-data"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

export async function generateStaticParams() {
  return CHARITIES.map((c) => ({ id: c.id }))
}

export default async function CharityProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const charity = CHARITIES.find((c) => c.id === id)
  if (!charity) notFound()
  const meta = CATEGORY_META[charity.category]
  const donations = DONATIONS.filter((d) => d.toCharityId === charity.id)

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 terminal-grid">
      <NavDark />
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div style={mono} className="text-[10px] uppercase tracking-widest text-slate-500">
          <Link href="/marketplace" className="hover:text-teal-300">/marketplace</Link> · {charity.id}
        </div>

        <header className="glass-panel p-6 grid lg:grid-cols-[1fr_320px] gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter">{charity.name}</h1>
              {charity.verified && <span className="px-2 py-0.5 text-[10px] uppercase border border-teal-400/40 text-teal-300" style={mono}>Verified</span>}
            </div>
            <div style={mono} className="text-[11px] uppercase tracking-widest text-slate-500 mt-1">
              {meta.label} · {charity.country} · {charity.website.replace(/^https?:\/\//, "")}
            </div>
            <p className="mt-4 text-slate-300 leading-relaxed">{charity.mission}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6" style={mono}>
              <Cell label="Raised" value={formatUSD(charity.raised)} color="lime" />
              <Cell label="Donations" value={charity.donationsCount.toLocaleString()} color="teal" />
              <Cell label="Followers" value={charity.followers.toLocaleString()} color="teal" />
              <Cell label="Impact Score" value={String(charity.impactScore)} color="lime" />
            </div>
          </div>

          <aside className="space-y-3" style={mono}>
            <div className="p-3 bg-black/40 border border-slate-800">
              <div className="text-[10px] uppercase tracking-widest text-slate-500">On-Chain Wallet</div>
              <div className="text-[12px] text-teal-300 break-all mt-1">{charity.wallet}</div>
              <div className="text-[10px] text-slate-500 mt-1">{shortWallet(charity.wallet)} · Solana Devnet</div>
            </div>
            <button className="w-full px-4 py-3 bg-teal-400 text-slate-950 font-bold uppercase text-[11px] hover:bg-lime-400">
              Donate
            </button>
            <button className="w-full px-4 py-3 border border-teal-500/40 text-teal-300 uppercase text-[11px] hover:bg-teal-500/10">
              Follow
            </button>
            <button className="w-full px-4 py-3 border border-slate-700 text-slate-300 uppercase text-[11px] hover:border-teal-500/40">
              Set As Default Destination
            </button>
            <button className="w-full px-4 py-3 border border-slate-700 text-slate-300 uppercase text-[11px] hover:border-teal-500/40">
              Add To Portfolio
            </button>
          </aside>
        </header>

        <section className="grid lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 glass-panel p-5">
            <div style={mono} className="text-[11px] uppercase tracking-widest text-slate-300 border-b border-slate-800 pb-2">Donation History</div>
            <table className="w-full text-sm mt-3" style={mono}>
              <thead className="text-[10px] uppercase text-slate-500 tracking-widest">
                <tr>
                  <th className="text-left py-2">When</th>
                  <th className="text-left py-2">From</th>
                  <th className="text-right py-2">Amount</th>
                  <th className="text-left py-2">Tx</th>
                </tr>
              </thead>
              <tbody>
                {donations.length === 0 ? (
                  <tr><td colSpan={4} className="py-6 text-center text-slate-500">No donations yet — be the first.</td></tr>
                ) : donations.map((d) => (
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
          <div className="glass-panel p-5">
            <div style={mono} className="text-[11px] uppercase tracking-widest text-slate-300 border-b border-slate-800 pb-2">Social</div>
            <ul style={mono} className="mt-3 space-y-2 text-sm">
              {charity.socialLinks.twitter && <li className="text-slate-300">𝕏 <span className="text-teal-300">{charity.socialLinks.twitter}</span></li>}
              {charity.socialLinks.telegram && <li className="text-slate-300">TG <span className="text-teal-300">@{charity.socialLinks.telegram}</span></li>}
              {charity.socialLinks.discord && <li className="text-slate-300">Discord <span className="text-teal-300">{charity.socialLinks.discord}</span></li>}
              {!charity.socialLinks.twitter && !charity.socialLinks.telegram && !charity.socialLinks.discord && (
                <li className="text-slate-500 text-xs">No socials listed.</li>
              )}
            </ul>
            <div style={mono} className="text-[11px] uppercase tracking-widest text-slate-300 border-b border-slate-800 pb-2 mt-6">Recent Activity</div>
            <ul style={mono} className="mt-3 space-y-2 text-xs">
              {charity.recentDonations.length === 0 && <li className="text-slate-500">Quiet for now.</li>}
              {charity.recentDonations.map((d, i) => (
                <li key={i} className="flex justify-between">
                  <span className="text-slate-400">{d.from}</span>
                  <span className="text-lime-300">+${d.amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  )
}

function Cell({ label, value, color }: { label: string; value: string; color: "teal" | "lime" }) {
  const c = color === "teal" ? "text-teal-300" : "text-lime-300"
  return (
    <div className="p-3 bg-slate-900/60 border border-slate-800">
      <div className={`${c} text-xl font-bold`}>{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{label}</div>
    </div>
  )
}
