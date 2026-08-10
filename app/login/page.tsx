"use client"

import Link from "next/link"
import { AuthForm } from "@/components/auth-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-[#020617] text-slate-50 terminal-grid">
      <div className="hidden lg:flex flex-col justify-between w-[40%] border-r border-teal-500/20 p-12 relative overflow-hidden glass-panel">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute w-[500px] h-[500px] rounded-full blur-[200px] -top-48 -left-48 opacity-10"
            style={{ background: "#14b8a6" }}
          />
        </div>
        <Link href="/" className="relative z-10">
          <span
            style={{ fontFamily: "var(--font-jetbrains), monospace" }}
            className="font-extrabold tracking-tighter text-2xl uppercase italic text-white"
          >
            Donate<span className="text-teal-400">.Protocol</span>
          </span>
        </Link>
        <div className="relative z-10 space-y-4">
          <h2
            style={{ fontFamily: "var(--font-inter), sans-serif" }}
            className="text-4xl font-extrabold uppercase tracking-tighter leading-none"
          >
            Welcome
            <br />
            <span className="text-teal-400">back,</span>
            <br />
            Agent.
          </h2>
          <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
            Sign in with your email to access your dashboard, private wallet, and impact
            settings. Demo mode — no real funds required.
          </p>
        </div>
        <p
          className="relative z-10 text-[10px] text-teal-400/50"
          style={{ fontFamily: "var(--font-jetbrains), monospace" }}
        >
          / EMAIL_AUTH / SESSION_COOKIE /
        </p>
      </div>

      <div className="flex-grow flex flex-col">
        <div className="lg:hidden p-6 border-b border-slate-800">
          <Link href="/">
            <span
              style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              className="font-extrabold tracking-tighter text-xl uppercase italic text-white"
            >
              Donate<span className="text-teal-400">.Protocol</span>
            </span>
          </Link>
        </div>
        <div className="flex-grow flex items-center justify-center px-6 py-12">
          <AuthForm mode="login" redirectTo="/dashboard" showModeToggle={false} />
        </div>
      </div>
    </div>
  )
}
