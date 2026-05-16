import Link from "next/link"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

export default function VerifyPage() {
  return (
    <div className="space-y-6">
      <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400">/onboard · step 02</div>
      <h1 className="text-3xl font-extrabold">Verification</h1>

      <div className="glass-panel p-6 space-y-4" style={mono}>
        <p className="text-slate-300 text-sm">Provide one of the following documents to receive a verified badge.</p>
        <ul className="text-[12px] text-slate-400 space-y-1 list-disc list-inside">
          <li>501(c)(3) determination letter (US)</li>
          <li>Charity Commission registration (UK/EU)</li>
          <li>DAO governance proof + multisig signers</li>
          <li>Local NGO registration document</li>
        </ul>

        <div className="border border-dashed border-slate-700 p-8 text-center mt-4">
          <div className="text-sm text-slate-300">Drag & drop document</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">PDF · PNG · JPG · max 10MB</div>
        </div>

        <label className="block">
          <span className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">Public Reference URL</span>
          <input className="w-full bg-slate-900 border border-slate-700 px-3 py-2 text-sm" placeholder="https://irs.gov/…" />
        </label>

        <div className="flex justify-between pt-4">
          <Link href="/onboard/apply" className="px-4 py-2 text-[10px] uppercase border border-slate-700 text-slate-400">← Back</Link>
          <Link href="/onboard/wallet" className="px-5 py-2 bg-teal-400 text-slate-950 font-bold uppercase text-[11px]">Continue → Wallet</Link>
        </div>
      </div>
    </div>
  )
}
