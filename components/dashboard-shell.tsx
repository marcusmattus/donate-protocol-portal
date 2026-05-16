"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NavDark } from "@/components/nav-dark"

const NAV = [
  { href: "/dashboard", label: "Overview", code: "00" },
  { href: "/dashboard/signals", label: "Signals", code: "01" },
  { href: "/dashboard/strategies", label: "Strategies", code: "02" },
  { href: "/dashboard/portfolio", label: "Portfolio", code: "03" },
  { href: "/dashboard/donations", label: "Donation Impact", code: "04" },
  { href: "/marketplace", label: "Marketplace", code: "05" },
  { href: "/dashboard/leaderboard", label: "Leaderboard", code: "06" },
  { href: "/dashboard/settings", label: "Settings", code: "07" },
]

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 terminal-grid">
      <NavDark />
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6 grid lg:grid-cols-[220px_1fr] gap-6">
        <aside className="lg:sticky lg:top-20 self-start glass-panel p-3 space-y-1"
          style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
          <div className="text-[9px] uppercase tracking-widest text-slate-500 px-2 pb-2 border-b border-slate-800 mb-2">
            Operator Console
          </div>
          {NAV.map((n) => {
            const active = path === n.href || (n.href !== "/dashboard" && path?.startsWith(n.href))
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center justify-between px-2 py-2 text-[11px] uppercase tracking-tighter transition-colors ${
                  active
                    ? "bg-teal-500/10 text-teal-300 border-l-2 border-teal-400"
                    : "text-slate-400 hover:text-teal-300 hover:bg-slate-900/60 border-l-2 border-transparent"
                }`}
              >
                <span>{n.label}</span>
                <span className="text-slate-600">{n.code}</span>
              </Link>
            )
          })}
          <div className="mt-4 pt-3 border-t border-slate-800 text-[9px] uppercase tracking-widest text-slate-500 px-2">
            Env: Solana Devnet
          </div>
        </aside>
        <main className="min-w-0 space-y-6">{children}</main>
      </div>
    </div>
  )
}
