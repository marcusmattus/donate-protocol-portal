"use client"

import { useState, useEffect } from "react"
import { Portfolio } from "@/lib/types"

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [walletAddress, setWalletAddress] = useState<string>("7XYDemo222")
  const [loading, setLoading] = useState(true)

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

      <main className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h1
              className="text-5xl font-extrabold uppercase tracking-tighter mb-6"
              style={{ fontFamily: "var(--font-inter), sans-serif" }}
            >
              Trading <span className="text-teal-400">Dashboard</span>
            </h1>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div
                className="flex gap-2"
                style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              >
                <span className="text-slate-500 text-sm">SELECT DEMO ACCOUNT:</span>
                <select
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="bg-slate-900 border border-slate-800 px-3 py-1 text-sm text-teal-400 focus:outline-none focus:border-teal-400"
                >
                  {mockUsers.map((user) => (
                    <option key={user.wallet} value={user.wallet}>
                      {user.name} ({user.wallet.slice(0, 6)}...)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

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
                      className="glass-panel p-6 border-teal-500/20"
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
                      <div key={trade.id} className="border border-slate-800 p-4 flex justify-between">
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
                      <div key={donation.id} className="border border-lime-500/20 p-4 flex justify-between">
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
                    <div className="text-slate-500 text-center py-8">No donations yet</div>
                  )}
                </div>
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
