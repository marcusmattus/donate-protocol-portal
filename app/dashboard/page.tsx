"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Portfolio } from "@/lib/types"

interface Charity {
  id: string
  name: string
  category: string
  raised: string
  followers: string
  impact: string
  color: "lime" | "teal"
  description: string
  wallet: string
}

const charities: Charity[] = [
  {
    id: "solar-future",
    name: "Solar Future Foundation",
    category: "Climate",
    raised: "$410,000",
    followers: "12,045",
    impact: "98",
    color: "lime",
    description: "Deploying solar infrastructure across Sub-Saharan Africa",
    wallet: "SoLx234future987abc"
  },
  {
    id: "kids-first",
    name: "Kids First DAO",
    category: "Children",
    raised: "$180,000",
    followers: "8,332",
    impact: "94",
    color: "teal",
    description: "Education & nutrition programs for underserved communities",
    wallet: "KiDS8alpha123beta"
  },
  {
    id: "open-water",
    name: "Open Water Relief",
    category: "Humanitarian",
    raised: "$1.4M",
    followers: "25,101",
    impact: "99",
    color: "teal",
    description: "Clean water access to 2M+ people globally",
    wallet: "OpWatr567demo"
  },
]

export default function Dashboard() {
  const router = useRouter()
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [walletAddress, setWalletAddress] = useState<string>("7XYDemo222")
  const [loading, setLoading] = useState(true)
  const [selectedCharity, setSelectedCharity] = useState<Charity | null>(charities[0])
  const [showCharitySelector, setShowCharitySelector] = useState(false)
  const [agentMode, setAgentMode] = useState("passive")

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await fetch(`/api/portfolio?wallet=${walletAddress}`)
        const data = await response.json()
        setPortfolio(data)
      } catch (error) {
        console.error("Error fetching portfolio:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolio()
  }, [walletAddress])

  const mockUsers = [
    { name: "Marcus Alpha", wallet: "7XYDemo111" },
    { name: "Sarah Quant", wallet: "7XYDemo222" },
    { name: "CryptoNova", wallet: "7XYDemo333" },
  ]

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 terminal-grid">
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <div className="w-full h-[2px] bg-teal-500/10 animate-scanline opacity-20" />
      </div>

      {/* Navigation breadcrumb */}
      <div className="fixed top-0 left-0 right-0 z-40 border-b border-slate-800 bg-black/50 backdrop-blur px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
            <Link href="/" className="text-teal-400 hover:text-lime-400 transition">HOME</Link>
            <span className="text-slate-600">/</span>
            <span className="text-white">DASHBOARD</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-500">{selectedCharity?.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/charities")} className="text-slate-400 hover:text-slate-200 transition text-xs uppercase tracking-widest">
              Charities
            </button>
            <button onClick={() => router.push("/marketplace")} className="text-teal-400 hover:text-lime-400 transition text-xs uppercase tracking-widest">
              Marketplace
            </button>
            <button onClick={() => router.push("/live-donation")} className="text-lime-400 hover:text-teal-400 transition text-xs uppercase tracking-widest">
              Donate
            </button>
            <button onClick={() => router.push("/private-wallet")} className="text-slate-400 hover:text-slate-200 transition text-xs uppercase tracking-widest">
              Wallet
            </button>
            <button onClick={() => router.push("/transparency")} className="text-slate-400 hover:text-slate-200 transition text-xs uppercase tracking-widest">
              Impact
            </button>
          </div>
        </div>
      </div>

      <main className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Main section header */}
          <div className="mb-12 flex flex-col lg:flex-row justify-between items-start gap-8">
            <div>
              <h1
                className="text-5xl font-extrabold uppercase tracking-tighter mb-4"
                style={{ fontFamily: "var(--font-inter), sans-serif" }}
              >
                Trading <span className="text-teal-400">Terminal</span>
              </h1>
              <p className="text-slate-400 text-sm mb-6">Real-time portfolio tracking with agent-powered impact routing</p>
              
              {/* Account selector */}
              <div
                className="flex gap-2 items-center"
                style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              >
                <span className="text-slate-500 text-sm">ACTIVE ACCOUNT:</span>
                <select
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-teal-400 focus:outline-none focus:border-teal-400"
                >
                  {mockUsers.map((user) => (
                    <option key={user.wallet} value={user.wallet}>
                      {user.name} ({user.wallet.slice(0, 6)}...)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Agent Control Panel */}
            <div className="glass-panel p-6 w-full lg:w-96 border-lime-500/20">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                <span className="text-lime-400 text-[10px] uppercase font-bold tracking-widest">AGENT ACTIVE</span>
              </div>
              <h3 className="text-white font-bold mb-4" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                Impact Router
              </h3>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                Automatically routes {portfolio?.totalDonated || "0"}% of profits to your selected charity. Agent learns your preferences over time.
              </p>
              
              {/* Current charity selection */}
              {selectedCharity && (
                <div className="bg-black/40 p-4 border border-lime-500/20 mb-4">
                  <div className="text-[10px] text-slate-500 uppercase mb-1">Current Route</div>
                  <div className="text-white font-bold text-sm mb-1">{selectedCharity.name}</div>
                  <div className="text-lime-400 text-xs font-bold">→ {selectedCharity.wallet}</div>
                </div>
              )}

              <button
                onClick={() => setShowCharitySelector(!showCharitySelector)}
                className="w-full py-3 bg-lime-500/10 border border-lime-400 text-lime-400 text-[10px] uppercase font-bold tracking-widest hover:bg-lime-500/20 transition"
                style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              >
                {showCharitySelector ? "Hide" : "Change Charity"} Destination
              </button>

              <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 text-[10px]" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                <div className="flex justify-between text-slate-500">
                  <span>Agent Mode</span>
                  <span className="text-teal-400">{agentMode.toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Routing Efficiency</span>
                  <span className="text-lime-400">97.3%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charity Selector Modal */}
          {showCharitySelector && (
            <div className="mb-8 glass-panel p-6 border-lime-500/20">
              <h3 className="text-white font-bold mb-6 uppercase tracking-tight" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                Select Impact Destination
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {charities.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCharity(c)
                      setShowCharitySelector(false)
                    }}
                    className={`p-4 border-2 text-left transition-all ${
                      selectedCharity?.id === c.id
                        ? `border-${c.color}-400 bg-${c.color}-500/10`
                        : "border-slate-800 hover:border-slate-600"
                    }`}
                  >
                    <div className="font-bold text-white mb-1">{c.name}</div>
                    <div className={`text-xs font-bold mb-3 ${c.color === "lime" ? "text-lime-400" : "text-teal-400"}`}>
                      {c.category}
                    </div>
                    <div className="text-[10px] text-slate-500 mb-3">{c.description}</div>
                    <div className="flex gap-4 text-[10px]">
                      <div>
                        <div className="text-slate-500">Raised</div>
                        <div className="font-bold text-white">{c.raised}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Impact</div>
                        <div className={`font-bold ${c.color === "lime" ? "text-lime-400" : "text-teal-400"}`}>{c.impact}/100</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio Stats Grid */}
          {loading ? (
            <div className="text-slate-400 text-center py-12">Loading portfolio...</div>
          ) : portfolio ? (
            <div className="space-y-8">
              {/* Portfolio Stats */}
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  {
                    label: "Total Volume",
                    value: `$${portfolio.totalVolume.toLocaleString()}`,
                    color: "teal",
                  },
                  {
                    label: "Total PnL",
                    value: `$${portfolio.totalPnL.toLocaleString()}`,
                    color: portfolio.totalPnL >= 0 ? "lime" : "red",
                  },
                  {
                    label: "Total Donated",
                    value: `$${portfolio.totalDonated.toLocaleString()}`,
                    color: "lime",
                  },
                  {
                    label: "Active Strategies",
                    value: portfolio.activeStrategies.length.toString(),
                    color: "teal",
                  },
                ]
                  .map((stat, i) => (
                    <div
                      key={i}
                      className="glass-panel p-6 border-teal-500/20 hover:border-teal-500/40 transition"
                      style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                    >
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">
                        {stat.label}
                      </div>
                      <div
                        className={`text-2xl font-bold ${
                          stat.color === "teal"
                            ? "text-teal-400"
                            : stat.color === "lime"
                            ? "text-lime-400"
                            : "text-red-400"
                        }`}
                      >
                        {stat.value}
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* Agent Impact Summary */}
              {selectedCharity && (
                <div className="glass-panel p-8 border-lime-500/20">
                  <h2
                    className="text-xl font-bold mb-6 uppercase tracking-tighter text-lime-400"
                    style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                  >
                    Impact Routing: {selectedCharity.name}
                  </h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Agent Route Status</div>
                      <div className="text-2xl font-bold text-lime-400">ACTIVE</div>
                      <div className="text-[10px] text-slate-500 mt-2">Profits auto-routing to {selectedCharity.name}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Estimated Monthly Impact</div>
                      <div className="text-2xl font-bold text-white">${Math.floor(portfolio.totalPnL * 0.05).toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500 mt-2">at 5% profit allocation</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Charity Wallet</div>
                      <div className="text-sm font-bold text-teal-400 break-all">{selectedCharity.wallet.slice(0, 12)}...</div>
                      <div className="text-[10px] text-slate-500 mt-2">Verified on-chain</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Trades */}
              <div className="glass-panel p-6 border-teal-500/20">
                <h2
                  className="text-xl font-bold mb-6 uppercase tracking-tighter"
                  style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                >
                  Recent Trades
                </h2>
                <div className="space-y-4">
                  {portfolio.recentTrades.length > 0 ? (
                    portfolio.recentTrades.map((trade) => (
                      <div key={trade.id} className="border border-slate-800 p-4 flex justify-between hover:border-teal-500/40 transition">
                        <div style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                          <div className="font-bold text-white">
                            {trade.side} {trade.symbol}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(trade.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div
                          className="text-right"
                          style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                        >
                          <div className="font-bold text-white">Price: ${trade.price}</div>
                          <div
                            className={`text-[10px] font-bold ${
                              trade.pnl && trade.pnl > 0 ? "text-lime-400" : "text-red-400"
                            }`}
                          >
                            {trade.pnl ? (trade.pnl > 0 ? "+" : "") + trade.pnl.toFixed(2) : "Pending"}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 text-center py-8">No trades yet</div>
                  )}
                </div>
              </div>

              {/* Donation History */}
              <div className="glass-panel p-6 border-lime-500/20">
                <h2
                  className="text-xl font-bold mb-6 uppercase tracking-tighter text-lime-400"
                  style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                >
                  Donation History
                </h2>
                <div className="space-y-4">
                  {portfolio.donationHistory.length > 0 ? (
                    portfolio.donationHistory.map((donation) => (
                      <div key={donation.id} className="border border-lime-500/20 p-4 flex justify-between hover:border-lime-500/40 transition">
                        <div style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                          <div className="font-bold text-lime-400">Donation Triggered</div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(donation.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div
                          className="text-right"
                          style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                        >
                          <div className="font-bold text-lime-400">${donation.amount.toFixed(2)}</div>
                          <div className="text-[10px] text-slate-500">{donation.percentage}% of profit</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 text-center py-8">No donations yet - start trading to generate impact!</div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid md:grid-cols-3 gap-4">
                <button 
                  onClick={() => router.push("/live-donation")}
                  className="glass-panel p-6 border-teal-500/20 hover:border-teal-500 transition text-left group"
                >
                  <div className="text-[10px] text-teal-400 uppercase font-bold tracking-widest mb-2">Quick Action</div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-teal-400 transition">Manual Donation</h3>
                  <p className="text-[10px] text-slate-500">Donate directly to your selected charity immediately</p>
                </button>
                <button 
                  onClick={() => router.push("/marketplace")}
                  className="glass-panel p-6 border-lime-500/20 hover:border-lime-500 transition text-left group"
                >
                  <div className="text-[10px] text-lime-400 uppercase font-bold tracking-widest mb-2">Explore</div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-lime-400 transition">Strategy Marketplace</h3>
                  <p className="text-[10px] text-slate-500">Copy verified strategies from top traders</p>
                </button>
                <button 
                  onClick={() => router.push("/charities")}
                  className="glass-panel p-6 border-slate-800 hover:border-slate-600 transition text-left group"
                >
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Browse</div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-white transition">All Charities</h3>
                  <p className="text-[10px] text-slate-500">View complete list of verified impact destinations</p>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-red-400 text-center py-12">Failed to load portfolio</div>
          )}
        </div>
      </main>
    </div>
  )
}
