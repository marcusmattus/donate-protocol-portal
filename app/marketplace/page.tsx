"use client"

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
