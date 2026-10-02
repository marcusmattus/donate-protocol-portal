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

  // Check auth on mount.
  //
  // This used to be `localStorage.getItem("authToken")` — any truthy string let
  // you in, so the gate was decoration: typing
  // localStorage.setItem('authToken','x') in the console opened the wallet area.
  // It now asks the server whether it holds a session it verified against
  // Privy's JWKS, which is a question the browser cannot answer for itself.
  //
  // This is still only a UI gate. Anything that must actually be protected is
  // protected server-side, by the route reading the session cookie.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/auth/privy", { cache: "no-store" })
        const body = await res.json().catch(() => ({}))
        if (cancelled) return
        if (body?.authenticated === true) {
          setAuthenticated(true)
          setLoading(false)
        } else {
          router.replace("/private-wallet-login?next=/private-wallet")
        }
      } catch {
        // A failed check is not an authenticated one: send them to sign in
        // rather than falling open on a network blip.
        if (!cancelled) router.replace("/private-wallet-login?next=/private-wallet")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  /**
   * Exchange connection is not wired up.
   *
   * This posted apiKey / apiSecret / apiPassphrase to `/api/auth/exchange-login`,
   * which has never existed. The 404's HTML broke `response.json()`, so the form
   * reported "Network error. Please try again." while the panel above it claimed
   * the credentials were "encrypted and stored securely". Nothing was stored, and
   * nothing was encrypted.
   *
   * Sending exchange secrets to a route that does not exist is worse than doing
   * nothing: it puts live API keys on the wire and in whatever logs answer the
   * request, in exchange for no stored connection. So the submit no longer sends
   * anything, and the UI says what is actually true.
   *
   * Storing these properly is a real feature — encryption at rest keyed per user,
   * scoping to the session identity, and a revocation path — not a line of glue.
   */
  const handleConnectExchange = (e: React.FormEvent) => {
    e.preventDefault()
    setError(
      "Exchange connection is not available yet. Nothing was sent — this form had no working endpoint, so your API keys stay in the browser."
    )
  }

  const handleLogout = async () => {
    // Clear the server session, not a localStorage flag — removing the flag
    // left the real session cookie alive, so "log out" logged nobody out.
    await fetch("/api/auth/privy", { method: "DELETE" }).catch(() => {})
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
                        ⚠️ Not available yet — this form has no backend. Nothing you type here is
                        sent, stored or encrypted. Do not treat it as a place to save live API keys.
                      </div>

                      <button
                        type="submit"
                        className="w-full px-4 py-2 text-[10px] uppercase font-bold tracking-widest border border-slate-700 text-slate-500 hover:border-amber-500/40 hover:text-amber-300 transition"
                      >
                        Connect Exchange — unavailable
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
