"use client"

import { useState } from "react"
import { CHARITIES, DEMO_USERS, shortWallet } from "@/lib/demo-data"

const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const

export default function SettingsPage() {
  const me = DEMO_USERS[0]
  const [donationRate, setDonationRate] = useState(2)
  const [defaultCharity, setDefaultCharity] = useState(me.defaultCharityId)
  const [autoExecute, setAutoExecute] = useState(true)
  const [telegramId, setTelegramId] = useState("")

  return (
    <div className="space-y-6">
      <header>
        <div style={mono} className="text-[10px] uppercase tracking-widest text-teal-400">/dashboard/settings</div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p style={mono} className="text-[11px] text-slate-500 mt-1">
          Configure agent risk, default routing, and notification channels. All values are saved on-chain to your Donation Vault PDA.
        </p>
      </header>

      <section className="glass-panel p-5 space-y-5" style={mono}>
        <Row label="Connected Wallet" value={`${me.name} · ${shortWallet(me.wallet)}`} />
        <Row label="Cluster" value="Solana Devnet · Helius RPC" />
        <Row label="TradingView Webhook" value="https://api.donate-protocol.example/webhooks/tradingview/demo123" />
        <Row label="OpenClaw Agent" value="openclaw://agent_01 · MCP linked" />
      </section>

      <section className="glass-panel p-5 space-y-5">
        <div style={mono} className="text-[11px] uppercase tracking-widest text-slate-300 border-b border-slate-800 pb-2">
          Donation Routing
        </div>

        <div className="space-y-2">
          <label style={mono} className="text-[10px] uppercase tracking-widest text-slate-400">
            Donation Rate · {donationRate}% of net P&L
          </label>
          <input
            type="range"
            min={0}
            max={10}
            step={0.5}
            value={donationRate}
            onChange={(e) => setDonationRate(parseFloat(e.target.value))}
            className="w-full accent-teal-400"
          />
        </div>

        <div className="space-y-2">
          <label style={mono} className="text-[10px] uppercase tracking-widest text-slate-400">
            Default Charity Destination
          </label>
          <select
            value={defaultCharity}
            onChange={(e) => setDefaultCharity(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
            style={mono}
          >
            {CHARITIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.category}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-3 cursor-pointer" style={mono}>
          <input type="checkbox" checked={autoExecute} onChange={(e) => setAutoExecute(e.target.checked)} className="accent-teal-400" />
          <span className="text-sm text-slate-300">Auto-execute signals that pass risk check</span>
        </label>
      </section>

      <section className="glass-panel p-5 space-y-3">
        <div style={mono} className="text-[11px] uppercase tracking-widest text-slate-300 border-b border-slate-800 pb-2">
          Telegram Mini App
        </div>
        <label style={mono} className="text-[10px] uppercase tracking-widest text-slate-400">Telegram User ID</label>
        <input
          type="text"
          placeholder="e.g. 12345678"
          value={telegramId}
          onChange={(e) => setTelegramId(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
          style={mono}
        />
        <p style={mono} className="text-[11px] text-slate-500">
          Start the bot at <span className="text-teal-300">@donate_protocol_bot</span> then send /start to link.
        </p>
      </section>

      <button
        style={mono}
        className="px-5 py-2.5 bg-teal-400 text-slate-950 font-bold uppercase tracking-widest hover:bg-lime-400"
      >
        Save Configuration
      </button>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-[10px] uppercase tracking-widest text-slate-500">{label}</span>
      <span className="text-slate-200 truncate">{value}</span>
    </div>
  )
}
