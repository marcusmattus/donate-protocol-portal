"use client"

import Link from "next/link"
import { useState, useEffect } from "react"

export function NavDark() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handler)
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <nav
      className={`sticky top-0 z-40 border-b border-teal-500/20 glass-panel px-6 py-3 flex items-center justify-between transition-all duration-300`}
    >
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 relative">
            <svg
              viewBox="0 0 40 40"
              className="w-full h-full text-teal-400 fill-current transform group-hover:rotate-180 transition-transform duration-700"
            >
              <path d="M20 2c-9.9 0-18 8.1-18 18s8.1 18 18 18 18-8.1 18-18-8.1-18-18-18zm0 32c-7.7 0-14-6.3-14-14s6.3-14 14-14 14 6.3 14 14-6.3 14-14 14z" />
              <path
                d="M26 14h-12v2h12v-2zm0 4h-12v2h12v-2zm0 4h-12v2h12v-2z"
                className="animate-pulse"
              />
            </svg>
          </div>
          <span
            style={{ fontFamily: "var(--font-jetbrains), monospace" }}
            className="font-extrabold tracking-tighter text-xl uppercase italic text-white"
          >
            Donate<span className="text-teal-400">.Protocol</span>
          </span>
        </Link>

        <div
          style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          className="hidden md:flex gap-6 text-xs uppercase tracking-widest text-slate-400"
        >
          <Link href="/" className="hover:text-teal-400 transition-colors">
            Infrastructure
          </Link>
          <Link href="/marketplace" className="hover:text-teal-400 transition-colors">
            Marketplace
          </Link>
          <Link href="/transparency" className="hover:text-teal-400 transition-colors">
            Security
          </Link>
          <Link href="/partner" className="hover:text-teal-400 transition-colors">
            Partners
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div
          style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 text-[10px]"
        >
          <span className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
          SOL MAINNET: $182.44
        </div>
        <Link
          href="/auth"
          style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          className="px-4 py-1.5 border border-teal-500 text-teal-400 text-xs uppercase tracking-tighter transition-all glass-panel hover:bg-teal-500/10"
        >
          Initialize_Auth
        </Link>
      </div>
    </nav>
  )
}
