"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { NavDark } from "@/components/nav-dark"
import { SiteFooter } from "@/components/site-footer"
import { useWallet } from "@/components/wallet-context"
import { WalletProvider } from "@/lib/solana"
import { shortWallet } from "@/lib/demo-data"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

const PROVIDERS: { id: WalletProvider; label: string; emoji: string; tag: string }[] = [
  { id: "phantom", label: "Phantom", emoji: "👻", tag: "Most popular" },
  { id: "solflare", label: "Solflare", emoji: "🔥", tag: "Hardware support" },
  { id: "backpack", label: "Backpack", emoji: "🎒", tag: "xNFT ready" },
]

export default function ConnectWalletPage() {
  const router = useRouter()
  const { wallet, connecting, connect, disconnect } = useWallet()

  async function pick(p: WalletProvider) {
    try {
      const w = await connect(p)
      toast.success(`Connected ${p}`, { description: shortWallet(w.publicKey) })
      router.push("/connect/tradingview")
    } catch {
      toast.error("Wallet connection failed")
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 terminal-grid flex flex-col">
      <NavDark />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 w-full">
        <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400 text-center">/connect · step 1 of 3</div>
        <h1 className="text-center text-4xl md:text-5xl font-extrabold tracking-tighter mt-2">
          Connect Your <span className="text-teal-400">Solana Wallet</span>
        </h1>
        <p className="text-center text-slate-400 mt-3 max-w-xl mx-auto">
          Devnet-only for the demo. No real funds will be moved. Your wallet only authorizes signal routing and donation events.
        </p>

        {wallet && (
          <div className="glass-panel p-4 mt-8 border-teal-500/40" style={mono}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-lime-400">Already connected</div>
                <div className="text-sm text-white mt-1">{wallet.provider} · {shortWallet(wallet.publicKey)}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={disconnect} className="px-3 py-2 text-[10px] uppercase border border-slate-700 text-slate-300 hover:border-rose-500/40">Disconnect</button>
                <Link href="/connect/tradingview" className="px-3 py-2 text-[10px] uppercase bg-teal-400 text-slate-950 font-bold">Continue →</Link>
              </div>
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4 mt-10">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => pick(p.id)}
              disabled={!!connecting}
              className="glass-panel p-6 text-center hover:border-teal-500/40 disabled:opacity-60 transition-colors"
            >
              <div className="text-3xl mb-2">{p.emoji}</div>
              <div className="text-lg font-bold">{p.label}</div>
              <div style={mono} className="text-[10px] uppercase tracking-widest text-slate-500 mt-2">
                {connecting === p.id ? "Connecting…" : p.tag}
              </div>
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mt-8 text-center" style={mono}>
          <Bullet icon="✓" text="Non-custodial · keys never leave your wallet" />
          <Bullet icon="✓" text="Devnet simulation · zero real transfers" />
          <Bullet icon="✓" text="Open-source · auditable on GitHub" />
        </div>

        <div style={mono} className="text-center text-[10px] uppercase tracking-widest text-slate-500 mt-8">
          By connecting you agree to demo-only terms · <Link href="/transparency" className="text-teal-300">Security</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

function Bullet({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="p-3 bg-slate-900/60 border border-slate-800">
      <div className="text-teal-400 text-sm">{icon}</div>
      <div className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">{text}</div>
    </div>
  )
}
