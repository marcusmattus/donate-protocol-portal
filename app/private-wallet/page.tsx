"use client"

import { useState, useEffect, useCallback } from "react"
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

  // Real connections from the server. The previous value here was a hardcoded
  // "Kraken — Connected — 2 hours ago", which was fiction: nothing had ever been
  // stored, so the page showed a connection that did not exist.
  interface ExchangeConnection {
    id: string
    exchange: string
    label: string
    fingerprint: string
    hint: string
    hasPassphrase: boolean
    createdAt: number
    lastUsedAt: number | null
    validation: { status: string; reason: string; checkedAt: number } | null
  }
  const [exchanges, setExchanges] = useState<ExchangeConnection[]>([])
  const [catalog, setCatalog] = useState<{ id: string; label: string; requiresPassphrase: boolean }[]>([])
  const [sealingConfigured, setSealingConfigured] = useState<boolean | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

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

  // Connections are loaded only after the session check passes, so an
  // unauthenticated visitor never even issues the request.
  const loadConnections = useCallback(async () => {
    try {
      const res = await fetch("/api/exchanges", { cache: "no-store" })
      if (res.status === 401) {
        router.replace("/private-wallet-login?next=/private-wallet")
        return
      }
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body?.error ?? `could not load connections (${res.status})`)
        return
      }
      setExchanges(Array.isArray(body.connections) ? body.connections : [])
      setCatalog(Array.isArray(body.exchanges) ? body.exchanges : [])
      setSealingConfigured(Boolean(body.sealingConfigured))
    } catch {
      setError("could not load exchange connections")
    }
  }, [router])

  useEffect(() => {
    if (authenticated) void loadConnections()
  }, [authenticated, loadConnections])

  /**
   * Store an exchange connection.
   *
   * The secrets go straight to the server and are never kept in component state
   * beyond the inputs; they are cleared as soon as the request succeeds. The
   * response carries only the masked view, so nothing secret comes back to be
   * rendered or cached.
   */
  const handleConnectExchange = async (e: React.FormEvent) => {
    e.preventDefault()
    setConnecting(true)
    setError(null)
    setNotice(null)

    try {
      const res = await fetch("/api/exchanges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exchange: selectedExchange,
          apiKey,
          apiSecret,
          passphrase: apiPassphrase || null,
        }),
      })
      const body = await res.json().catch(() => ({}))

      if (res.status === 401) {
        router.replace("/private-wallet-login?next=/private-wallet")
        return
      }
      if (!res.ok) {
        setError(body?.hint ? `${body.error} — ${body.hint}` : body?.error ?? `failed (${res.status})`)
        return
      }

      // Clear the inputs before anything else, so the secrets stop existing in
      // the page as soon as the server has them.
      setApiKey("")
      setApiSecret("")
      setApiPassphrase("")
      setNotice(`Connected ${body.connection?.label ?? selectedExchange} (${body.connection?.hint ?? ""})`)
      await loadConnections()
      setExchangeTab("list")
    } catch {
      setError("network error while storing the connection")
    } finally {
      setConnecting(false)
    }
  }

  const handleRevalidate = async (id: string) => {
    setError(null)
    setNotice(null)
    try {
      const res = await fetch(`/api/exchanges?id=${encodeURIComponent(id)}`, { method: "PUT" })
      const body = await res.json().catch(() => ({}))
      if (res.status === 401) {
        router.replace("/private-wallet-login?next=/private-wallet")
        return
      }
      if (res.status === 429) {
        setError(
          `Checked very recently — try again in ${Math.ceil((body?.retryAfterMs ?? 0) / 1000)}s. Each check calls the exchange.`
        )
        return
      }
      if (!res.ok) {
        setError(body?.error ?? `could not re-check (${res.status})`)
        return
      }
      setNotice(`Re-checked: ${body?.connection?.validation?.reason ?? "done"}`)
      await loadConnections()
    } catch {
      setError("network error while re-checking the connection")
    }
  }

  const handleRevoke = async (id: string) => {
    setError(null)
    setNotice(null)
    try {
      const res = await fetch(`/api/exchanges?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      if (res.status === 401) {
        router.replace("/private-wallet-login?next=/private-wallet")
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body?.error ?? `could not revoke (${res.status})`)
        return
      }
      setNotice("Connection revoked.")
      await loadConnections()
    } catch {
      setError("network error while revoking the connection")
    }
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

                      {notice && (
                        <div className="mb-4 p-3 bg-lime-500/10 border border-lime-500/30 rounded text-lime-300 text-sm">
                          {notice}
                        </div>
                      )}

                      {sealingConfigured === false && (
                        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded text-amber-300 text-[11px] leading-relaxed">
                          Credential storage is not configured on this server, so connecting is
                          disabled. Set <code>EXCHANGE_ENCRYPTION_KEY</code> (32+ characters) to
                          enable it. Keys are never stored unencrypted.
                        </div>
                      )}

                      <div className="space-y-3">
                        {exchanges.length === 0 && (
                          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded text-[11px] text-slate-500">
                            No exchange connections yet.
                          </div>
                        )}
                        {exchanges.map((exchange) => (
                          <div
                            key={exchange.id}
                            className="flex justify-between items-center p-4 bg-slate-900/50 border border-slate-800 rounded"
                          >
                            <div>
                              <div className="font-bold">{exchange.label}</div>
                              {/* The key itself is never sent to the browser —
                                  only four characters and a keyed fingerprint. */}
                              <div className="text-[10px] text-slate-500 mt-1">
                                Key {exchange.hint} · {exchange.fingerprint}
                                {exchange.hasPassphrase ? " · passphrase stored" : ""}
                              </div>
                              <div className="text-[10px] text-slate-600">
                                Added {new Date(exchange.createdAt).toLocaleString()}
                                {exchange.lastUsedAt
                                  ? ` · last used ${new Date(exchange.lastUsedAt).toLocaleString()}`
                                  : " · not used yet"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <ValidationBadge validation={exchange.validation} />
                              <button
                                onClick={() => void handleRevalidate(exchange.id)}
                                className="px-3 py-1 text-[10px] uppercase font-bold tracking-widest border border-slate-700 text-slate-400 hover:border-teal-500/50 hover:text-teal-300 transition"
                              >
                                Re-check
                              </button>
                              <button
                                onClick={() => void handleRevoke(exchange.id)}
                                className="px-3 py-1 text-[10px] uppercase font-bold tracking-widest border border-slate-700 text-slate-400 hover:border-rose-500/50 hover:text-rose-300 transition"
                              >
                                Revoke
                              </button>
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
                          {catalog.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.label}
                            </option>
                          ))}
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

                      {catalog.find((e) => e.id === selectedExchange)?.requiresPassphrase && (
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
                        🔒 Sealed with AES-256-GCM under a per-record key before storage, scoped to
                        your account. The key and secret are never returned to the browser again —
                        only the last four characters and a fingerprint. Revoke at any time.
                      </div>

                      <button
                        type="submit"
                        disabled={connecting || sealingConfigured === false}
                        className="w-full px-4 py-2 text-[10px] uppercase font-bold tracking-widest border border-lime-400 text-lime-400 hover:bg-lime-400 hover:text-slate-950 transition disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-lime-400"
                      >
                        {connecting
                          ? "Storing…"
                          : sealingConfigured === false
                          ? "Unavailable — server not configured"
                          : "Connect Exchange 🔗"}
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

/**
 * What the exchange said about this credential, if anyone has asked.
 *
 * "Rejected" deliberately does not mean the credential was thrown away — it is
 * still stored and revocable, because the signing is ours and a bug in it must
 * not cost someone a working key.
 */
function ValidationBadge({
  validation,
}: {
  validation: { status: string; reason: string; checkedAt: number } | null
}) {
  if (!validation) {
    return (
      <span
        title="Never checked against the exchange"
        className="px-2 py-0.5 border border-slate-700 text-slate-500 text-[9px] uppercase"
      >
        unchecked
      </span>
    )
  }
  const [cls, label] =
    validation.status === "valid"
      ? ["border-lime-500/40 text-lime-300", "verified"]
      : validation.status === "rejected"
      ? ["border-rose-500/40 text-rose-300", "rejected"]
      : validation.status === "unreachable"
      ? ["border-amber-500/40 text-amber-300", "unreachable"]
      : ["border-slate-700 text-slate-500", "not checkable"]

  return (
    <span
      title={`${validation.reason} — ${new Date(validation.checkedAt).toLocaleString()}`}
      className={`px-2 py-0.5 border text-[9px] uppercase ${cls}`}
    >
      {label}
    </span>
  )
}
