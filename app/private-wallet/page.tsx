"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function PrivateWalletPage() {
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "exchanges" | "wallets" | "settings">(
    "overview"
  )
  const [loading, setLoading] = useState(true)
  const [exchangeTab, setExchangeTab] = useState<"connect" | "list">("list")
  const [error, setError] = useState<string | null>(null)

  // Exchange connection form
  const [selectedExchange, setSelectedExchange] = useState("kraken")
  const [apiKey, setApiKey] = useState("")
  const [apiSecret, setApiSecret] = useState("")
  const [apiPassphrase, setApiPassphrase] = useState("")
  const [connectingExchange, setConnectingExchange] = useState(false)

  // Mock data
  const [wallets, setWallets] = useState([
    {
      id: "wallet_1",
      address: "SoLx...Zzz1",
      type: "Phantom",
      balance: 2.5,
      active: true,
    },
    {
      id: "wallet_2",
      address: "7hJ4...aBc2",
      type: "Solflare",
      balance: 1.2,
      active: false,
    },
  ])

  const [exchanges, setExchanges] = useState([
    {
      id: "exchange_1",
      name: "Kraken",
      status: "Connected",
      autoLogin: true,
      autoTrade: false,
      lastLogin: "2 hours ago",
    },
  ])

  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/private-wallet-login")
    } else {
      setAuthenticated(true)
      setLoading(false)
    }
  }, [router])

  const handleConnectExchange = async (e: React.FormEvent) => {
    e.preventDefault()
    setConnectingExchange(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/exchange-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_demo_001",
          exchangeName: selectedExchange,
          apiKey,
          apiSecret,
          apiPassphrase,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Connection failed")
        return
      }

      const data = await response.json()

      // Add to list
      setExchanges([
        ...exchanges,
        {
          id: data.exchangeConnection.id,
          name:
            selectedExchange.charAt(0).toUpperCase() + selectedExchange.slice(1),
          status: "Connected",
          autoLogin: true,
          autoTrade: false,
          lastLogin: "Just now",
        },
      ])

      // Clear form
      setApiKey("")
      setApiSecret("")
      setApiPassphrase("")
      setExchangeTab("list")
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setConnectingExchange(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-teal-400 animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 terminal-grid">
      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <div className="w-full h-[2px] bg-teal-500/10 animate-scanline opacity-20" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-teal-500/20 bg-black/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            <span className="text-white">Donate</span>
            <span className="text-teal-400">.Wallet</span>
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-1 text-[10px] uppercase font-bold tracking-widest border border-red-500 text-red-400 hover:bg-red-500 hover:text-slate-50 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Header */}
        <section className="border-b border-teal-500/20 bg-gradient-to-b from-teal-500/5 to-transparent py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-extrabold uppercase tracking-tighter mb-2">
              Private <span className="text-teal-400">Wallet</span> Dashboard
            </h1>
            <p className="text-slate-400">
              Manage wallets, exchanges, and auto-trading
            </p>
          </div>
        </section>

        {/* Tabs */}
        <section className="border-b border-teal-500/20 bg-black/40">
          <div className="max-w-6xl mx-auto px-6 py-4 flex gap-8">
            {[
              { id: "overview", label: "Overview" },
              { id: "wallets", label: "Wallets" },
              { id: "exchanges", label: "Exchanges" },
              { id: "settings", label: "Settings" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-[10px] uppercase font-bold tracking-widest transition pb-2 border-b-2 ${
                  activeTab === tab.id
                    ? "border-teal-400 text-teal-400"
                    : "border-transparent text-slate-400 hover:text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* Content */}
        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            {/* Overview */}
            {activeTab === "overview" && (
              <div className="grid md:grid-cols-3 gap-6">
                <div className="glass-panel p-6">
                  <div className="text-[10px] uppercase text-slate-500 mb-2">
                    Active Wallets
                  </div>
                  <div className="text-4xl font-bold text-teal-400">{wallets.length}</div>
                  <div className="text-[10px] text-slate-500 mt-2">
                    {wallets.filter((w) => w.active).length} active
                  </div>
                </div>

                <div className="glass-panel p-6">
                  <div className="text-[10px] uppercase text-slate-500 mb-2">
                    Connected Exchanges
                  </div>
                  <div className="text-4xl font-bold text-lime-400">{exchanges.length}</div>
                  <div className="text-[10px] text-slate-500 mt-2">
                    All with auto-login
                  </div>
                </div>

                <div className="glass-panel p-6">
                  <div className="text-[10px] uppercase text-slate-500 mb-2">
                    Total Balance
                  </div>
                  <div className="text-4xl font-bold text-slate-300">
                    {wallets.reduce((sum, w) => sum + w.balance, 0).toFixed(2)} SOL
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2">
                    ~${(wallets.reduce((sum, w) => sum + w.balance, 0) * 165).toFixed(0)}
                  </div>
                </div>
              </div>
            )}

            {/* Wallets */}
            {activeTab === "wallets" && (
              <div className="space-y-6">
                <div className="glass-panel p-6">
                  <h3 className="text-xl font-bold mb-4">Your Wallets</h3>
                  <div className="space-y-3">
                    {wallets.map((wallet) => (
                      <div
                        key={wallet.id}
                        className="flex justify-between items-center p-4 bg-slate-900/50 border border-slate-800 rounded"
                      >
                        <div>
                          <div className="font-bold">{wallet.type}</div>
                          <code className="text-[10px] text-teal-400">{wallet.address}</code>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{wallet.balance} SOL</div>
                          <div className="text-[10px] text-slate-500">
                            {wallet.active ? "Active ✅" : "Inactive"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="w-full px-4 py-2 text-[10px] uppercase font-bold tracking-widest border border-teal-400 text-teal-400 hover:bg-teal-400 hover:text-slate-950 transition">
                  + Add Wallet
                </button>
              </div>
            )}

            {/* Exchanges */}
            {activeTab === "exchanges" && (
              <div className="space-y-6">
                {/* Exchange List */}
                {exchangeTab === "list" && (
                  <>
                    <div className="glass-panel p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Connected Exchanges</h3>
                        <button
                          onClick={() => setExchangeTab("connect")}
                          className="px-4 py-1 text-[10px] uppercase font-bold tracking-widest border border-lime-400 text-lime-400 hover:bg-lime-400 hover:text-slate-950 transition"
                        >
                          + Connect Exchange
                        </button>
                      </div>

                      {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                          {error}
                        </div>
                      )}

                      <div className="space-y-3">
                        {exchanges.map((exchange) => (
                          <div
                            key={exchange.id}
                            className="flex justify-between items-center p-4 bg-slate-900/50 border border-slate-800 rounded"
                          >
                            <div>
                              <div className="font-bold">{exchange.name}</div>
                              <div className="text-[10px] text-slate-500">
                                Last login: {exchange.lastLogin}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px]">
                                {exchange.status === "Connected" ? (
                                  <span className="text-lime-400">✅ {exchange.status}</span>
                                ) : (
                                  <span className="text-red-400">❌ {exchange.status}</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1">
                                Auto-login: {exchange.autoLogin ? "ON" : "OFF"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Connect Exchange Form */}
                {exchangeTab === "connect" && (
                  <div className="glass-panel p-6">
                    <button
                      onClick={() => setExchangeTab("list")}
                      className="text-teal-400 hover:underline text-[10px] uppercase font-bold mb-4"
                    >
                      ← Back
                    </button>

                    <h3 className="text-xl font-bold mb-4">Connect Exchange</h3>

                    <form onSubmit={handleConnectExchange} className="space-y-4">
                      <div>
                        <label className="text-[10px] uppercase text-slate-500 font-bold mb-2 block">
                          Select Exchange
                        </label>
                        <select
                          value={selectedExchange}
                          onChange={(e) => setSelectedExchange(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded"
                        >
                          <option value="kraken">Kraken</option>
                          <option value="binance">Binance</option>
                          <option value="coinbase">Coinbase</option>
                          <option value="tradingview">TradingView</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase text-slate-500 font-bold mb-2 block">
                          API Key
                        </label>
                        <input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase text-slate-500 font-bold mb-2 block">
                          API Secret
                        </label>
                        <input
                          type="password"
                          value={apiSecret}
                          onChange={(e) => setApiSecret(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded"
                          required
                        />
                      </div>

                      {selectedExchange === "coinbase" && (
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 font-bold mb-2 block">
                            Passphrase
                          </label>
                          <input
                            type="password"
                            value={apiPassphrase}
                            onChange={(e) => setApiPassphrase(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded"
                          />
                        </div>
                      )}

                      <div className="bg-slate-900/50 border border-slate-800 rounded p-3 text-[10px] text-slate-400">
                        ℹ️ Your credentials are encrypted and stored securely. Auto-login is enabled by default.
                      </div>

                      <button
                        type="submit"
                        disabled={connectingExchange}
                        className="w-full px-4 py-2 text-[10px] uppercase font-bold tracking-widest border border-lime-400 text-lime-400 hover:bg-lime-400 hover:text-slate-950 transition disabled:opacity-50"
                      >
                        {connectingExchange ? "Connecting..." : "Connect Exchange 🔗"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Settings */}
            {activeTab === "settings" && (
              <div className="glass-panel p-6 max-w-2xl">
                <h3 className="text-xl font-bold mb-6">Settings</h3>

                <div className="space-y-6">
                  <div className="p-4 bg-slate-900/50 border border-slate-800 rounded">
                    <label className="flex items-center justify-between">
                      <span className="font-bold">Auto-Login Enabled</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </label>
                    <p className="text-[10px] text-slate-500 mt-2">
                      Automatically log into connected exchanges on app load
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900/50 border border-slate-800 rounded">
                    <label className="flex items-center justify-between">
                      <span className="font-bold">Auto-Trading Enabled</span>
                      <input type="checkbox" className="w-4 h-4" />
                    </label>
                    <p className="text-[10px] text-slate-500 mt-2">
                      Execute trades automatically based on signals
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900/50 border border-slate-800 rounded">
                    <label className="flex items-center justify-between">
                      <span className="font-bold">Donation Percentage</span>
                      <input
                        type="number"
                        defaultValue="2"
                        min="0"
                        max="100"
                        className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 text-white rounded text-right"
                      />
                    </label>
                    <p className="text-[10px] text-slate-500 mt-2">
                      Percentage of profits donated to charities
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
