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
import { useState, useEffect } from "react"
import Link from "next/link"
import { Charity, Strategy } from "@/lib/types"

export default function MarketplaceDashboard() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"charities" | "strategies">("charities")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"impact" | "raised" | "followers">("impact")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/demo/data")
        const data = await response.json()
        setCharities(data.charities)
        setStrategies(data.strategies)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const categories = [
    { id: "climate", label: "🌍 Climate", color: "lime" },
    { id: "children", label: "👶 Children", color: "teal" },
    { id: "education", label: "📚 Education", color: "teal" },
    { id: "healthcare", label: "🏥 Healthcare", color: "lime" },
    { id: "web3_public_goods", label: "💻 Web3", color: "teal" },
    { id: "animal_welfare", label: "🦁 Animals", color: "lime" },
    { id: "humanitarian", label: "🌐 Humanitarian", color: "teal" },
    { id: "food_support", label: "🍽️ Food", color: "lime" },
  ]

  const filteredCharities = selectedCategory
    ? charities.filter((c) => c.category === selectedCategory)
    : charities

  const sortedCharities = [...filteredCharities].sort((a, b) => {
    if (sortBy === "impact") return b.impactScore - a.impactScore
    if (sortBy === "raised") return b.raised - a.raised
    if (sortBy === "followers") return b.followers - a.followers
    return 0
  })

  const sortedStrategies = [...strategies].sort((a, b) => b.winRate - a.winRate)

  const totalRaised = charities.reduce((sum, c) => sum + c.raised, 0)
  const totalFollowers = charities.reduce((sum, c) => sum + c.followers, 0)
  const avgImpact = Math.round(charities.reduce((sum, c) => sum + c.impactScore, 0) / charities.length)

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 terminal-grid">
      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <div className="w-full h-[2px] bg-teal-500/10 animate-scanline opacity-20" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-teal-500/20 bg-black/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-extrabold uppercase tracking-tighter" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
              <span className="text-white">Donate</span>
              <span className="text-teal-400">.Marketplace</span>
            </span>
          </div>
          <Link
            href="/"
            className="text-[10px] uppercase tracking-widest text-slate-400 hover:text-teal-400 transition"
            style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          >
            ← Back to Home
          </Link>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Stats */}
        <section className="border-b border-teal-500/20 bg-gradient-to-b from-teal-500/5 to-transparent py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <h1
              className="text-5xl md:text-6xl font-extrabold uppercase tracking-tighter mb-8"
              style={{ fontFamily: "var(--font-inter), sans-serif" }}
            >
              Verified Impact <span className="text-teal-400">Marketplace</span>
            </h1>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Organizations",
                  value: charities.length.toString(),
                  color: "teal",
                },
                {
                  label: "Total Raised",
                  value: `$${(totalRaised / 1000000).toFixed(1)}M`,
                  color: "lime",
                },
                {
                  label: "Combined Followers",
                  value: `${(totalFollowers / 1000).toFixed(0)}K`,
                  color: "teal",
                },
                {
                  label: "Avg Impact Score",
                  value: `${avgImpact}/100`,
                  color: "lime",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="glass-panel p-4 border-teal-500/20"
                  style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                >
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-2">
                    {stat.label}
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      stat.color === "lime" ? "text-lime-400" : "text-teal-400"
                    }`}
                  >
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className="border-b border-teal-500/20 bg-black/40 px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-2 flex-wrap">
              {[
                { id: "charities", label: "💚 Charities", count: charities.length },
                { id: "strategies", label: "📈 Strategies", count: strategies.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-6 py-3 text-[10px] uppercase font-bold tracking-widest border transition-all ${
                    activeTab === tab.id
                      ? "border-teal-400 bg-teal-500/10 text-teal-400"
                      : "border-slate-800 text-slate-500 hover:border-teal-500"
                  }`}
                  style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading marketplace...</div>
        ) : (
          <>
            {/* Charities Tab */}
            {activeTab === "charities" && (
              <section className="py-12 px-6">
                <div className="max-w-7xl mx-auto">
                  {/* Filters */}
                  <div className="mb-8 space-y-4">
                    <div className="flex gap-2 flex-wrap items-center">
                      <span
                        className="text-[10px] uppercase text-slate-500"
                        style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                      >
                        Filter:
                      </span>
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-3 py-1 text-[9px] uppercase font-bold border transition ${
                          selectedCategory === null
                            ? "border-teal-400 bg-teal-500/10 text-teal-400"
                            : "border-slate-800 text-slate-500 hover:border-teal-400"
                        }`}
                      >
                        All
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`px-3 py-1 text-[9px] uppercase font-bold border transition ${
                            selectedCategory === cat.id
                              ? `border-${cat.color === "lime" ? "lime" : "teal"}-400 bg-${cat.color === "lime" ? "lime" : "teal"}-500/10 text-${cat.color === "lime" ? "lime" : "teal"}-400`
                              : "border-slate-800 text-slate-500 hover:border-teal-400"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2 flex-wrap items-center">
                      <span
                        className="text-[10px] uppercase text-slate-500"
                        style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                      >
                        Sort:
                      </span>
                      {[
                        { id: "impact", label: "Impact Score" },
                        { id: "raised", label: "Amount Raised" },
                        { id: "followers", label: "Followers" },
                      ].map((sort) => (
                        <button
                          key={sort.id}
                          onClick={() => setSortBy(sort.id as typeof sortBy)}
                          className={`px-3 py-1 text-[9px] uppercase font-bold border transition ${
                            sortBy === sort.id
                              ? "border-lime-400 bg-lime-500/10 text-lime-400"
                              : "border-slate-800 text-slate-500 hover:border-lime-400"
                          }`}
                        >
                          {sort.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Charities Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedCharities.map((charity) => {
                      const categoryInfo = categories.find((c) => c.id === charity.category)
                      const color = categoryInfo?.color || "teal"

                      return (
                        <Link key={charity.id} href={`/charities/${charity.id}`}>
                          <div
                            className={`glass-panel p-6 group hover:border-${color}-400 transition-all duration-300 cursor-pointer h-full flex flex-col`}
                          >
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                              <div
                                className={`px-2 py-1 text-[8px] uppercase font-bold border ${
                                  color === "lime"
                                    ? "bg-lime-500/10 text-lime-400 border-lime-400/20"
                                    : "bg-teal-500/10 text-teal-400 border-teal-500/20"
                                }`}
                              >
                                {categoryInfo?.label}
                              </div>
                              {charity.verified && (
                                <div className="flex items-center gap-1">
                                  <svg
                                    className="w-3 h-3 text-lime-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <span className="text-[7px] text-lime-400 font-bold uppercase">
                                    Verified
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Name & Mission */}
                            <h3 className="text-lg font-bold text-white mb-2">
                              {charity.name}
                            </h3>
                            <p className="text-slate-400 text-sm mb-4 flex-grow">
                              {charity.mission}
                            </p>

                            {/* Metrics */}
                            <div
                              className="space-y-2 pt-4 border-t border-slate-800"
                              style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                            >
                              <div className="flex justify-between text-[10px]">
                                <span className="text-slate-500">RAISED</span>
                                <span className="text-white font-bold">
                                  ${(charity.raised / 1000).toFixed(0)}K
                                </span>
                              </div>
                              <div className="flex justify-between text-[10px]">
                                <span className="text-slate-500">FOLLOWERS</span>
                                <span className="text-white font-bold">
                                  {(charity.followers / 1000).toFixed(1)}K
                                </span>
                              </div>
                              <div className="flex justify-between text-[10px]">
                                <span className="text-slate-500">IMPACT</span>
                                <span
                                  className={`font-bold ${
                                    color === "lime" ? "text-lime-400" : "text-teal-400"
                                  }`}
                                >
                                  {charity.impactScore}/100
                                </span>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-4 h-1 bg-slate-800 rounded overflow-hidden">
                              <div
                                className={`h-full ${
                                  color === "lime" ? "bg-lime-400" : "bg-teal-400"
                                }`}
                                style={{
                                  width: `${charity.impactScore}%`,
                                }}
                              />
                            </div>

                            {/* CTA Button */}
                            <button
                              className={`w-full mt-4 py-2 text-[9px] uppercase font-bold tracking-widest border transition-all group-hover:scale-105 ${
                                color === "lime"
                                  ? "border-lime-400 text-lime-400 hover:bg-lime-400 hover:text-slate-950"
                                  : "border-teal-500 text-teal-400 hover:bg-teal-500 hover:text-slate-950"
                              }`}
                            >
                              Learn More
                            </button>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* Strategies Tab */}
            {activeTab === "strategies" && (
              <section className="py-12 px-6">
                <div className="max-w-7xl mx-auto">
                  <div className="grid md:grid-cols-2 gap-6">
                    {sortedStrategies.map((strategy) => (
                      <Link key={strategy.id} href={`/strategies/${strategy.id}`}>
                        <div
                          className={`glass-panel p-6 group hover:border-${
                            strategy.accentColor === "lime" ? "lime" : "teal"
                          }-400 transition-all duration-300 cursor-pointer ${
                            strategy.trending ? `border-${strategy.accentColor}-400/30 scale-105` : ""
                          }`}
                        >
                          {/* Header */}
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3
                                className="text-xl font-bold text-white mb-1"
                                style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                              >
                                {strategy.name}
                              </h3>
                              <p className="text-[9px] text-slate-500 uppercase">
                                by {strategy.author}
                              </p>
                            </div>
                            {strategy.trending && (
                              <div className="px-2 py-1 bg-lime-400 text-slate-950 text-[8px] font-bold uppercase">
                                🔥 Trending
                              </div>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-slate-400 text-sm mb-4">
                            {strategy.description}
                          </p>

                          {/* Metrics */}
                          <div
                            className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800"
                            style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                          >
                            <div>
                              <div className="text-[8px] text-slate-500 uppercase mb-1">
                                Win Rate
                              </div>
                              <div
                                className={`text-lg font-bold ${
                                  strategy.accentColor === "lime"
                                    ? "text-lime-400"
                                    : "text-teal-400"
                                }`}
                              >
                                {strategy.winRate}%
                              </div>
                            </div>
                            <div>
                              <div className="text-[8px] text-slate-500 uppercase mb-1">
                                Followers
                              </div>
                              <div className="text-lg font-bold text-white">
                                {(strategy.followers / 1000).toFixed(1)}K
                              </div>
                            </div>
                            <div>
                              <div className="text-[8px] text-slate-500 uppercase mb-1">
                                Donation %
                              </div>
                              <div
                                className={`text-lg font-bold ${
                                  strategy.accentColor === "lime"
                                    ? "text-lime-400"
                                    : "text-teal-400"
                                }`}
                              >
                                {strategy.donationRate}%
                              </div>
                            </div>
                          </div>

                          {/* Mini Chart */}
                          <div className="w-full h-[50px] bg-slate-900/50 mt-4 relative overflow-hidden flex items-end rounded">
                            <svg
                              className={`w-full h-full opacity-40 ${
                                strategy.accentColor === "lime"
                                  ? "text-lime-400"
                                  : "text-teal-400"
                              }`}
                              viewBox="0 0 100 20"
                              preserveAspectRatio="none"
                            >
                              <path d={strategy.chartPath} fill="currentColor" />
                            </svg>
                          </div>

                          {/* CTA Button */}
                          <button
                            className={`w-full mt-4 py-2 text-[9px] uppercase font-bold tracking-widest border transition-all group-hover:scale-105 ${
                              strategy.accentColor === "lime"
                                ? "border-lime-400 text-lime-400 hover:bg-lime-400 hover:text-slate-950"
                                : "border-teal-500 text-teal-400 hover:bg-teal-500 hover:text-slate-950"
                            }`}
                          >
                            Copy Strategy
                          </button>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* Footer CTA */}
        <section className="border-t border-teal-500/20 bg-black/40 py-12 px-6 mt-12">
          <div className="max-w-5xl mx-auto text-center glass-panel p-8 glow-teal">
            <h2
              className="text-3xl font-extrabold uppercase tracking-tighter mb-4"
              style={{ fontFamily: "var(--font-inter), sans-serif" }}
            >
              Ready to make <span className="text-teal-400">impact?</span>
            </h2>
            <p className="text-slate-400 mb-6 max-w-2xl mx-auto">
              Join our community of traders who combine profit with purpose. Connect your wallet,
              choose your charities, and start transforming trading activity into real-world change.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-8 py-3 bg-teal-400 text-slate-950 font-bold uppercase tracking-widest hover:bg-lime-400 transition"
            >
              Launch Dashboard
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
