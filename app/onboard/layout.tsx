import { NavDark } from "@/components/nav-dark"

export default function OnboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 terminal-grid">
      <NavDark />
      <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
    </div>
  )
}
