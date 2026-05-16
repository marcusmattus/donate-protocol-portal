"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { NavDark } from "@/components/nav-dark"
import { simulateConnect, WalletProvider } from "@/lib/solana"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

export default function ConnectWalletPage() {
  const router = useRouter()
  const [connecting, setConnecting] = useState<WalletProvider | null>(null)

  function connect(p: WalletProvider) {
    setConnecting(p)
    const w = simulateConnect(p)
    setTimeout(() => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("dp:wallet", JSON.stringify(w))
      }
      router.push("/connect/tradingview")
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 terminal-grid">
      <NavDark />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400 text-center">/connect · step 1 of 3</div>
        <h1 className="text-center text-4xl md:text-5xl font-extrabold tracking-tighter mt-2">
          Connect Your <span className="text-teal-400">Solana Wallet</span>
        </h1>
        <p className="text-center text-slate-400 mt-3">Devnet-only for the demo. No real funds will be moved.</p>

        <div className="grid sm:grid-cols-3 gap-4 mt-10">
          {(["phantom", "solflare", "backpack"] as WalletProvider[]).map((p) => (
            <button
              key={p}
              onClick={() => connect(p)}
              disabled={!!connecting}
              className="glass-panel p-6 text-center hover:border-teal-500/40 disabled:opacity-60"
            >
              <div className="text-2xl mb-2">{p === "phantom" ? "👻" : p === "solflare" ? "🔥" : "🎒"}</div>
              <div className="text-lg font-bold capitalize">{p}</div>
              <div style={mono} className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
                {connecting === p ? "Connecting…" : "Connect"}
              </div>
            </button>
          ))}
        </div>

        <div style={mono} className="text-center text-[10px] uppercase tracking-widest text-slate-500 mt-8">
          By connecting you agree to demo-only terms · <Link href="/transparency" className="text-teal-300">Security</Link>
        </div>
      </main>
    </div>
  )
}
