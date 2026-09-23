"use client"

import { useMemo, useState } from "react"
import { TradingViewChart } from "@/components/tradingview-chart"
import {
  DEFAULT_RAMP,
  HARVEST_DAYS,
  HarvestCadence,
  RampConfig,
  compareRampToLumpSum,
  donationCadence,
  formatUsd,
} from "@/lib/charity-ramp"
import { RISK_META, YIELD_VENUES, findVenue } from "@/lib/yield-venues"
import { CHARITIES, shortWallet } from "@/lib/demo-data"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

const SOURCE_TOKENS: RampConfig["sourceToken"][] = ["USDC", "USDT", "SOL"]
const CADENCES: HarvestCadence[] = ["daily", "weekly", "monthly", "quarterly"]
const HORIZONS = [90, 180, 365, 730]

/** The pair worth watching while this ramp is live. */
function chartSymbol(config: RampConfig): string {
  const venue = findVenue(config.venueId)
  if (config.sourceToken === "SOL" || (venue && !venue.stable)) return "BINANCE:SOLUSDT"
  return "BINANCE:USDCUSDT"
}

function Stat({
  label,
  value,
  sub,
  accent = "text-slate-50",
}: {
  label: string
  value: string
  sub?: string
  accent?: string
}) {
  return (
    <div className="glass-panel p-4" style={mono}>
      <div className="text-[9px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`text-xl font-bold mt-1 tabular-nums ${accent}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-1">{sub}</div>}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-[9px] uppercase tracking-widest text-slate-500">{label}</span>
        {hint && <span className="text-[9px] text-slate-600">{hint}</span>}
      </div>
      <div className="mt-1.5">{children}</div>
    </label>
  )
}

const selectCls =
  "w-full bg-black/50 border border-slate-800 px-3 py-2 text-[11px] text-teal-300 outline-none focus:border-teal-500"

export default function CharityRampPage() {
  const [config, setConfig] = useState<RampConfig>(DEFAULT_RAMP)
  const [executing, setExecuting] = useState(false)
  const [receipt, setReceipt] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof RampConfig>(key: K, value: RampConfig[K]) {
    setConfig((c) => ({ ...c, [key]: value }))
    setReceipt(null)
  }

  // Pure + deterministic, so quoting is instant and needs no round-trip.
  const comparison = useMemo(() => compareRampToLumpSum(config), [config])
  const projection = comparison?.ramped ?? null
  const cadence = useMemo(() => (projection ? donationCadence(projection) : null), [projection])
  const venue = findVenue(config.venueId)
  const charity = CHARITIES.find((c) => c.id === config.charityId)

  async function execute() {
    setExecuting(true)
    setError(null)
    try {
      const res = await fetch("/api/ramp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...config, action: "execute" }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error ?? "ramp failed")
      setReceipt(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "ramp failed")
    } finally {
      setExecuting(false)
    }
  }

  if (!projection || !venue || !cadence || !comparison) {
    return <div style={mono} className="text-slate-400">Venue unavailable.</div>
  }

  const netToUser = projection.finalBalanceUsd - projection.deployedUsd
  const risk = RISK_META[venue.risk]

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400">
            /dashboard/ramp
          </div>
          <h1 className="text-2xl font-bold">Charity Swap Ramp</h1>
          <p style={mono} className="text-[11px] text-slate-500 mt-1 max-w-2xl">
            Ramp into a yield venue in tranches, keep the principal, stream the yield to a charity.
            Your stables never sit flat — idle USDC is lent out, and only what it earns is given away.
          </p>
        </div>
        <div className="glass-panel px-4 py-2" style={mono}>
          <div className="text-[9px] uppercase tracking-widest text-slate-500">Stable yield, live</div>
          <div className="text-lime-400 font-bold text-lg tabular-nums">{venue.apy.toFixed(2)}% APY</div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,340px)_1fr] gap-6">
        {/* ── Config ───────────────────────────────────────────── */}
        <section className="glass-panel p-4 space-y-4 self-start" style={mono}>
          <div className="text-[10px] uppercase tracking-widest text-teal-400 border-b border-slate-800 pb-2">
            Ramp Configuration
          </div>

          <Field label="Principal" hint="USD notional">
            <div className="flex">
              <input
                type="number"
                min={1}
                step={100}
                value={config.principalUsd}
                onChange={(e) => set("principalUsd", Math.max(1, Number(e.target.value) || 0))}
                className={`${selectCls} rounded-none`}
              />
              <select
                value={config.sourceToken}
                onChange={(e) => set("sourceToken", e.target.value as RampConfig["sourceToken"])}
                className="bg-slate-900 border border-l-0 border-slate-800 px-2 text-[11px] text-slate-300 outline-none"
              >
                {SOURCE_TOKENS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </Field>

          <Field label="Yield Venue" hint={`${risk.label} risk · ${venue.unlock}`}>
            <select
              value={config.venueId}
              onChange={(e) => set("venueId", e.target.value)}
              className={selectCls}
            >
              <optgroup label="Stable — principal stays in dollars">
                {YIELD_VENUES.filter((v) => v.stable).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} — {v.apy.toFixed(1)}% APY
                  </option>
                ))}
              </optgroup>
              <optgroup label="Liquid staking — principal rides SOL">
                {YIELD_VENUES.filter((v) => !v.stable).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} — {v.apy.toFixed(1)}% APY
                  </option>
                ))}
              </optgroup>
            </select>
            <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">{venue.description}</p>
          </Field>

          <Field label="Ramp Tranches" hint={`${config.tranches} × ${formatUsd(projection.principalUsd / config.tranches)}`}>
            <input
              type="range"
              min={1}
              max={24}
              value={config.tranches}
              onChange={(e) => set("tranches", Number(e.target.value))}
              className="w-full accent-teal-400"
            />
          </Field>

          <Field label="Tranche Interval" hint={`fully deployed in ${projection.rampDurationDays.toFixed(1)}d`}>
            <select
              value={config.intervalHours}
              onChange={(e) => set("intervalHours", Number(e.target.value))}
              className={selectCls}
            >
              <option value={1}>1 hour</option>
              <option value={4}>4 hours</option>
              <option value={12}>12 hours</option>
              <option value={24}>24 hours</option>
              <option value={168}>1 week</option>
            </select>
          </Field>

          <div className="border-t border-slate-800 pt-4 space-y-4">
            <Field label="Charity Split of Yield" hint={`${config.donationRatePct}% donated`}>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={config.donationRatePct}
                onChange={(e) => set("donationRatePct", Number(e.target.value))}
                className="w-full accent-lime-400"
              />
              <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                <span>keep all yield</span>
                <span>give all yield</span>
              </div>
            </Field>

            <Field label="Beneficiary">
              <select
                value={config.charityId}
                onChange={(e) => set("charityId", e.target.value)}
                className={selectCls}
              >
                {CHARITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.verified ? " ✓" : ""}
                  </option>
                ))}
              </select>
              {charity && (
                <p className="text-[10px] text-slate-500 mt-1.5">
                  {shortWallet(charity.wallet)} · impact {charity.impactScore}
                </p>
              )}
            </Field>

            <Field label="Harvest Cadence" hint={`every ${HARVEST_DAYS[config.harvestCadence]}d`}>
              <div className="grid grid-cols-4 gap-1">
                {CADENCES.map((c) => (
                  <button
                    key={c}
                    onClick={() => set("harvestCadence", c)}
                    className={`px-1 py-2 text-[9px] uppercase border ${
                      config.harvestCadence === c
                        ? "bg-teal-500/10 border-teal-500 text-teal-300"
                        : "border-slate-800 text-slate-500 hover:border-teal-500/40"
                    }`}
                  >
                    {c.slice(0, 5)}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Projection Horizon">
              <div className="grid grid-cols-4 gap-1">
                {HORIZONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => set("horizonDays", d)}
                    className={`px-1 py-2 text-[9px] uppercase border ${
                      config.horizonDays === d
                        ? "bg-teal-500/10 border-teal-500 text-teal-300"
                        : "border-slate-800 text-slate-500 hover:border-teal-500/40"
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <button
            onClick={execute}
            disabled={executing}
            className="w-full py-3 bg-lime-400 text-slate-950 font-bold uppercase text-[11px] hover:bg-lime-300 disabled:opacity-50"
          >
            {executing ? "Opening ramp…" : "Open Ramp Position"}
          </button>
          {error && <p className="text-[10px] text-rose-400">{error}</p>}
          <p className="text-[9px] text-slate-600 leading-relaxed">
            Simulated on Solana devnet. No real funds move and APY figures are demo values —
            wire each venue to its own rate API before mainnet.
          </p>
        </section>

        {/* ── Readout ──────────────────────────────────────────── */}
        <section className="space-y-6 min-w-0">
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <Stat
              label="Principal preserved"
              value={formatUsd(projection.deployedUsd, 0)}
              sub={`${formatUsd(projection.totalSwapCostUsd)} swap cost`}
            />
            <Stat
              label={`Yield · ${config.horizonDays}d`}
              value={formatUsd(projection.grossYieldUsd, 0)}
              sub={`${projection.effectiveApyPct.toFixed(2)}% effective APY`}
              accent="text-teal-300"
            />
            <Stat
              label="To charity"
              value={formatUsd(projection.donatedUsd, 0)}
              sub={`${formatUsd(cadence.perMonth)}/mo · ${cadence.harvestCount} harvests`}
              accent="text-lime-400"
            />
            <Stat
              label="Your net gain"
              value={formatUsd(netToUser, 0)}
              sub={`balance ${formatUsd(projection.finalBalanceUsd, 0)}`}
              accent={netToUser >= 0 ? "text-slate-50" : "text-rose-400"}
            />
          </div>

          <div className="glass-panel overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-2 border-b border-slate-800"
              style={mono}
            >
              <span className="text-[10px] uppercase tracking-widest text-teal-400">
                Market · {chartSymbol(config).split(":")[1]}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-slate-600">TradingView</span>
            </div>
            <TradingViewChart symbol={chartSymbol(config)} interval="60" height={360} />
          </div>

          <div className="grid xl:grid-cols-2 gap-6">
            <div className="glass-panel overflow-hidden">
              <div style={mono} className="px-4 py-2 border-b border-slate-800 text-[10px] uppercase tracking-widest text-teal-400">
                Ramp schedule · {projection.schedule.length} tranches
              </div>
              <div className="max-h-[260px] overflow-auto">
                <table className="w-full text-[11px]" style={mono}>
                  <thead className="bg-slate-900/60 text-[9px] uppercase text-slate-500 tracking-widest sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2">#</th>
                      <th className="text-left px-3 py-2">T+</th>
                      <th className="text-right px-3 py-2">Size</th>
                      <th className="text-right px-3 py-2">Impact</th>
                      <th className="text-right px-3 py-2">Deployed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {projection.schedule.map((t) => (
                      <tr key={t.index} className="hover:bg-slate-900/40">
                        <td className="px-3 py-2 text-slate-500">{t.index + 1}</td>
                        <td className="px-3 py-2 text-slate-400">{t.offsetHours}h</td>
                        <td className="px-3 py-2 text-right text-slate-300 tabular-nums">
                          {formatUsd(t.sizeUsd)}
                        </td>
                        <td className="px-3 py-2 text-right text-amber-400/80 tabular-nums">
                          {t.priceImpactPct.toFixed(3)}%
                        </td>
                        <td className="px-3 py-2 text-right text-teal-300 tabular-nums">
                          {formatUsd(t.deployedUsd)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass-panel overflow-hidden">
              <div style={mono} className="px-4 py-2 border-b border-slate-800 text-[10px] uppercase tracking-widest text-lime-400">
                Donation stream → {charity?.name}
              </div>
              <div className="max-h-[260px] overflow-auto">
                <table className="w-full text-[11px]" style={mono}>
                  <thead className="bg-slate-900/60 text-[9px] uppercase text-slate-500 tracking-widest sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2">Day</th>
                      <th className="text-right px-3 py-2">Yield</th>
                      <th className="text-right px-3 py-2">Donated</th>
                      <th className="text-right px-3 py-2">Compounded</th>
                      <th className="text-right px-3 py-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {projection.harvests.map((h) => (
                      <tr key={h.dayIndex} className="hover:bg-slate-900/40">
                        <td className="px-3 py-2 text-slate-500">D+{h.dayIndex}</td>
                        <td className="px-3 py-2 text-right text-slate-300 tabular-nums">
                          {formatUsd(h.yieldUsd)}
                        </td>
                        <td className="px-3 py-2 text-right text-lime-400 tabular-nums">
                          {formatUsd(h.donationUsd)}
                        </td>
                        <td className="px-3 py-2 text-right text-teal-300 tabular-nums">
                          {formatUsd(h.compoundedUsd)}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-400 tabular-nums">
                          {formatUsd(h.balanceUsd, 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="glass-panel p-4" style={mono}>
            <div className="text-[10px] uppercase tracking-widest text-teal-400 border-b border-slate-800 pb-2">
              Ramp vs. lump sum · {config.horizonDays}d
            </div>
            <div className="grid sm:grid-cols-3 gap-4 mt-3">
              <div>
                <div className="text-[9px] uppercase tracking-widest text-slate-500">Swap cost saved</div>
                <div className="text-lg font-bold text-lime-400 tabular-nums">
                  +{formatUsd(comparison.impactSavedUsd)}
                </div>
                <div className="text-[10px] text-slate-600 mt-1">smaller clips, less impact</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-widest text-slate-500">Yield given up</div>
                <div className="text-lg font-bold text-amber-400 tabular-nums">
                  −{formatUsd(comparison.yieldForgoneUsd)}
                </div>
                <div className="text-[10px] text-slate-600 mt-1">capital deployed later</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-widest text-slate-500">Net advantage</div>
                <div
                  className={`text-lg font-bold tabular-nums ${
                    comparison.netAdvantageUsd >= 0 ? "text-teal-300" : "text-rose-400"
                  }`}
                >
                  {comparison.netAdvantageUsd >= 0 ? "+" : "−"}
                  {formatUsd(Math.abs(comparison.netAdvantageUsd))}
                </div>
                <div className="text-[10px] text-slate-600 mt-1">
                  {comparison.netAdvantageUsd >= 0 ? "ramping wins here" : "lump sum wins here"}
                </div>
              </div>
            </div>
          </div>

          {receipt && (
            <div className="glass-panel p-4 border-lime-500/40" style={mono}>
              <div className="text-[10px] uppercase tracking-widest text-lime-400 border-b border-slate-800 pb-2">
                Position opened · {receipt.position.id}
              </div>
              <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mt-3 text-[11px]">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Venue</dt>
                  <dd className="text-slate-200">{receipt.position.venueName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Status</dt>
                  <dd className="text-teal-300 uppercase">{receipt.position.status}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Tranche 1 deployed</dt>
                  <dd className="text-slate-200 tabular-nums">
                    {formatUsd(receipt.firstTranche.deployedUsd)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Beneficiary</dt>
                  <dd className="text-lime-400">{receipt.position.charityName}</dd>
                </div>
                <div className="flex justify-between sm:col-span-2">
                  <dt className="text-slate-500">Deposit signature</dt>
                  <dd className="text-teal-300 truncate max-w-[60%]">
                    {receipt.position.depositSignatures[0]}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
