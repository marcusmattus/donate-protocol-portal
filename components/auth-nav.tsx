"use client"

import Link from "next/link"
import { useAuth } from "@/components/auth-provider"

export function AuthNav({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const { user, status, isAuthenticated, logout } = useAuth()

  if (status === "loading") {
    return (
      <span
        className={
          variant === "dark"
            ? "text-[10px] uppercase tracking-widest text-slate-500"
            : "text-xs text-slate-500"
        }
        style={{ fontFamily: "var(--font-jetbrains), monospace" }}
      >
        …
      </span>
    )
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/dashboard"
          className={
            variant === "dark"
              ? "hidden sm:inline text-[10px] uppercase tracking-widest text-slate-400 hover:text-teal-400 transition-colors max-w-[140px] truncate"
              : "hidden sm:inline text-xs font-semibold text-slate-600 hover:text-teal-600 max-w-[140px] truncate"
          }
          style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          title={user.email}
        >
          {user.email}
        </Link>
        <button
          type="button"
          onClick={() => void logout()}
          className={
            variant === "dark"
              ? "px-3 py-1.5 border border-slate-700 text-slate-300 text-[10px] uppercase tracking-widest hover:border-teal-500 hover:text-teal-400 transition-all"
              : "px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 hover:text-teal-600"
          }
          style={{ fontFamily: "var(--font-jetbrains), monospace" }}
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className={
          variant === "dark"
            ? "px-3 py-1.5 text-[10px] uppercase tracking-widest text-slate-400 hover:text-teal-400 transition-colors"
            : "px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 hover:text-teal-600"
        }
        style={{ fontFamily: "var(--font-jetbrains), monospace" }}
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        className={
          variant === "dark"
            ? "px-4 py-1.5 border border-teal-500 text-teal-400 text-[10px] uppercase tracking-tighter transition-all glass-panel hover:bg-teal-500/10"
            : "bg-slate-900 text-white px-5 py-2.5 rounded-full font-bold text-xs tracking-tight hover:scale-105 transition-transform"
        }
        style={{
          fontFamily:
            variant === "dark"
              ? "var(--font-jetbrains), monospace"
              : "var(--font-outfit), sans-serif",
        }}
      >
        Sign up
      </Link>
    </div>
  )
}
