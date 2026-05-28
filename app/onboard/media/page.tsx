import Link from "next/link"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

export default function OnboardMediaPage() {
  return (
    <div className="space-y-6">
      <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400">/onboard · step 05</div>
      <h1 className="text-3xl font-extrabold">Media Upload</h1>
      <p className="text-slate-400 max-w-2xl">Upload your logo, banner, and impact photography. Stored on Arweave via Bundlr.</p>

      <div className="grid sm:grid-cols-2 gap-4">
        {["Logo · 1:1", "Banner · 16:9", "Impact Photo 1", "Impact Photo 2"].map((slot) => (
          <div key={slot} className="glass-panel p-8 text-center border-dashed border-slate-700">
            <div className="text-sm text-slate-300">Drop image here</div>
            <div style={mono} className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{slot}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <Link href="/onboard/profile" className="px-4 py-2 text-[10px] uppercase border border-slate-700 text-slate-400" style={mono}>← Back</Link>
        <Link href="/onboard/analytics" className="px-5 py-2 bg-teal-400 text-slate-950 font-bold uppercase text-[11px]" style={mono}>Continue → Analytics</Link>
      </div>
    </div>
  )
}
