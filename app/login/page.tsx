import Link from "next/link"
import { NavDark } from "@/components/nav-dark"
import { isPrivyConfigured, LOGIN_METHODS } from "@/lib/privy/config"
import { PrivyLoginPanel } from "./login-panel"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

export const metadata = { title: "Sign in" }

/**
 * Login page.
 *
 * The configured/unconfigured split happens here, at the component boundary,
 * because `usePrivy()` throws outside a mounted PrivyProvider and the provider
 * is a no-op without an app id. Branching here keeps the hook out of the
 * unconfigured render entirely, rather than calling it conditionally.
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 terminal-grid">
      <NavDark />
      <main className="max-w-md mx-auto px-6 py-20">
        <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400 text-center">
          /login
        </div>
        <h1 className="text-center text-3xl md:text-4xl font-extrabold tracking-tighter mt-2">
          Sign in to <span className="text-teal-400">Donate Protocol</span>
        </h1>
        <p style={mono} className="text-center text-[11px] text-slate-500 mt-3 leading-relaxed">
          Email or a social account creates a Solana wallet for you — you do not need one already.
          Bring your own wallet if you have one.
        </p>

        <div className="mt-10">
          {isPrivyConfigured() ? <PrivyLoginPanel /> : <NotConfigured />}
        </div>

        <p style={mono} className="text-center text-[10px] text-slate-600 mt-8 leading-relaxed">
          Signing in identifies you to the protocol. It grants no trading authority on its own —
          execution still passes the risk engine and your own policy.
        </p>
      </main>
    </div>
  )
}

function NotConfigured() {
  return (
    <div className="glass-panel p-5 border-amber-500/40 space-y-3" style={mono}>
      <div className="text-[10px] uppercase tracking-widest text-amber-400">
        Privy is not configured
      </div>
      <p className="text-[11px] text-slate-400 leading-relaxed">
        Set these, then reload. Donate Protocol never sees a Privy password — you authenticate
        with Privy directly.
      </p>
      <ul className="text-[11px] space-y-1.5">
        <li>
          <code className="text-teal-300">NEXT_PUBLIC_PRIVY_APP_ID</code>
          <span className="text-slate-500"> — from the Privy dashboard</span>
        </li>
        <li>
          <code className="text-teal-300">SESSION_SECRET</code>
          <span className="text-slate-500"> — 16+ chars, signs the session cookie</span>
        </li>
      </ul>
      <p className="text-[10px] text-slate-600 leading-relaxed pt-1">
        Login methods this app requests: {LOGIN_METHODS.join(", ")}.
      </p>
      <Link
        href="/"
        className="inline-block mt-1 px-4 py-2 text-[10px] uppercase border border-slate-700 text-slate-400 hover:border-teal-500/40"
      >
        ← Back home
      </Link>
    </div>
  )
}
