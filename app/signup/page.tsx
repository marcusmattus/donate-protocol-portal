import Link from "next/link"
import { NavDark } from "@/components/nav-dark"
import { isPrivyConfigured } from "@/lib/privy/config"
import { AuthPanel } from "@/components/auth-panel"
import { AuthNotConfigured } from "@/components/auth-not-configured"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

export const metadata = { title: "Create an account" }

/**
 * Rendered per request, not prerendered.
 *
 * These pages gate on whether Privy is configured. As a static page that gate
 * was evaluated once at build time and frozen into the HTML, so a deployment
 * that set NEXT_PUBLIC_PRIVY_APP_ID only at runtime served "Privy is not
 * configured" permanently.
 */
export const dynamic = "force-dynamic"


/**
 * Sign-up page.
 *
 * Privy has no separate sign-up call, so this page is the sign-in flow with the
 * intent reversed: it leads with wallet creation, and if the visitor turns out
 * to already have an account the panel says so and signs them in instead.
 *
 * The configured/unconfigured split happens here, at the component boundary,
 * because `usePrivy()` throws outside a mounted PrivyProvider and the provider
 * is a no-op without an app id. Branching here keeps the hook out of the
 * unconfigured render entirely, rather than calling it conditionally.
 */
export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 terminal-grid">
      <NavDark />
      <main className="max-w-md mx-auto px-6 py-20">
        <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400 text-center">
          /signup
        </div>
        <h1 className="text-center text-3xl md:text-4xl font-extrabold tracking-tighter mt-2">
          Create a <span className="text-teal-400">Donate Protocol</span> account
        </h1>
        <p style={mono} className="text-center text-[11px] text-slate-500 mt-3 leading-relaxed">
          Sign up with an email or a social account and Privy creates a Solana wallet for you — you
          do not need one already. Bring your own wallet if you have one.
        </p>

        <div className="mt-10">
          {isPrivyConfigured() ? <AuthPanel mode="signup" /> : <AuthNotConfigured mode="signup" />}
        </div>

        <p style={mono} className="text-center text-[10px] text-slate-600 mt-8 leading-relaxed">
          There is no password on this page. Privy holds the credential; this app only ever sees a
          token it verifies, which is why a breach here cannot leak your login.
        </p>

        <p style={mono} className="text-center text-[10px] text-slate-600 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-teal-400 hover:text-teal-300">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  )
}
