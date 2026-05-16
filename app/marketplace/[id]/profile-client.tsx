"use client"

import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { DonateModal } from "@/components/donate-modal"
import { useWallet } from "@/components/wallet-context"
import {
  CATEGORY_META,
  Charity,
  DonationEvent,
  formatUSD,
  shortWallet,
  timeAgo,
} from "@/lib/demo-data"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

type Tab = "mission" | "donations" | "impact" | "about"

export function CharityProfileClient({
  charity,
  donations,
  related,
}: {
  charity: Charity
  donations: DonationEvent[]
  related: Charity[]
}) {
  const { wallet } = useWallet()
  const [tab, setTab] = useState<Tab>("mission")
  const [donateOpen, setDonateOpen] = useState(false)
  const [following, setFollowing] = useState(false)
  const meta = CATEGORY_META[charity.category]

  function copyWallet() {
    navigator.clipboard?.writeText(charity.wallet).then(
      () => toast.success("Wallet copied to clipboard"),
      () => toast.error("Clipboard unavailable"),
    )
  }

  function share() {
    const url = typeof window !== "undefined" ? window.location.href : ""
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      ;(navigator as any).share({ title: charity.name, text: charity.mission, url }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(url).then(
        () => toast.success("Link copied"),
        () => toast.error("Could not copy link"),
      )
    }
  }

  function openDonate() {
    if (!wallet) {
      toast.message("Connect a wallet to donate", {
        description: "We'll route the donation directly to the charity's Solana wallet.",
        action: { label: "Connect", onClick: () => (window.location.href = "/connect") },
      })
      return
    }
    setDonateOpen(true)
  }

  function setAsDefault() {
    toast.success(`${charity.name} set as default destination`)
  }

  return (
    <main className="flex-1 max-w-6xl mx-auto px-6 py-10 space-y-8 w-full">
      <nav style={mono} className="text-[10px] uppercase tracking-widest text-slate-500">
        <Link href="/marketplace" className="hover:text-teal-300">/marketplace</Link> · {charity.id}
      </nav>

      {/* Hero */}
      <header className="glass-panel relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(20,184,166,0.10)" }} />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(132,204,22,0.06)" }} />
        <div className="relative p-6 grid lg:grid-cols-[1fr_320px] gap-8">
          <div>
            <div className="flex items-center gap-2 flex-wrap" style={mono}>
              <span className="px-2 py-0.5 text-[10px] uppercase border border-teal-400/40 text-teal-300">{meta.label}</span>
              {charity.verified && <span className="px-2 py-0.5 text-[10px] uppercase border border-lime-400/40 text-lime-300">Verified</span>}
              <span className="text-[10px] uppercase tracking-widest text-slate-500">{charity.country}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tighter mt-3">{charity.name}</h1>
            <p className="mt-4 text-slate-300 leading-relaxed max-w-2xl">{charity.mission}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6" style={mono}>
              <Stat label="Raised" value={formatUSD(charity.raised)} color="lime" />
              <Stat label="Donations" value={charity.donationsCount.toLocaleString()} color="teal" />
              <Stat label="Followers" value={charity.followers.toLocaleString()} color="teal" />
              <Stat label="Impact Score" value={String(charity.impactScore)} color="lime" />
            </div>
          </div>

          <aside className="space-y-3" style={mono}>
            <div className="p-3 bg-black/40 border border-slate-800">
              <div className="text-[10px] uppercase tracking-widest text-slate-500">On-chain wallet</div>
              <div className="text-[11px] text-teal-300 break-all mt-1">{charity.wallet}</div>
              <button onClick={copyWallet} className="mt-2 text-[10px] uppercase tracking-widest text-slate-400 hover:text-teal-300">
                Copy · {shortWallet(charity.wallet)}
              </button>
            </div>

            <button onClick={openDonate} className="w-full px-4 py-3 bg-teal-400 text-slate-950 font-bold uppercase text-[11px] hover:bg-lime-400">
              Donate Now
            </button>
            <button
              onClick={() => { setFollowing((f) => !f); toast.success(following ? "Unfollowed" : `Following ${charity.name}`) }}
              aria-pressed={following}
              className={`w-full px-4 py-3 uppercase text-[11px] border ${following ? "bg-teal-500/10 border-teal-500 text-teal-300" : "border-teal-500/40 text-teal-300 hover:bg-teal-500/10"}`}
            >
              {following ? "Following" : "Follow"}
            </button>
            <button onClick={setAsDefault} className="w-full px-4 py-3 border border-slate-700 text-slate-300 uppercase text-[11px] hover:border-teal-500/40">
              Set as Default Destination
            </button>
            <button onClick={share} className="w-full px-4 py-3 border border-slate-700 text-slate-300 uppercase text-[11px] hover:border-teal-500/40">
              Share
            </button>
          </aside>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800" style={mono} role="tablist">
        {([
          { key: "mission", label: "Mission" },
          { key: "donations", label: `Donations · ${donations.length}` },
          { key: "impact", label: "Impact" },
          { key: "about", label: "About" },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-[11px] uppercase tracking-widest border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? "text-teal-300 border-teal-400"
                : "text-slate-400 hover:text-teal-300 border-transparent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "mission" && (
        <section className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 glass-panel p-6 space-y-4">
            <h2 className="text-xl font-bold">Our mission</h2>
            <p className="text-slate-300 leading-relaxed">{charity.mission}</p>
            <p className="text-slate-400 text-sm leading-relaxed">
              {charity.name} operates as a verified destination on Donate Protocol. Funds are received via SPL token transfers
              on Solana, immediately auditable via the on-chain donation log. {charity.verified ? "Verified" : "Unverified"} status
              is reflected on the public registry, and impact score is reported by independent attestation oracles.
            </p>
            <div className="grid sm:grid-cols-3 gap-2 pt-2" style={mono}>
              <Stat label="Verified" value={charity.verified ? "Yes" : "No"} color="lime" />
              <Stat label="Country" value={charity.country} color="teal" />
              <Stat label="Category" value={meta.label} color="teal" />
            </div>
          </div>
          <div className="glass-panel p-5 space-y-4">
            <div style={mono} className="text-[11px] uppercase tracking-widest text-slate-300 border-b border-slate-800 pb-2">Social</div>
            <ul style={mono} className="space-y-2 text-sm">
              {charity.socialLinks.twitter && <li className="text-slate-300">𝕏 <span className="text-teal-300">{charity.socialLinks.twitter}</span></li>}
              {charity.socialLinks.telegram && <li className="text-slate-300">TG <span className="text-teal-300">@{charity.socialLinks.telegram}</span></li>}
              {charity.socialLinks.discord && <li className="text-slate-300">Discord <span className="text-teal-300">{charity.socialLinks.discord}</span></li>}
              {!charity.socialLinks.twitter && !charity.socialLinks.telegram && !charity.socialLinks.discord && (
                <li className="text-slate-500 text-xs">No socials listed.</li>
              )}
            </ul>
            <div style={mono} className="text-[11px] uppercase tracking-widest text-slate-300 border-b border-slate-800 pb-2 mt-6">Website</div>
            <a href={charity.website} target="_blank" rel="noreferrer" className="text-sm text-teal-300 hover:text-lime-400 break-all">
              {charity.website.replace(/^https?:\/\//, "")}
            </a>
          </div>
        </section>
      )}

      {tab === "donations" && (
        <section className="glass-panel p-5">
          <table className="w-full text-sm" style={mono}>
            <thead className="text-[10px] uppercase text-slate-500 tracking-widest">
              <tr>
                <th className="text-left py-2">When</th>
                <th className="text-left py-2">From</th>
                <th className="text-right py-2">Amount</th>
                <th className="text-left py-2">Tx</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {donations.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-slate-500">No donations yet — be the first.</td></tr>
              ) : donations.map((d) => (
                <tr key={d.id} className="border-t border-slate-800/60">
                  <td className="py-3 text-slate-400 text-[11px]">{timeAgo(d.ts)}</td>
                  <td className="py-3 text-slate-300">{d.fromUser}</td>
                  <td className="py-3 text-right text-lime-300">${d.amount.toFixed(2)}</td>
                  <td className="py-3 text-[11px] text-teal-300">
                    <a target="_blank" rel="noreferrer" href={`https://explorer.solana.com/tx/${d.txSignature}?cluster=devnet`} className="hover:text-lime-400">
                      {d.txSignature.slice(0, 10)}…{d.txSignature.slice(-6)}
                    </a>
                  </td>
                  <td className="py-3 text-[10px] uppercase">
                    <span className="px-2 py-0.5 border border-lime-400/40 text-lime-300">{d.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === "impact" && (
        <section className="grid md:grid-cols-2 gap-4">
          <div className="glass-panel p-6">
            <div style={mono} className="text-[11px] uppercase tracking-widest text-slate-300 border-b border-slate-800 pb-2">Cumulative Volume (Demo)</div>
            <div className="flex items-end gap-1 h-32 mt-5">
              {[14, 22, 30, 45, 38, 55, 60, 72, 84, 78, 95, 110, 102, 130].map((h, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-teal-500/40 to-lime-400/80" style={{ height: `${(h / 130) * 100}%` }} />
              ))}
            </div>
            <div style={mono} className="flex items-center justify-between mt-3 text-[10px] uppercase tracking-widest text-slate-500">
              <span>Last 14 weeks</span>
              <span className="text-lime-400">+18.4% MoM</span>
            </div>
          </div>
          <div className="glass-panel p-6 space-y-3">
            <div style={mono} className="text-[11px] uppercase tracking-widest text-slate-300 border-b border-slate-800 pb-2">Recent Activity</div>
            <ul className="space-y-2">
              {charity.recentDonations.length === 0 && <li className="text-slate-500 text-sm">Quiet for now.</li>}
              {charity.recentDonations.map((d, i) => (
                <li key={i} className="flex items-center justify-between text-sm" style={mono}>
                  <div>
                    <div className="text-slate-200">{d.from}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{timeAgo(d.ts)}</div>
                  </div>
                  <div className="text-lime-300">+${d.amount.toFixed(2)}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {tab === "about" && (
        <section className="grid md:grid-cols-3 gap-4" style={mono}>
          <InfoCard label="Organization" value={charity.name} />
          <InfoCard label="Country" value={charity.country} />
          <InfoCard label="Category" value={meta.label} />
          <InfoCard label="Verified" value={charity.verified ? "Yes" : "Pending"} />
          <InfoCard label="Wallet" value={charity.wallet} mono />
          <InfoCard label="Website" value={charity.website} />
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="space-y-3">
          <div style={mono} className="text-[10px] uppercase tracking-widest text-slate-400">Similar charities</div>
          <div className="grid sm:grid-cols-3 gap-4">
            {related.map((c) => (
              <Link key={c.id} href={`/marketplace/${c.id}`} className="glass-panel p-4 hover:border-teal-500/40">
                <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400">{CATEGORY_META[c.category].label}</div>
                <div className="text-lg font-bold text-white mt-1">{c.name}</div>
                <div style={mono} className="text-[11px] text-slate-400 mt-1">{formatUSD(c.raised)} raised · impact {c.impactScore}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <DonateModal charity={charity} open={donateOpen} onClose={() => setDonateOpen(false)} />
    </main>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: "teal" | "lime" }) {
  const c = color === "teal" ? "text-teal-300" : "text-lime-300"
  return (
    <div className="p-3 bg-slate-900/60 border border-slate-800">
      <div className={`${c} text-xl font-bold`}>{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{label}</div>
    </div>
  )
}

function InfoCard({ label, value, mono: m }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="glass-panel p-4">
      <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`text-sm text-slate-200 mt-1 ${m ? "break-all text-teal-300" : ""}`}>{value}</div>
    </div>
  )
}
