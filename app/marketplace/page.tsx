"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { NavDark } from "@/components/nav-dark"
import { CATEGORY_META, CHARITIES, CharityCategory, formatUSD, shortWallet } from "@/lib/demo-data"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

const CATEGORIES: ("all" | CharityCategory)[] = [
  "all",
  "climate",
  "education",
  "healthcare",
  "children",
  "food",
  "disaster",
  "publicgoods",
  "animal",
  "humanitarian",
]

export default function MarketplacePage() {
  const [cat, setCat] = useState<"all" | CharityCategory>("all")
  const [q, setQ] = useState("")

  const filtered = useMemo(() => {
    return CHARITIES.filter((c) => (cat === "all" || c.category === cat) &&
      (q.trim() === "" || c.name.toLowerCase().includes(q.toLowerCase()) || c.mission.toLowerCase().includes(q.toLowerCase()))
    )
  }, [cat, q])

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 terminal-grid">
      <NavDark />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="space-y-3">
          <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400">
            /marketplace · {CHARITIES.length} verified destinations
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold uppercase tracking-tighter">
            Charity <span className="text-teal-400">Marketplace</span>
          </h1>
          <p className="text-slate-400 max-w-2xl">
            Plug-in destinations for automated profit-sharing. Every charity is verified, has an on-chain wallet, and publishes its impact score.
          </p>
        </header>

        <div className="mt-8 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <input
            placeholder="Search charities, missions, regions…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 px-4 py-2.5 text-sm"
            style={mono}
          />
          <Link
            href="/partner"
            className="px-4 py-2.5 text-[10px] uppercase tracking-widest bg-teal-400 text-slate-950 font-bold text-center hover:bg-lime-400"
            style={mono}
          >
            Apply To List
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2" style={mono}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-1.5 text-[10px] uppercase border ${
                cat === c
                  ? "bg-teal-500/10 border-teal-500 text-teal-300"
                  : "border-slate-800 text-slate-400 hover:border-teal-500/40"
              }`}
            >
              {c === "all" ? "All Categories" : CATEGORY_META[c].label}
            </button>
          ))}
        </div>

        <section className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c) => {
            const meta = CATEGORY_META[c.category]
            const color = meta.color === "lime" ? "lime" : "teal"
            return (
              <Link
                key={c.id}
                href={`/marketplace/${c.id}`}
                className="glass-panel p-5 group hover:border-teal-500/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{c.name}</h3>
                      {c.verified && (
                        <span className="text-teal-400 text-xs" title="Verified">✓</span>
                      )}
                    </div>
                    <div style={mono} className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
                      {meta.label} · {c.country}
                    </div>
                  </div>
                  <div className={`px-2 py-1 text-[10px] border ${color === "lime" ? "bg-lime-500/10 border-lime-400/30 text-lime-300" : "bg-teal-500/10 border-teal-400/30 text-teal-300"}`} style={mono}>
                    {c.impactScore}
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-400 line-clamp-3 leading-relaxed">{c.mission}</p>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center" style={mono}>
                  <Cell label="Raised" value={formatUSD(c.raised)} color={color} />
                  <Cell label="Followers" value={c.followers.toLocaleString()} color={color} />
                  <Cell label="Donations" value={c.donationsCount.toLocaleString()} color={color} />
                </div>
                <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500" style={mono}>
                  <span>{shortWallet(c.wallet)}</span>
                  <span className="text-teal-400 group-hover:translate-x-1 transition-transform">View →</span>
                </div>
              </Link>
            )
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-slate-500" style={mono}>
              No charities match those filters.
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function Cell({ label, value, color }: { label: string; value: string; color: "teal" | "lime" }) {
  const c = color === "teal" ? "text-teal-300" : "text-lime-300"
  return (
    <div className="p-2 bg-slate-900/60 border border-slate-800">
      <div className={`${c} text-sm font-bold`}>{value}</div>
      <div className="text-[9px] uppercase tracking-widest text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}
