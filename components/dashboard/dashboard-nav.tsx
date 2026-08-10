"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

const LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/signals", label: "Signals" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/connect/tradingview", label: "TradingView" },
]

export function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="fixed top-0 left-0 right-0 z-40 border-b border-slate-800 bg-black/50 backdrop-blur px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="flex items-center gap-3 text-sm flex-wrap"
          style={{ fontFamily: "var(--font-jetbrains), monospace" }}
        >
          <Link href="/" className="text-teal-400 hover:text-lime-400 transition">
            HOME
          </Link>
          <span className="text-slate-600">/</span>
          <Link href="/dashboard" className="text-white hover:text-teal-400 transition">
            DASHBOARD
          </Link>
          {pathname !== "/dashboard" && (
            <>
              <span className="text-slate-600">/</span>
              <span className="text-slate-400 uppercase">
                {pathname.split("/").filter(Boolean).slice(-1)[0]}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          {LINKS.map((link) => {
            const active =
              link.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                className={`text-[10px] uppercase tracking-widest transition ${
                  active ? "text-lime-400" : "text-slate-400 hover:text-slate-200"
                }`}
                style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              >
                {link.label}
              </button>
            )
          })}
          <button
            onClick={() => router.push("/marketplace")}
            className="text-slate-400 hover:text-slate-200 transition text-[10px] uppercase tracking-widest"
          >
            Marketplace
          </button>
        </div>
      </div>
    </div>
  )
}
