import Link from "next/link"
import { NavDark } from "@/components/nav-dark"
import { isPrivyConfigured } from "@/lib/privy/config"
import { AuthPanel } from "@/components/auth-panel"
import { AuthNotConfigured } from "@/components/auth-not-configured"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

export const metadata = { title: "Private wallet access" }

/**
 * Rendered per request — see the note in app/login/page.tsx. A static page
 * freezes the "is Privy configured" gate at build time.
 */
export const dynamic = "force-dynamic"

/**
 * Private wallet access.
 *
 * This page used to be an email/password form with login and sign-up tabs,
 * posting to `/api/auth/login` and `/api/auth/signup`. Neither endpoint has ever
 * existed, so both tabs returned a 404 whose HTML failed `response.json()`, and
 * the page reported "Network error. Please try again." — a password form that
 * could not succeed, and that told the user the wrong reason.
 *
 * It now uses the same Privy flow as the rest of the app, which means three
 * things stop being true: no password is collected here, the credential is held
 * by Privy rather than by us, and the session the page produces is one the
 * server actually verified against Privy's JWKS.
 *
 * `defaultNext` sends people to /private-wallet rather than /dashboard, so the
 * page keeps its purpose: it is the door to the wallet area, not a second
 * generic login.
 */
export default function PrivateWalletLoginPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 terminal-grid">
      <NavDark />
      <main className="max-w-md mx-auto px-6 py-20">
        <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400 text-center">
          /private-wallet
        </div>
        <h1 className="text-center text-3xl md:text-4xl font-extrabold tracking-tighter mt-2">
          Private <span className="text-teal-400">wallet</span> access
        </h1>
        <p style={mono} className="text-center text-[11px] text-slate-500 mt-3 leading-relaxed">
          Sign in to reach your wallets and exchange connections. Same account as the rest of
          Donate Protocol — there is no separate password for this area.
        </p>

        <div className="mt-10">
          {isPrivyConfigured() ? (
            <AuthPanel mode="signin" defaultNext="/private-wallet" />
          ) : (
            <AuthNotConfigured mode="signin" />
          )}
        </div>

        <p style={mono} className="text-center text-[10px] text-slate-600 mt-8 leading-relaxed">
          Signing in identifies you. It grants no trading authority on its own — execution still
          passes the risk engine and your own policy.
        </p>

        <p style={mono} className="text-center text-[10px] text-slate-600 mt-4">
          No account yet?{" "}
          <Link href="/signup" className="text-teal-400 hover:text-teal-300">
            Create one
          </Link>
        </p>
      </main>
    </div>
  )
}
