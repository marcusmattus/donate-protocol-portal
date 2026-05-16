"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { z } from "zod"
import { Charity, shortWallet } from "@/lib/demo-data"
import { generateDemoTx } from "@/lib/solana"
import { useWallet } from "@/components/wallet-context"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

const PRESET_AMOUNTS = [5, 25, 100, 500] as const
const ASSETS = ["USDC", "SOL", "JUP"] as const

const schema = z.object({
  amount: z.number({ invalid_type_error: "Enter a valid amount" })
    .positive("Amount must be greater than zero")
    .max(100_000, "For demo donations are capped at $100,000"),
  asset: z.enum(ASSETS),
  recurring: z.boolean(),
})

type Step = "form" | "confirm" | "submitting" | "done"

export function DonateModal({
  charity,
  open,
  onClose,
}: {
  charity: Charity
  open: boolean
  onClose: () => void
}) {
  const { wallet } = useWallet()
  const [step, setStep] = useState<Step>("form")
  const [amount, setAmount] = useState<number>(25)
  const [asset, setAsset] = useState<(typeof ASSETS)[number]>("USDC")
  const [recurring, setRecurring] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tx, setTx] = useState<string>("")

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStep("form")
        setAmount(25)
        setAsset("USDC")
        setRecurring(false)
        setError(null)
        setTx("")
      }, 200)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const fee = useMemo(() => Math.max(0.000005, amount * 0.0001), [amount])
  const net = useMemo(() => Math.max(0, amount - fee), [amount, fee])

  function validateAndNext() {
    const parsed = schema.safeParse({ amount, asset, recurring })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid donation")
      return
    }
    if (!wallet) {
      setError("Connect a wallet first to send donations.")
      return
    }
    setError(null)
    setStep("confirm")
  }

  async function confirm() {
    setStep("submitting")
    try {
      const res = await fetch("/api/donate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          charityId: charity.id,
          amount,
          asset,
          recurring,
          from: wallet?.publicKey,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Donation failed")
      }
      setTx(data.txSignature ?? generateDemoTx("Tx"))
      setStep("done")
      toast.success(`Donated ${asset === "USDC" ? "$" : ""}${amount.toFixed(2)} ${asset} → ${charity.name}`)
    } catch (err: any) {
      toast.error(err?.message ?? "Donation failed")
      setStep("form")
    }
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="donate-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg glass-panel border-teal-500/30 bg-slate-950/95 relative"
      >
        <header className="flex items-start justify-between p-5 border-b border-slate-800">
          <div>
            <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400">Donate</div>
            <h2 id="donate-title" className="text-xl font-bold text-white mt-1">{charity.name}</h2>
            <div style={mono} className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
              {charity.category} · {shortWallet(charity.wallet)}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-white text-xl leading-none px-2">×</button>
        </header>

        {step === "form" && (
          <div className="p-5 space-y-5">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2" style={mono}>Amount</label>
              <div className="flex items-center gap-2 mb-2">
                {PRESET_AMOUNTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmount(p)}
                    className={`flex-1 py-2 text-sm border transition-colors ${
                      amount === p
                        ? "bg-teal-500/10 border-teal-500 text-teal-300"
                        : "border-slate-700 text-slate-400 hover:border-teal-500/40"
                    }`}
                    style={mono}
                  >
                    ${p}
                  </button>
                ))}
              </div>
              <div className="flex">
                <span className="px-3 grid place-items-center bg-slate-900 border border-r-0 border-slate-700 text-slate-500" style={mono}>$</span>
                <input
                  inputMode="decimal"
                  type="number"
                  min={0}
                  step={0.01}
                  value={Number.isFinite(amount) ? amount : ""}
                  onChange={(e) => setAmount(parseFloat(e.target.value))}
                  className="flex-1 bg-slate-900 border border-slate-700 px-3 py-2 text-lg text-white focus:outline-none focus:border-teal-500"
                  style={mono}
                  placeholder="0.00"
                />
                <select
                  value={asset}
                  onChange={(e) => setAsset(e.target.value as (typeof ASSETS)[number])}
                  className="bg-slate-900 border border-l-0 border-slate-700 px-3 text-sm text-slate-200"
                  style={mono}
                >
                  {ASSETS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="accent-teal-400"
              />
              <span className="text-sm text-slate-300">Recurring · automate this donation every month</span>
            </label>

            <div className="grid grid-cols-3 gap-2 text-center" style={mono}>
              <Cell label="Network fee" value={`~${fee.toFixed(6)}`} />
              <Cell label="Net to charity" value={asset === "USDC" ? `$${net.toFixed(2)}` : `${net.toFixed(4)} ${asset}`} />
              <Cell label="Cluster" value="Devnet" />
            </div>

            {error && (
              <div style={mono} className="text-[11px] text-rose-300 border border-rose-500/40 bg-rose-500/5 px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-slate-700 text-slate-300 text-[11px] uppercase hover:border-teal-500/40"
                style={mono}
              >
                Cancel
              </button>
              <button
                onClick={validateAndNext}
                className="flex-[2] px-4 py-3 bg-teal-400 text-slate-950 font-bold uppercase text-[11px] hover:bg-lime-400"
                style={mono}
              >
                Review Donation
              </button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="p-5 space-y-4" style={mono}>
            <div className="text-[11px] uppercase tracking-widest text-slate-400">Confirm details</div>
            <dl className="text-sm divide-y divide-slate-800/60">
              <Row label="Amount" value={`${asset === "USDC" ? "$" : ""}${amount.toFixed(2)} ${asset}`} />
              <Row label="To" value={charity.name} />
              <Row label="Wallet" value={shortWallet(charity.wallet)} />
              <Row label="From" value={wallet ? shortWallet(wallet.publicKey) : "—"} />
              <Row label="Recurring" value={recurring ? "Monthly" : "One-time"} />
              <Row label="Net to charity" value={asset === "USDC" ? `$${net.toFixed(2)}` : `${net.toFixed(4)} ${asset}`} />
            </dl>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setStep("form")} className="flex-1 px-4 py-3 border border-slate-700 text-slate-300 text-[11px] uppercase hover:border-teal-500/40">← Back</button>
              <button onClick={confirm} className="flex-[2] px-4 py-3 bg-lime-400 text-slate-950 font-bold uppercase text-[11px] hover:bg-teal-400">
                Sign & Send
              </button>
            </div>
          </div>
        )}

        {step === "submitting" && (
          <div className="p-10 text-center space-y-4" style={mono}>
            <div className="mx-auto w-10 h-10 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
            <div className="text-[11px] uppercase tracking-widest text-slate-400">Submitting to Solana devnet…</div>
            <div className="text-[10px] text-slate-500">Awaiting confirmations</div>
          </div>
        )}

        {step === "done" && (
          <div className="p-6 space-y-4" style={mono}>
            <div className="text-[10px] uppercase tracking-widest text-lime-400">Donation settled</div>
            <h3 className="text-2xl font-bold text-white">
              Thank you. {asset === "USDC" ? `$${amount.toFixed(2)}` : `${amount.toFixed(4)} ${asset}`} routed to {charity.name}.
            </h3>
            <div className="text-[11px] text-slate-400">A receipt has been added to your portfolio.</div>
            <div className="p-3 bg-black/50 border border-slate-800">
              <div className="text-[10px] uppercase tracking-widest text-slate-500">Transaction</div>
              <div className="text-[11px] text-teal-300 break-all mt-1">{tx}</div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={onClose} className="flex-1 px-4 py-3 border border-slate-700 text-slate-300 text-[11px] uppercase hover:border-teal-500/40">Close</button>
              <a
                href={`https://explorer.solana.com/tx/${tx}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 px-4 py-3 bg-teal-400 text-slate-950 font-bold uppercase text-[11px] text-center hover:bg-lime-400"
              >
                View on Explorer
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 bg-slate-900/60 border border-slate-800">
      <div className="text-[9px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className="text-sm text-teal-300 mt-0.5">{value}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[10px] uppercase tracking-widest text-slate-500">{label}</span>
      <span className="text-slate-200">{value}</span>
    </div>
  )
}
