"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { NavDark } from "@/components/nav-dark"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

export default function ConnectOpenClawPage() {
  const router = useRouter()
  const [linking, setLinking] = useState(false)

  function link() {
    setLinking(true)
    setTimeout(() => router.push("/dashboard"), 1400)
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 terminal-grid">
      <NavDark />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400 text-center">/connect · step 3 of 3</div>
        <h1 className="text-center text-4xl md:text-5xl font-extrabold tracking-tighter mt-2">
          Authorize <span className="text-teal-400">OpenClaw</span> Agent
        </h1>
        <p className="text-center text-slate-400 mt-3">
          OpenClaw will analyze signals, run a risk check, simulate Jupiter routing, and trigger donation events on profit.
        </p>

        <div className="glass-panel p-6 mt-8 space-y-3" style={mono}>
          {[
            "Read signal queue",
            "Submit simulated trades to Solana devnet",
            "Sign donation events from your Donation Vault PDA",
            "Publish trade results to dashboard",
          ].map((perm) => (
            <label key={perm} className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="accent-teal-400" />
              <span className="text-sm text-slate-300">{perm}</span>
            </label>
          ))}
        </div>

        <button
          onClick={link}
          disabled={linking}
          className="w-full mt-6 px-5 py-3 bg-teal-400 text-slate-950 font-bold uppercase tracking-widest hover:bg-lime-400 disabled:opacity-60"
          style={mono}
        >
          {linking ? "Linking via MCP…" : "Authorize Agent"}
        </button>

        <Link href="/connect/tradingview" className="block text-center mt-4 text-[10px] uppercase text-slate-400" style={mono}>
          ← Back
        </Link>
      </main>
    </div>
  )
}
