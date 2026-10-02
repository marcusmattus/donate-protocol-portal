import Link from "next/link"
import { LOGIN_METHODS } from "@/lib/privy/config"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

/**
 * Shown on /signup and /login when Privy is not configured server-side.
 *
 * Shared by both pages so the setup instructions cannot drift into two
 * different versions of the truth.
 */
export function AuthNotConfigured({ mode }: { mode: "signup" | "signin" }) {
  return (
    <div className="glass-panel p-5 border-amber-500/40 space-y-3" style={mono}>
      <div className="text-[10px] uppercase tracking-widest text-amber-400">
        Privy is not configured
      </div>
      <p className="text-[11px] text-slate-400 leading-relaxed">
        {mode === "signup" ? "Account creation" : "Sign-in"} needs these two set. Donate Protocol
        never sees a Privy password — you authenticate with Privy directly.
      </p>
      <ul className="text-[11px] space-y-1.5">
        <li>
          <code className="text-teal-300">NEXT_PUBLIC_PRIVY_APP_ID</code>
          <span className="text-slate-500"> — from the Privy dashboard; public by design</span>
        </li>
        <li>
          <code className="text-teal-300">SESSION_SECRET</code>
          <span className="text-slate-500"> — 16+ chars, signs the session cookie</span>
        </li>
      </ul>
      <p className="text-[10px] text-slate-600 leading-relaxed pt-1">
        That is the whole list. Tokens are verified against Privy&apos;s public JWKS, so this app
        needs no Privy server credential at all — see the README.
      </p>
      <p className="text-[10px] text-slate-600 leading-relaxed">
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
