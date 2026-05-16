import Link from "next/link"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

export default function OnboardAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400">/onboard · step 06</div>
      <h1 className="text-3xl font-extrabold">Analytics Preview</h1>
      <p className="text-slate-400 max-w-2xl">Sample dashboard your charity will see once live.</p>

      <div className="grid sm:grid-cols-3 gap-3" style={mono}>
        <Kpi label="Donors Last 30d" value="412" />
        <Kpi label="Avg Donation" value="$18.42" />
        <Kpi label="Top Source" value="Momentum Alpha" />
      </div>

      <div className="glass-panel p-5">
        <div style={mono} className="text-[11px] uppercase tracking-widest text-slate-300 border-b border-slate-800 pb-2">Volume (Demo)</div>
        <div className="flex items-end gap-1 h-32 mt-4">
          {[18, 32, 25, 40, 48, 55, 70, 60, 88, 72, 95, 110, 92, 130].map((h, i) => (
            <div key={i} className="flex-1 bg-gradient-to-t from-teal-400 to-lime-400" style={{ height: `${(h / 130) * 100}%` }} />
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Link href="/onboard/media" className="px-4 py-2 text-[10px] uppercase border border-slate-700 text-slate-400" style={mono}>← Back</Link>
        <Link href="/onboard/dashboard" className="px-5 py-2 bg-teal-400 text-slate-950 font-bold uppercase text-[11px]" style={mono}>Continue → Dashboard</Link>
      </div>
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-panel p-4">
      <div style={mono} className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</div>
      <div className="text-2xl font-bold mt-1 text-teal-300" style={mono}>{value}</div>
    </div>
  )
}
