"use client"

import type { TradingViewSetupStep } from "@/lib/tradingview"

export function TradingViewSetupChecklist({
  steps,
  onToggle,
}: {
  steps: TradingViewSetupStep[]
  onToggle?: (stepId: TradingViewSetupStep["id"], completed: boolean) => void
}) {
  const required = steps.filter((s) => !s.optional)
  const done = required.filter((s) => s.completed).length

  return (
    <div className="glass-panel p-6 border-teal-500/20">
      <div className="flex items-center justify-between mb-4 gap-4">
        <h3
          className="text-sm font-bold uppercase tracking-tighter text-white"
          style={{ fontFamily: "var(--font-jetbrains), monospace" }}
        >
          Setup checklist
        </h3>
        <span
          className="text-[10px] text-slate-500 uppercase tracking-widest"
          style={{ fontFamily: "var(--font-jetbrains), monospace" }}
        >
          {done}/{required.length} required
        </span>
      </div>

      <div className="h-1 bg-slate-900 mb-6">
        <div
          className="h-full bg-teal-400 transition-all"
          style={{ width: `${required.length ? (done / required.length) * 100 : 0}%` }}
        />
      </div>

      <ul className="space-y-3">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={`border p-4 flex gap-3 ${
              step.completed
                ? "border-lime-500/30 bg-lime-500/5"
                : "border-slate-800 bg-black/20"
            }`}
          >
            <button
              type="button"
              aria-label={step.completed ? "Mark incomplete" : "Mark complete"}
              onClick={() => onToggle?.(step.id, !step.completed)}
              className={`mt-0.5 w-5 h-5 shrink-0 border flex items-center justify-center text-[10px] ${
                step.completed
                  ? "border-lime-400 bg-lime-400 text-slate-950"
                  : "border-slate-600 text-transparent hover:border-teal-400"
              }`}
            >
              ✓
            </button>
            <div className="min-w-0">
              <div
                className="text-sm font-bold text-white flex items-center gap-2 flex-wrap"
                style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              >
                <span className="text-slate-500 text-[10px]">{index + 1}.</span>
                {step.label}
                {step.optional && (
                  <span className="text-[9px] uppercase tracking-widest text-slate-500 border border-slate-700 px-1.5 py-0.5">
                    Optional
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
