"use client"

import Link from "next/link"
import { useState } from "react"
import { simulateConnect, WalletProvider } from "@/lib/solana"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

export default function OnboardWalletPage() {
  const [connected, setConnected] = useState<string | null>(null)

  function connect(p: WalletProvider) {
    const w = simulateConnect(p)
    setConnected(w.publicKey)
  }

  return (
    <div className="space-y-6">
      <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400">/onboard · step 03</div>
      <h1 className="text-3xl font-extrabold">Connect Receiving Wallet</h1>
      <p className="text-slate-400 max-w-2xl">This wallet will receive automated donations from every connected trader. We recommend a multisig.</p>

      <div className="grid sm:grid-cols-3 gap-3">
        {(["phantom", "solflare", "backpack"] as WalletProvider[]).map((p) => (
          <button key={p} onClick={() => connect(p)} className="glass-panel p-5 text-left hover:border-teal-500/40">
            <div className="text-xl font-bold capitalize">{p}</div>
            <div style={mono} className="text-[10px] text-slate-500 uppercase mt-1">Devnet · One-click</div>
          </button>
        ))}
      </div>

      {connected && (
        <div className="glass-panel p-5 border-teal-500/40" style={mono}>
          <div className="text-[10px] uppercase tracking-widest text-lime-400">Connected</div>
          <div className="text-[12px] text-teal-300 break-all mt-1">{connected}</div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Link href="/onboard/verify" className="px-4 py-2 text-[10px] uppercase border border-slate-700 text-slate-400" style={mono}>← Back</Link>
        <Link href="/onboard/profile" className="px-5 py-2 bg-teal-400 text-slate-950 font-bold uppercase text-[11px]" style={mono}>Continue → Profile</Link>
      </div>
    </div>
  )
}
