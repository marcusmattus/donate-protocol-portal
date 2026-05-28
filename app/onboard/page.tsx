import Link from "next/link"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

const STEPS = [
  { href: "/onboard/apply", n: "01", label: "Apply", desc: "Organization profile & basic info" },
  { href: "/onboard/verify", n: "02", label: "Verification", desc: "KYB & 501(c)(3)/equivalent docs" },
  { href: "/onboard/wallet", n: "03", label: "Wallet Connect", desc: "Receive donations on Solana" },
  { href: "/onboard/profile", n: "04", label: "Mission Profile", desc: "Public marketplace listing" },
  { href: "/onboard/media", n: "05", label: "Media Upload", desc: "Logo, banners, impact photos" },
  { href: "/onboard/analytics", n: "06", label: "Analytics", desc: "Donor and route insights" },
  { href: "/onboard/dashboard", n: "07", label: "Donation Dashboard", desc: "Withdraw and report impact" },
]

export default function OnboardIndex() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400">/onboard</div>
        <h1 className="text-4xl md:text-5xl font-extrabold uppercase tracking-tighter">
          Charity <span className="text-teal-400">Onboarding</span>
        </h1>
        <p className="text-slate-400 max-w-2xl">
          List your organization on the Donate Protocol marketplace. The flow takes ~10 minutes; verification is reviewed within 24 hours.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        {STEPS.map((s) => (
          <Link key={s.href} href={s.href} className="glass-panel p-5 hover:border-teal-500/40 group">
            <div className="flex items-center justify-between">
              <span style={mono} className="text-[10px] uppercase text-teal-400">Step {s.n}</span>
              <span className="text-teal-400 group-hover:translate-x-1 transition-transform" style={mono}>→</span>
            </div>
            <div className="mt-2 text-xl font-bold text-white">{s.label}</div>
            <p className="text-sm text-slate-400 mt-1">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
