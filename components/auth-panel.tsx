"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { usePrivyAuth } from "@/hooks/use-privy-auth"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

export type AuthMode = "signup" | "signin"

/**
 * The sign-up and sign-in panel.
 *
 * One component for both, because Privy has one flow: `login()` creates an
 * account for a new user and signs in an existing one. Two components would
 * mean two copies of the exchange-and-redirect logic drifting apart over a
 * difference that is only ever copy and a destination.
 *
 * `mode` sets what the user was *trying* to do. What actually happened comes
 * back from the server as `isNewAccount`, and the two can disagree in both
 * directions — someone can land on /signup already having an account, or on
 * /login without one. The panel says so rather than pretending otherwise.
 *
 * Rendered only when Privy is configured; see the note in the page components.
 */
export function AuthPanel({
  mode,
  defaultNext = "/dashboard",
}: {
  mode: AuthMode
  /** Where to land when no ?next= is given. */
  defaultNext?: string
}) {
  const auth = usePrivyAuth()
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next")

  const isSignup = mode === "signup"

  // Redirect only once the *server* holds a verified session. Redirecting on
  // the client's `authenticated` alone would land the user on a page that still
  // treats them as the demo user.
  useEffect(() => {
    if (auth.serverSession !== "active") return
    // Only same-origin paths, so ?next= cannot be used to bounce someone to
    // another site straight after a successful login. "//evil.com" is a
    // protocol-relative URL, not a local path, so it has to be excluded too.
    const destination =
      next && next.startsWith("/") && !next.startsWith("//") ? next : defaultNext
    // A beat on a new account, so "account created" is readable rather than a
    // flash. Returning users get no artificial delay.
    const delay = auth.isNewAccount ? 900 : 0
    const timer = setTimeout(() => router.replace(destination), delay)
    return () => clearTimeout(timer)
  }, [auth.serverSession, auth.isNewAccount, next, defaultNext, router])

  if (!auth.ready) {
    return (
      <div className="glass-panel p-6 text-center" style={mono}>
        <span className="text-[11px] uppercase tracking-widest text-slate-500">Loading Privy…</span>
      </div>
    )
  }

  return (
    <div className="glass-panel p-5 space-y-4" style={mono}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-slate-500">Status</span>
        <StatusPill auth={auth} />
      </div>

      {auth.authenticated ? (
        <div className="space-y-3">
          <dl className="text-[11px] space-y-1.5">
            {auth.email && <Row label="Email" value={auth.email} />}
            {auth.walletAddress && (
              <Row
                label="Wallet"
                value={`${auth.walletAddress.slice(0, 6)}…${auth.walletAddress.slice(-4)}`}
              />
            )}
            {auth.userId && <Row label="ID" value={`${auth.userId.slice(0, 18)}…`} />}
          </dl>

          {auth.serverSession === "active" ? (
            <Outcome isSignup={isSignup} isNewAccount={auth.isNewAccount} />
          ) : auth.serverSession === "syncing" ? (
            <p className="text-[10px] text-teal-300">Verifying with the server…</p>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] text-amber-400 leading-relaxed">
                Signed in to Privy, but the server has not verified the session
                {auth.error ? `: ${auth.error}` : "."}
              </p>
              <button
                onClick={() => void auth.refresh()}
                className="w-full py-2 border border-teal-500/40 text-teal-300 text-[10px] uppercase hover:bg-teal-500/10"
              >
                Retry verification
              </button>
            </div>
          )}

          <button
            onClick={() => void auth.logout()}
            className="w-full py-2 border border-slate-700 text-slate-400 text-[10px] uppercase hover:border-rose-500/40 hover:text-rose-300"
          >
            Sign out
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={auth.login}
            className="w-full py-3 bg-teal-400 text-slate-950 font-bold uppercase text-[11px] hover:bg-teal-300"
          >
            {isSignup ? "Create account with Privy" : "Continue with Privy"}
          </button>
          <p className="text-[10px] text-slate-600 leading-relaxed">
            Opens Privy&apos;s own {isSignup ? "sign-up" : "sign-in"}. Your credentials go to Privy,
            never to this app — there is no password here to steal.
          </p>
          {auth.error && <p className="text-[10px] text-rose-400">{auth.error}</p>}
        </div>
      )}

      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
        <Link href="/" className="text-[10px] uppercase text-slate-500 hover:text-teal-300">
          ← Home
        </Link>
        {isSignup ? (
          <Link href="/login" className="text-[10px] uppercase text-slate-500 hover:text-teal-300">
            Have an account? Sign in
          </Link>
        ) : (
          <Link href="/signup" className="text-[10px] uppercase text-slate-500 hover:text-teal-300">
            New here? Create account
          </Link>
        )}
      </div>
    </div>
  )
}

/**
 * What the server says happened, which is not always what the page was for.
 *
 * `isNewAccount === null` means the exchange reported nothing either way; the
 * panel stays vague rather than guessing, since claiming "account created" to a
 * returning user is worse than a neutral sentence.
 */
function Outcome({ isSignup, isNewAccount }: { isSignup: boolean; isNewAccount: boolean | null }) {
  if (isNewAccount === true) {
    return (
      <p className="text-[10px] text-lime-400 leading-relaxed">
        Account created and verified{isSignup ? "" : " — you were new, so signing in made one"}.
        Taking you in…
      </p>
    )
  }
  if (isNewAccount === false) {
    return (
      <p className="text-[10px] text-lime-400 leading-relaxed">
        {isSignup
          ? "You already had an account — signed you in instead. Taking you in…"
          : "Welcome back. Session verified, taking you in…"}
      </p>
    )
  }
  return <p className="text-[10px] text-lime-400">Session verified. Taking you in…</p>
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-200 truncate">{value}</dd>
    </div>
  )
}

function StatusPill({ auth }: { auth: ReturnType<typeof usePrivyAuth> }) {
  const [text, cls] =
    auth.serverSession === "active"
      ? ["verified", "border-lime-500/40 text-lime-300"]
      : auth.serverSession === "syncing"
      ? ["verifying", "border-teal-500/40 text-teal-300"]
      : auth.serverSession === "unavailable"
      ? ["server not configured", "border-amber-500/40 text-amber-300"]
      : auth.serverSession === "error"
      ? ["error", "border-rose-500/40 text-rose-300"]
      : auth.authenticated
      ? ["client only", "border-amber-500/40 text-amber-300"]
      : ["signed out", "border-slate-700 text-slate-400"]

  return <span className={`px-2 py-0.5 border text-[9px] uppercase ${cls}`}>{text}</span>
}
