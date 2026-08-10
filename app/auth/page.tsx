"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthForm } from "@/components/auth-form"

const WALLETS = [
  {
    id: "phantom",
    name: "Phantom",
    desc: "Solana-native, Mobile + Extension",
    icon: (
      <svg viewBox="0 0 128 128" className="w-full h-full" fill="none">
        <rect width="128" height="128" rx="20" fill="url(#phg)" />
        <defs>
          <linearGradient id="phg" x1="0" x2="128" y1="0" y2="128" gradientUnits="userSpaceOnUse">
            <stop stopColor="#534bb1" />
            <stop offset="1" stopColor="#551bf9" />
          </linearGradient>
        </defs>
        <ellipse cx="64" cy="64" rx="28" ry="30" fill="white" opacity="0.95" />
        <circle cx="52" cy="60" r="5" fill="url(#phg)" />
        <circle cx="76" cy="60" r="5" fill="url(#phg)" />
        <path
          d="M50 74 Q64 84 78 74"
          stroke="url(#phg)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    ),
  },
  {
    id: "solflare",
    name: "Solflare",
    desc: "Ledger Support + DeFi Focused",
    icon: (
      <svg viewBox="0 0 128 128" className="w-full h-full" fill="none">
        <rect width="128" height="128" rx="20" fill="url(#sfg)" />
        <defs>
          <linearGradient
            id="sfg"
            x1="0"
            x2="1"
            y1="0"
            y2="1"
            gradientUnits="objectBoundingBox"
          >
            <stop stopColor="#fc6f2a" />
            <stop offset="1" stopColor="#f4a533" />
          </linearGradient>
        </defs>
        <path d="M64 28 L90 90 H38 Z" fill="white" opacity="0.9" />
        <path d="M52 60 L76 60 L64 90 Z" fill="url(#sfg)" />
      </svg>
    ),
  },
  {
    id: "backpack",
    name: "Backpack",
    desc: "xNFT runtime, multi-chain",
    icon: (
      <svg viewBox="0 0 128 128" className="w-full h-full" fill="none">
        <rect width="128" height="128" rx="20" fill="#111" />
        <rect x="30" y="50" width="68" height="50" rx="8" fill="white" opacity="0.9" />
        <rect
          x="44"
          y="34"
          width="40"
          height="22"
          rx="6"
          stroke="white"
          strokeWidth="5"
          fill="none"
        />
        <path d="M54 75 H74" stroke="#111" strokeWidth="5" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function AuthPage() {
  const router = useRouter()
  const [connecting, setConnecting] = useState<string | null>(null)

  function connectWallet(id: string) {
    setConnecting(id)
    setTimeout(() => {
      router.push("/auth/onboarding")
    }, 2000)
  }

  return (
    <div className="min-h-screen flex bg-[#020617] text-slate-50 terminal-grid">
      <div className="hidden lg:flex flex-col justify-between w-[45%] xl:w-[40%] border-r border-teal-500/20 p-12 relative overflow-hidden glass-panel">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute w-[500px] h-[500px] rounded-full blur-[200px] -top-48 -left-48 opacity-10"
            style={{ background: "#14b8a6" }}
          />
          <div
            className="absolute w-[300px] h-[300px] rounded-full blur-[150px] bottom-0 right-0 opacity-5"
            style={{ background: "#84cc16" }}
          />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2">
            <span
              style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              className="font-extrabold tracking-tighter text-2xl uppercase italic text-white"
            >
              Donate<span className="text-teal-400">.Protocol</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[10px] uppercase tracking-widest"
            style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            Email auth ready
          </div>

          <h2
            style={{ fontFamily: "var(--font-inter), sans-serif" }}
            className="text-4xl font-extrabold uppercase tracking-tighter leading-none"
          >
            Welcome
            <br />
            <span className="text-teal-400">Back,</span>
            <br />
            Agent.
          </h2>

          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            Sign in with email, or connect a wallet. Dedicated pages also live at{" "}
            <Link href="/login" className="text-teal-400 hover:underline">
              /login
            </Link>{" "}
            and{" "}
            <Link href="/signup" className="text-teal-400 hover:underline">
              /signup
            </Link>
            .
          </p>
        </div>

        <div
          className="relative z-10 text-[10px] text-teal-400/50 leading-tight"
          style={{ fontFamily: "var(--font-jetbrains), monospace" }}
        >
          <span>/ DONATE.PROTOCOL.SEC v2.4.0 / EMAIL_SESSION /</span>
        </div>
      </div>

      <div className="flex-grow flex flex-col">
        <div className="lg:hidden p-6 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2">
            <span
              style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              className="font-extrabold tracking-tighter text-xl uppercase italic text-white"
            >
              Donate<span className="text-teal-400">.Protocol</span>
            </span>
          </Link>
        </div>

        <div className="flex-grow flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-md space-y-8">
            <AuthForm mode="login" redirectTo="/auth/onboarding" />

            <div className="flex items-center gap-4">
              <div className="flex-grow h-px bg-slate-800" />
              <span
                className="text-[10px] text-slate-600 uppercase tracking-widest"
                style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              >
                or connect wallet
              </span>
              <div className="flex-grow h-px bg-slate-800" />
            </div>

            <div className="space-y-3">
              {WALLETS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => connectWallet(w.id)}
                  disabled={connecting !== null}
                  className={`w-full glass-panel p-4 flex items-center gap-4 hover:border-teal-500 transition-all group disabled:opacity-40 ${
                    connecting === w.id ? "border-teal-500" : ""
                  }`}
                >
                  <div className="w-10 h-10 shrink-0">{w.icon}</div>
                  <div className="text-left flex-grow">
                    <div
                      className="font-bold text-sm text-white group-hover:text-teal-400 transition-colors"
                      style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                    >
                      {w.name}
                    </div>
                    <div
                      className="text-[10px] text-slate-500 uppercase tracking-widest"
                      style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                    >
                      {w.desc}
                    </div>
                  </div>
                  {connecting === w.id ? (
                    <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg
                      className="w-5 h-5 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-1 transition-all"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
