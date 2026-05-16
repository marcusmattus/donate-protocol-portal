"use client"

import Link from "next/link"
import { useState } from "react"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

const CATEGORIES = [
  "Climate", "Education", "Healthcare", "Children", "Food Support",
  "Disaster Relief", "Web3 Public Goods", "Animal Welfare", "Humanitarian",
]

export default function ApplyPage() {
  const [submitted, setSubmitted] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  function toggle(cat: string) {
    setSelected((s) => (s.includes(cat) ? s.filter((c) => c !== cat) : [...s, cat]))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="glass-panel p-10 text-center space-y-4">
        <div style={mono} className="text-[10px] uppercase tracking-widest text-lime-400">Application received</div>
        <h1 className="text-3xl font-extrabold">Thanks — we will review within 24 hours.</h1>
        <p className="text-slate-400">Continue with verification while we evaluate your application.</p>
        <Link href="/onboard/verify" className="inline-block px-6 py-3 bg-teal-400 text-slate-950 font-bold uppercase text-sm" style={mono}>
          Continue → Verification
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Header step="01" title="Apply To List" />
      <form onSubmit={submit} className="glass-panel p-6 space-y-5">
        <Grid>
          <Field label="Organization Name" required><input required name="organizationName" placeholder="Solar Future Foundation" className={input} style={mono} /></Field>
          <Field label="Country" required><input required name="country" placeholder="Kenya" className={input} style={mono} /></Field>
          <Field label="Website" required><input required type="url" name="website" placeholder="https://" className={input} style={mono} /></Field>
          <Field label="Contact Email" required><input required type="email" name="email" placeholder="ops@…" className={input} style={mono} /></Field>
          <Field label="Twitter / X"><input name="twitter" placeholder="@handle" className={input} style={mono} /></Field>
          <Field label="Telegram / Discord"><input name="social" placeholder="@channel" className={input} style={mono} /></Field>
        </Grid>

        <Field label="Mission Description" required>
          <textarea required rows={4} name="description" placeholder="Briefly describe your mission and how funds will be used…" className={`${input} resize-none`} style={mono} />
        </Field>

        <div>
          <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2" style={mono}>Categories</label>
          <div className="flex flex-wrap gap-2" style={mono}>
            {CATEGORIES.map((c) => (
              <button type="button" key={c} onClick={() => toggle(c)} className={`px-3 py-1.5 text-[10px] uppercase border ${selected.includes(c) ? "bg-teal-500/10 border-teal-500 text-teal-300" : "border-slate-800 text-slate-400 hover:border-teal-500/40"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="w-full px-6 py-3 bg-teal-400 text-slate-950 font-bold uppercase tracking-widest hover:bg-lime-400" style={mono}>
          Submit Application
        </button>
      </form>
    </div>
  )
}

const input = "w-full bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-teal-500"

function Header({ step, title }: { step: string; title: string }) {
  return (
    <div>
      <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400">/onboard · step {step}</div>
      <h1 className="text-3xl font-extrabold">{title}</h1>
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1.5" style={mono}>
        {label}{required && <span className="text-rose-400 ml-1">*</span>}
      </span>
      {children}
    </label>
  )
}
