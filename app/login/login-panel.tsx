"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { usePrivyAuth } from "@/hooks/use-privy-auth"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

/** Rendered only when Privy is configured — see the note in page.tsx. */
export function PrivyLoginPanel() {
  const auth = usePrivyAuth()
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next")

  // Only redirect once the *server* has a verified session. Redirecting on the
  // client's `authenticated` alone would land the user on a page that still
  // treats them as the demo user.
  useEffect(() => {
    if (auth.serverSession === "active") {
      router.replace(next && next.startsWith("/") ? next : "/dashboard")
    }
  }, [auth.serverSession, next, router])

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
            {auth.email && (
              <Row label="Email" value={auth.email} />
            )}
            {auth.walletAddress && (
              <Row
                label="Wallet"
                value={`${auth.walletAddress.slice(0, 6)}…${auth.walletAddress.slice(-4)}`}
              />
            )}
            {auth.userId && (
              <Row label="ID" value={`${auth.userId.slice(0, 18)}…`} />
            )}
          </dl>

          {auth.serverSession === "active" ? (
            <p className="text-[10px] text-lime-400">
              Session verified. Taking you to the dashboard…
            </p>
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
            Continue with Privy
          </button>
          <p className="text-[10px] text-slate-600 leading-relaxed">
            Opens Privy&apos;s own sign-in. Your credentials go to Privy, never to this app.
          </p>
          {auth.error && <p className="text-[10px] text-rose-400">{auth.error}</p>}
        </div>
      )}

      <div className="pt-2 border-t border-slate-800">
        <Link href="/" className="text-[10px] uppercase text-slate-500 hover:text-teal-300">
          ← Back home
        </Link>
      </div>
    </div>
  )
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
