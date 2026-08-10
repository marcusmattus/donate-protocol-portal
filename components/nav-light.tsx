"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { AuthNav } from "@/components/auth-nav"

export function NavLight() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handler)
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled ? "py-4 glass-card" : "py-8"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-slate-900">
        <Link href="/" className="flex items-center gap-2 group">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl rotate-3 shadow-lg group-hover:rotate-0 transition-transform"
            style={{ backgroundColor: "#4f46e5", fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            D
          </div>
          <span
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
            className="font-bold text-2xl tracking-tight text-slate-900"
          >
            Donate<span className="text-teal-500">.</span>
          </span>
        </Link>

        <div
          className="hidden md:flex items-center gap-10 font-semibold text-sm uppercase tracking-widest"
          style={{ fontFamily: "var(--font-outfit), sans-serif" }}
        >
          <Link href="/#how-it-works" className="hover:text-teal-500 transition-colors">
            Mechanism
          </Link>
          <Link href="/#impact" className="hover:text-teal-500 transition-colors">
            Impact
          </Link>
          <Link href="/transparency" className="hover:text-teal-500 transition-colors">
            Security
          </Link>
          <Link href="/partner" style={{ color: "#4f46e5" }} className="hover:opacity-70 transition-opacity">
            Partner with Us
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <AuthNav variant="light" />
          <Link
            href="/waitlist"
            className="hidden sm:inline-flex bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold text-sm tracking-tight hover:scale-105 transition-transform active:scale-95 shadow-xl"
            style={{ fontFamily: "var(--font-outfit), sans-serif" }}
          >
            Join Waitlist
          </Link>
        </div>
      </div>
    </nav>
  )
}
