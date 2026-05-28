import Link from "next/link"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const
const input = "w-full bg-slate-900 border border-slate-700 px-3 py-2 text-sm"

export default function OnboardProfilePage() {
  return (
    <div className="space-y-6">
      <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400">/onboard · step 04</div>
      <h1 className="text-3xl font-extrabold">Mission Profile</h1>
      <p className="text-slate-400 max-w-2xl">This content appears on your public marketplace listing.</p>

      <form className="glass-panel p-6 space-y-4" style={mono}>
        <label>
          <span className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">Tagline</span>
          <input className={input} placeholder="Solar microgrids for off-grid communities" />
        </label>
        <label>
          <span className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">Full Mission</span>
          <textarea rows={5} className={`${input} resize-none`} placeholder="Tell donors how their contribution becomes impact…" />
        </label>
        <div className="grid sm:grid-cols-2 gap-4">
          <label>
            <span className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">Country / Region</span>
            <input className={input} placeholder="Kenya" />
          </label>
          <label>
            <span className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">Beneficiaries Reached</span>
            <input className={input} placeholder="12,400" />
          </label>
        </div>
      </form>

      <div className="flex justify-between">
        <Link href="/onboard/wallet" className="px-4 py-2 text-[10px] uppercase border border-slate-700 text-slate-400" style={mono}>← Back</Link>
        <Link href="/onboard/media" className="px-5 py-2 bg-teal-400 text-slate-950 font-bold uppercase text-[11px]" style={mono}>Continue → Media</Link>
      </div>
    </div>
  )
}
