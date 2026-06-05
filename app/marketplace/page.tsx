"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { NavDark } from "@/components/nav-dark"
import { SiteFooter } from "@/components/site-footer"
import { DonateModal } from "@/components/donate-modal"
import { useWallet } from "@/components/wallet-context"
import {
  CATEGORY_META,
  CHARITIES,
  Charity,
  CharityCategory,
  formatUSD,
  shortWallet,
} from "@/lib/demo-data"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

type SortKey = "trending" | "raised" | "followers" | "impact" | "recent"
type Filter = "all" | CharityCategory

const CATEGORIES: Filter[] = [
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

const SORTS: { key: SortKey; label: string }[] = [
  { key: "trending", label: "Trending" },
  { key: "raised", label: "Total Raised" },
  { key: "followers", label: "Followers" },
  { key: "impact", label: "Impact Score" },
  { key: "recent", label: "Recently Active" },
]

export default function MarketplacePage() {
  const { wallet } = useWallet()
  const [cat, setCat] = useState<Filter>("all")
  const [q, setQ] = useState("")
  const [debounced, setDebounced] = useState("")
  const [sort, setSort] = useState<SortKey>("trending")
  const [onlyVerified, setOnlyVerified] = useState(false)
  const [donateTarget, setDonateTarget] = useState<Charity | null>(null)
  const [following, setFollowing] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim().toLowerCase()), 220)
    return () => clearTimeout(t)
  }, [q])

  // Read ?category= once on mount
  useEffect(() => {
    if (typeof window === "undefined") return
    const sp = new URLSearchParams(window.location.search)
    const c = sp.get("category")
    if (c && CATEGORIES.includes(c as Filter)) setCat(c as Filter)
  }, [])

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: CHARITIES.length }
    for (const c of CHARITIES) m[c.category] = (m[c.category] ?? 0) + 1
    return m
  }, [])

  const filtered = useMemo(() => {
    const arr = CHARITIES.filter((c) => {
      if (cat !== "all" && c.category !== cat) return false
      if (onlyVerified && !c.verified) return false
      if (debounced) {
        const hay = `${c.name} ${c.mission} ${c.country} ${c.category}`.toLowerCase()
        if (!hay.includes(debounced)) return false
      }
      return true
    })
    arr.sort((a, b) => {
      switch (sort) {
        case "raised":
          return b.raised - a.raised
        case "followers":
          return b.followers - a.followers
        case "impact":
          return b.impactScore - a.impactScore
        case "recent": {
          const aTs = a.recentDonations[0]?.ts ?? 0
          const bTs = b.recentDonations[0]?.ts ?? 0
          return bTs - aTs
        }
        case "trending":
        default: {
          // composite trending score: impact + log(followers) + recent activity
          const score = (c: Charity) =>
            c.impactScore + Math.log10(c.followers + 1) * 5 +
            (c.recentDonations[0] ? 8 : 0) + (c.verified ? 5 : 0)
          return score(b) - score(a)
        }
      }
    })
    return arr
  }, [cat, onlyVerified, debounced, sort])

  const featured = useMemo(() => {
    const verified = CHARITIES.filter((c) => c.verified)
    return [...verified].sort((a, b) => b.impactScore - a.impactScore).slice(0, 3)
  }, [])

  function copyWallet(c: Charity) {
    navigator.clipboard?.writeText(c.wallet).then(
      () => toast.success(`Copied ${c.name}'s wallet`),
      () => toast.error("Clipboard unavailable"),
    )
  }

  function toggleFollow(c: Charity) {
    setFollowing((f) => {
      const next = { ...f, [c.id]: !f[c.id] }
      toast.success(next[c.id] ? `Following ${c.name}` : `Unfollowed ${c.name}`)
      return next
    })
  }

  function openDonate(c: Charity) {
    if (!wallet) {
      toast.message("Connect a wallet to donate", {
        description: "We'll route the donation directly to the charity's Solana wallet.",
        action: { label: "Connect", onClick: () => (window.location.href = "/connect") },
      })
      return
    }
    setDonateTarget(c)
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 terminal-grid flex flex-col">
      <NavDark />
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        <header className="grid lg:grid-cols-[1fr_auto] gap-6 items-end">
          <div>
            <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400">
              /marketplace · {CHARITIES.length} verified destinations · live data
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold uppercase tracking-tighter mt-2">
              Charity <span className="text-teal-400">Marketplace</span>
            </h1>
            <p className="text-slate-400 max-w-2xl mt-3">
              Plug-in destinations for automated profit-sharing. Every charity is verified, has an
              on-chain wallet, and publishes its impact score.
            </p>
          </div>
          <div className="flex flex-wrap gap-3" style={mono}>
            <Link href="/onboard" className="px-4 py-2.5 text-[10px] uppercase tracking-widest border border-teal-500/40 text-teal-300 hover:bg-teal-500/10">
              List Your Charity
            </Link>
            <Link href="/dashboard/donations" className="px-4 py-2.5 text-[10px] uppercase tracking-widest bg-teal-400 text-slate-950 font-bold hover:bg-lime-400">
              My Impact
            </Link>
          </div>
        </header>

        {/* Featured rail */}
        {cat === "all" && !debounced && (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-3" style={mono}>
              <div className="text-[10px] uppercase tracking-widest text-slate-400">Featured · Top impact this month</div>
              <div className="text-[10px] uppercase tracking-widest text-lime-400 animate-pulse">● Live</div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {featured.map((c) => (
                <FeaturedCard
                  key={c.id}
                  c={c}
                  following={!!following[c.id]}
                  onDonate={() => openDonate(c)}
                  onFollow={() => toggleFollow(c)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Layout: sticky filter sidebar + grid */}
        <section className="grid lg:grid-cols-[240px_1fr] gap-6 mt-10">
          <aside className="lg:sticky lg:top-20 self-start glass-panel p-4 space-y-5" style={mono}>
            <div>
              <label htmlFor="q" className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2">Search</label>
              <input
                id="q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Mission, region, name…"
                className="w-full bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Sort By</div>
              <div className="grid grid-cols-1 gap-1">
                {SORTS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSort(s.key)}
                    className={`text-left px-2 py-1.5 text-[11px] uppercase border-l-2 transition-colors ${
                      sort === s.key
                        ? "bg-teal-500/10 text-teal-300 border-teal-400"
                        : "text-slate-400 hover:text-teal-300 hover:bg-slate-900/60 border-transparent"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Categories</div>
              <div className="space-y-1">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className={`flex w-full items-center justify-between px-2 py-1.5 text-[11px] uppercase border-l-2 transition-colors ${
                      cat === c
                        ? "bg-teal-500/10 text-teal-300 border-teal-400"
                        : "text-slate-400 hover:text-teal-300 hover:bg-slate-900/60 border-transparent"
                    }`}
                  >
                    <span>{c === "all" ? "All" : CATEGORY_META[c as CharityCategory].label}</span>
                    <span className="text-[10px] text-slate-500">{counts[c] ?? 0}</span>
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-2 border-t border-slate-800">
              <input type="checkbox" checked={onlyVerified} onChange={(e) => setOnlyVerified(e.target.checked)} className="accent-teal-400" />
              Verified only
            </label>
          </aside>

          <div>
            <div className="flex items-center justify-between mb-3" style={mono}>
              <div className="text-[11px] text-slate-400">
                {filtered.length} {filtered.length === 1 ? "charity" : "charities"}
                {debounced && <span className="text-slate-500"> · matching "{debounced}"</span>}
              </div>
              {(cat !== "all" || debounced || onlyVerified) && (
                <button
                  onClick={() => { setCat("all"); setQ(""); setOnlyVerified(false); }}
                  className="text-[10px] uppercase text-teal-400 hover:text-lime-400"
                >
                  Reset filters
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <EmptyState onReset={() => { setCat("all"); setQ(""); setOnlyVerified(false); }} />
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((c) => (
                  <CharityCard
                    key={c.id}
                    c={c}
                    following={!!following[c.id]}
                    onDonate={() => openDonate(c)}
                    onFollow={() => toggleFollow(c)}
                    onCopy={() => copyWallet(c)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />

      <DonateModal
        charity={donateTarget!}
        open={!!donateTarget}
        onClose={() => setDonateTarget(null)}
      />
    </div>
  )
}

function FeaturedCard({
  c, following, onDonate, onFollow,
}: { c: Charity; following: boolean; onDonate: () => void; onFollow: () => void }) {
  const meta = CATEGORY_META[c.category]
  return (
    <div className="glass-panel p-5 relative overflow-hidden group">
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(20,184,166,0.10)" }} />
      <div className="absolute top-0 right-0 px-2 py-0.5 bg-lime-400 text-slate-950 text-[9px] font-bold uppercase" style={mono}>Featured</div>
      <div className="text-[10px] uppercase tracking-widest text-teal-400 mt-3" style={mono}>{meta.label} · {c.country}</div>
      <h3 className="text-xl font-bold mt-1 flex items-center gap-2">
        <Link href={`/marketplace/${c.id}`} className="hover:text-teal-300">{c.name}</Link>
        {c.verified && <span className="text-teal-400 text-xs" title="Verified">✓</span>}
      </h3>
      <p className="text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed">{c.mission}</p>
      <div className="grid grid-cols-3 gap-2 mt-4 text-center" style={mono}>
        <Cell label="Raised" value={formatUSD(c.raised)} />
        <Cell label="Impact" value={String(c.impactScore)} />
        <Cell label="Donors" value={c.donationsCount.toLocaleString()} />
      </div>
      <div className="flex gap-2 mt-4" style={mono}>
        <button onClick={onDonate} className="flex-[2] px-3 py-2 bg-teal-400 text-slate-950 font-bold uppercase text-[10px] hover:bg-lime-400">Donate</button>
        <button onClick={onFollow} className={`flex-1 px-3 py-2 uppercase text-[10px] border ${following ? "bg-teal-500/10 border-teal-500 text-teal-300" : "border-slate-700 text-slate-300 hover:border-teal-500/40"}`}>
          {following ? "Following" : "Follow"}
        </button>
      </div>
    </div>
  )
}

function CharityCard({
  c, following, onDonate, onFollow, onCopy,
}: {
  c: Charity
  following: boolean
  onDonate: () => void
  onFollow: () => void
  onCopy: () => void
}) {
  const meta = CATEGORY_META[c.category]
  return (
    <article className="glass-panel p-5 transition-colors hover:border-teal-500/40 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/marketplace/${c.id}`} className="block">
            <h3 className="text-lg font-bold text-white hover:text-teal-300 truncate">{c.name}</h3>
          </Link>
          <div style={mono} className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
            {meta.label} · {c.country}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0" style={mono}>
          {c.verified && <span className="px-1.5 py-0.5 text-[9px] uppercase border border-teal-400/40 text-teal-300">✓</span>}
          <span className="px-1.5 py-0.5 text-[9px] uppercase bg-lime-500/10 border border-lime-400/30 text-lime-300">{c.impactScore}</span>
        </div>
      </div>

      <p className="text-sm text-slate-400 mt-3 line-clamp-3 leading-relaxed flex-1">{c.mission}</p>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center" style={mono}>
        <Cell label="Raised" value={formatUSD(c.raised)} />
        <Cell label="Followers" value={c.followers.toLocaleString()} />
        <Cell label="Donations" value={c.donationsCount.toLocaleString()} />
      </div>

      <div className="flex items-center justify-between mt-3 text-[10px]" style={mono}>
        <button onClick={onCopy} className="text-slate-500 hover:text-teal-300 transition-colors" title="Copy wallet">
          {shortWallet(c.wallet)} ⧉
        </button>
        <Link href={`/marketplace/${c.id}`} className="text-teal-400 hover:text-lime-400">View profile →</Link>
      </div>

      <div className="flex gap-2 mt-3" style={mono}>
        <button onClick={onDonate} className="flex-[2] px-3 py-2 bg-teal-400 text-slate-950 font-bold uppercase text-[10px] hover:bg-lime-400">
          Donate
        </button>
        <button
          onClick={onFollow}
          aria-pressed={following}
          className={`flex-1 px-3 py-2 uppercase text-[10px] border transition-colors ${
            following ? "bg-teal-500/10 border-teal-500 text-teal-300" : "border-slate-700 text-slate-300 hover:border-teal-500/40"
          }`}
        >
          {following ? "Following" : "Follow"}
        </button>
      </div>
    </article>
  )
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 bg-slate-900/60 border border-slate-800">
      <div className="text-sm text-teal-300 font-bold">{value}</div>
      <div className="text-[9px] uppercase tracking-widest text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="glass-panel p-12 text-center" style={mono}>
      <div className="text-3xl mb-2">∅</div>
      <div className="text-[11px] uppercase tracking-widest text-slate-400">No charities match your filters.</div>
      <p className="text-sm text-slate-500 mt-3 max-w-md mx-auto">
        Try widening your search or browse all categories. New organizations are onboarded weekly via the application portal.
      </p>
      <div className="flex justify-center gap-2 mt-5">
        <button onClick={onReset} className="px-4 py-2 text-[10px] uppercase bg-teal-400 text-slate-950 font-bold hover:bg-lime-400">Reset filters</button>
        <Link href="/onboard" className="px-4 py-2 text-[10px] uppercase border border-slate-700 text-slate-300 hover:border-teal-500/40">List a charity</Link>
      </div>
    </div>
  )
}
