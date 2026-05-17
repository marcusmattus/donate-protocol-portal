"use client"

import { useState, useEffect } from "react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { PublicKey } from "@solana/web3.js"
import {
  sendDonationTransaction,
  getCharityBalance,
  requestTestnetAirdrop,
  CHARITY_WALLETS,
} from "@/lib/solana-transactions"
import { DEMO_CHARITIES } from "@/lib/seed-data"
import Link from "next/link"

export default function LiveDonationPage() {
  const { connection } = useConnection()
  const { publicKey, signTransaction } = useWallet()
  const [selectedCharity, setSelectedCharity] = useState<string>("solar-future")
  const [amountSol, setAmountSol] = useState<number>(0.1)
  const [loading, setLoading] = useState(false)
  const [transactionStatus, setTransactionStatus] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [charityBalance, setCharityBalance] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch wallet balance
  useEffect(() => {
    if (publicKey) {
      const fetchBalance = async () => {
        try {
          const balance = await connection.getBalance(publicKey)
          setWalletBalance(balance / 1e9)
        } catch (err) {
          console.error("Error fetching balance:", err)
        }
      }

      const interval = setInterval(fetchBalance, 3000)
      fetchBalance()
      return () => clearInterval(interval)
    }
  }, [publicKey, connection])

  // Fetch charity balance
  useEffect(() => {
    const fetchCharityBalance = async () => {
      try {
        const balance = await getCharityBalance(selectedCharity)
        setCharityBalance(balance)
      } catch (err) {
        console.error("Error fetching charity balance:", err)
      }
    }

    const interval = setInterval(fetchCharityBalance, 5000)
    fetchCharityBalance()
    return () => clearInterval(interval)
  }, [selectedCharity])

  const handleDonate = async () => {
    if (!publicKey || !signTransaction) {
      setError("Please connect your wallet first")
      return
    }

    if (amountSol <= 0) {
      setError("Amount must be greater than 0")
      return
    }

    if (walletBalance < amountSol) {
      setError("Insufficient balance")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    setTransactionStatus("Processing...")

    try {
      const result = await sendDonationTransaction(
        publicKey,
        selectedCharity,
        amountSol,
        signTransaction
      )

      if (result.status === "success") {
        setSuccess(
          `Donation successful! Signature: ${result.signature.slice(0, 8)}...`
        )
        setTransactionStatus(`✅ Confirmed: ${result.signature}`)
        setAmountSol(0.1)
      } else {
        setError("Transaction failed. Please try again.")
        setTransactionStatus("Failed")
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : "Unknown error"}`)
      setTransactionStatus("Failed")
    } finally {
      setLoading(false)
    }
  }

  const handleAirdrop = async () => {
    if (!publicKey) {
      setError("Please connect your wallet first")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await requestTestnetAirdrop(publicKey, 2)
      setSuccess("Airdrop successful! 2 SOL added to your account.")
      setTransactionStatus("Airdrop completed")
    } catch (err) {
      setError(`Airdrop error: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const selectedCharityData = DEMO_CHARITIES.find((c) => c.id === selectedCharity)

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
            <span
              className="text-2xl font-extrabold uppercase tracking-tighter"
              style={{ fontFamily: "var(--font-jetbrains), monospace" }}
            >
              <span className="text-white">Donate</span>
              <span className="text-teal-400">.Live</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-[10px] uppercase tracking-widest text-slate-400 hover:text-teal-400 transition"
            >
              ← Back
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero */}
        <section className="border-b border-teal-500/20 bg-gradient-to-b from-teal-500/5 to-transparent py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <h1
              className="text-5xl md:text-6xl font-extrabold uppercase tracking-tighter mb-4"
              style={{ fontFamily: "var(--font-inter), sans-serif" }}
            >
              Live Testnet <span className="text-teal-400">Donations</span>
            </h1>
            <p className="text-slate-400 text-lg">
              Send real SOL transactions on Solana Devnet to verified charities. 
              Connect your Phantom or Solflare wallet to get started.
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Left: Donation Form */}
            <div className="glass-panel p-8 glow-teal">
              <h2 className="text-2xl font-bold mb-6">Make a Donation</h2>

              {/* Wallet Connection */}
              <div className="mb-6 p-4 bg-slate-900/50 rounded border border-slate-800">
                <div className="text-[10px] uppercase text-slate-500 mb-3">
                  Step 1: Connect Wallet
                </div>
                <WalletMultiButton />
              </div>

              {publicKey && (
                <>
                  {/* Wallet Balance */}
                  <div className="mb-6 p-4 bg-lime-500/10 rounded border border-lime-400/20">
                    <div className="text-[10px] uppercase text-lime-400 font-bold mb-2">
                      Wallet Balance
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {walletBalance.toFixed(3)} SOL
                    </div>
                    <button
                      onClick={handleAirdrop}
                      disabled={loading}
                      className="mt-3 px-4 py-2 text-[10px] uppercase font-bold tracking-widest border border-lime-400 text-lime-400 hover:bg-lime-400 hover:text-slate-950 transition disabled:opacity-50"
                    >
                      {loading ? "Processing..." : "Request Airdrop (2 SOL)"}
                    </button>
                  </div>

                  {/* Select Charity */}
                  <div className="mb-6">
                    <label className="text-[10px] uppercase text-slate-500 font-bold mb-3 block">
                      Step 2: Select Charity
                    </label>
                    <select
                      value={selectedCharity}
                      onChange={(e) => setSelectedCharity(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded text-sm"
                    >
                      {DEMO_CHARITIES.map((charity) => (
                        <option key={charity.id} value={charity.id}>
                          {charity.name} (Impact: {charity.impactScore}/100)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amount Input */}
                  <div className="mb-6">
                    <label className="text-[10px] uppercase text-slate-500 font-bold mb-3 block">
                      Step 3: Enter Amount (SOL)
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amountSol}
                      onChange={(e) => setAmountSol(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded text-sm"
                      placeholder="0.1"
                    />
                    <div className="text-[10px] text-slate-500 mt-2">
                      Minimum: 0.01 SOL | Available: {walletBalance.toFixed(3)} SOL
                    </div>
                  </div>

                  {/* Status Messages */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="mb-4 p-3 bg-lime-500/10 border border-lime-500/30 rounded text-lime-400 text-sm">
                      {success}
                    </div>
                  )}

                  {/* Donate Button */}
                  <button
                    onClick={handleDonate}
                    disabled={loading || amountSol <= 0}
                    className="w-full px-4 py-3 text-[10px] uppercase font-bold tracking-widest border border-teal-400 text-teal-400 hover:bg-teal-400 hover:text-slate-950 transition disabled:opacity-50"
                  >
                    {loading ? "Processing..." : "Send Donation 💚"}
                  </button>
                </>
              )}

              {!publicKey && (
                <div className="p-4 bg-slate-900/50 rounded border border-slate-800 text-center text-slate-400">
                  Connect your wallet above to make a donation
                </div>
              )}
            </div>

            {/* Right: Charity Info & Transaction Status */}
            <div className="space-y-6">
              {/* Charity Info */}
              {selectedCharityData && (
                <div className="glass-panel p-8">
                  <h3 className="text-xl font-bold mb-4">{selectedCharityData.name}</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="text-[10px] uppercase text-slate-500 mb-1">
                        Mission
                      </div>
                      <p className="text-slate-300">{selectedCharityData.mission}</p>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-500 mb-1">
                        Wallet Address
                      </div>
                      <code className="text-[10px] text-teal-400 break-all">
                        {CHARITY_WALLETS[selectedCharity as keyof typeof CHARITY_WALLETS]}
                      </code>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                      <div>
                        <div className="text-[10px] uppercase text-slate-500 mb-1">
                          Impact Score
                        </div>
                        <div className="text-lg font-bold text-lime-400">
                          {selectedCharityData.impactScore}/100
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-slate-500 mb-1">
                          Balance (Live)
                        </div>
                        <div className="text-lg font-bold text-teal-400">
                          {charityBalance.toFixed(4)} SOL
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Status */}
              <div className="glass-panel p-8">
                <h3 className="text-lg font-bold mb-4">Transaction Status</h3>
                {transactionStatus ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-900/50 rounded border border-slate-800">
                      <div className="text-[10px] uppercase text-slate-500 mb-1">
                        Status
                      </div>
                      <code className="text-sm text-white break-all">
                        {transactionStatus}
                      </code>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      💡 Testnet transactions are typically confirmed within 5-10 seconds
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500">
                    No transactions yet. Connect wallet and donate to see status here.
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="glass-panel p-8 bg-slate-900/30">
                <h3 className="text-lg font-bold mb-4">📖 Instructions</h3>
                <ol className="text-sm space-y-2 text-slate-300 list-decimal list-inside">
                  <li>Install Phantom or Solflare wallet</li>
                  <li>Switch wallet to Solana Devnet</li>
                  <li>Connect wallet using button above</li>
                  <li>Request airdrop if needed (2 SOL)</li>
                  <li>Select a charity and amount</li>
                  <li>Click "Send Donation" to confirm</li>
                  <li>Approve transaction in your wallet</li>
                  <li>Watch transaction status update live</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <section className="border-t border-teal-500/20 bg-black/40 py-8 px-6">
          <div className="max-w-4xl mx-auto text-center text-slate-400 text-sm">
            <p>
              🧪 This demo runs on Solana Devnet. No real funds are transferred.
              <br />
              📚 Learn more about{" "}
              <a
                href="https://docs.solana.com/developers/testnet"
                className="text-teal-400 hover:underline"
              >
                Solana Devnet
              </a>
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
