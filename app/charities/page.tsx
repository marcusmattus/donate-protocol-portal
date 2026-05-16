"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Charity } from "@/lib/types"

export default function CharityMarketplace() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCharities = async () => {
      try {
        const query = selectedCategory ? `?category=${selectedCategory}` : ""
        const response = await fetch(`/api/charities${query}`)
        const data = await response.json()
        setCharities(data)
      } catch (error) {
        console.error("Error fetching charities:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCharities()
  }, [selectedCategory])

  const categories = [
    { id: "climate", label: "Climate" },
    { id: "children", label: "Children" },
    { id: "education", label: "Education" },
    { id: "healthcare", label: "Healthcare" },
    { id: "web3_public_goods", label: "Web3 Public Goods" },
  ]

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      climate: "lime",
      children: "teal",
      education: "teal",
      healthcare: "lime",
      web3_public_goods: "teal",
      humanitarian: "lime",
      food_support: "teal",
      disaster_relief: "lime",
      animal_welfare: "teal",
    }
    return colors[category] || "teal"
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 terminal-grid">
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <div className="w-full h-[2px] bg-teal-500/10 animate-scanline opacity-20" />
      </div>

      <main className="relative z-10">
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16">
              <h1
                className="text-5xl md:text-6xl font-extrabold uppercase tracking-tighter mb-4"
                style={{ fontFamily: "var(--font-inter), sans-serif" }}
              >
                Verified Impact <span className="text-lime-400">Destinations</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-2xl">
                Browse verified charities and organizations making real-world impact. Your trading profits directly
                support these causes.
              </p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-3 mb-12">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 text-[10px] uppercase font-bold tracking-widest border transition-all glass-panel ${
                  selectedCategory === null
                    ? "border-teal-500 bg-teal-500/10 text-teal-400"
                    : "border-slate-800 text-slate-500 hover:border-teal-500"
                }`}
              >
                All Causes
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 text-[10px] uppercase font-bold tracking-widest border transition-all glass-panel ${
                    selectedCategory === cat.id
                      ? "border-lime-400 bg-lime-400/10 text-lime-400"
                      : "border-slate-800 text-slate-500 hover:border-teal-500"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Charities Grid */}
            {loading ? (
              <div className="text-center py-12 text-slate-400">Loading charities...</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {charities.map((charity) => {
                  const color = getCategoryColor(charity.category)
                  return (
                    <Link key={charity.id} href={`/charities/${charity.id}`}>
                      <div
                        className={`glass-panel p-6 group hover:border-${color}-400 transition-all duration-300 cursor-pointer h-full`}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div
                            className={`px-2 py-1 text-[9px] uppercase font-bold border ${
                              color === "lime"
                                ? "bg-lime-500/10 text-lime-400 border-lime-400/20"
                                : "bg-teal-500/10 text-teal-400 border-teal-500/20"
                            }`}
                            style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                          >
                            {charity.category.replace("_", " ")}
                          </div>
                          {charity.verified && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-lime-400" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-[9px] text-lime-400 font-bold uppercase">Verified</span>
                            </div>
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-white mb-2">{charity.name}</h3>
                        <p className="text-slate-400 text-sm mb-4">{charity.mission}</p>

                        <div
                          className="space-y-2 pt-4 border-t border-slate-800"
                          style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                        >
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-500">TOTAL RAISED</span>
                            <span className="text-white font-bold">${(charity.raised / 1000).toFixed(0)}K</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-500">FOLLOWERS</span>
                            <span className="text-white font-bold">
                              {(charity.followers / 1000).toFixed(1)}K
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-500">IMPACT SCORE</span>
                            <span className={`font-bold ${color === "lime" ? "text-lime-400" : "text-teal-400"}`}>
                              {charity.impactScore}/100
                            </span>
                          </div>
                        </div>

                        <button
                          className={`w-full mt-6 py-3 text-[10px] uppercase font-bold tracking-widest border transition-all group-hover:scale-105 ${
                            color === "lime"
                              ? "border-lime-400 text-lime-400 hover:bg-lime-400 hover:text-slate-950"
                              : "border-teal-500 text-teal-400 hover:bg-teal-500 hover:text-slate-950"
                          }`}
                        >
                          View Details
                        </button>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
