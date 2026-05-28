// Donate Protocol — Telegram Bot
// Demo-only command surface. Replace `mockApi` with real Donate Protocol API calls
// in production. Run with: `BOT_TOKEN=… pnpm tsx services/telegram-bot/index.ts`

import { CHARITIES, DEMO_USERS, DONATIONS, RECENT_SIGNALS, STRATEGIES, formatUSD } from "../../lib/demo-data"

interface TgMessage {
  message_id: number
  from?: { id: number; first_name: string; username?: string }
  chat: { id: number; type: string }
  text?: string
}

const BOT_TOKEN = process.env.BOT_TOKEN ?? "demo-token"
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`

async function send(chatId: number, text: string) {
  if (BOT_TOKEN === "demo-token") {
    console.log(`[demo:tg → ${chatId}]\n${text}\n`)
    return
  }
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  })
}

function fmt(lines: string[]): string {
  return lines.join("\n")
}

export async function handleCommand(msg: TgMessage): Promise<void> {
  const text = (msg.text ?? "").trim()
  const chatId = msg.chat.id
  const me = DEMO_USERS[0]

  if (text.startsWith("/start")) {
    await send(chatId, fmt([
      "*Donate Protocol* — agentic trading + automated giving on Solana.",
      "",
      "Commands:",
      "/portfolio · view balances and PnL",
      "/pnl · realized P&L summary",
      "/signals · live signal feed",
      "/donations · your routed impact",
      "/charities · marketplace top picks",
      "/leaderboard · top traders this week",
      "",
      "Mini App: open the dashboard inside Telegram via the menu button.",
    ]))
    return
  }

  if (text.startsWith("/portfolio")) {
    await send(chatId, fmt([
      `*Portfolio · ${me.name}*`,
      `Wallet: ${me.wallet.slice(0, 6)}…${me.wallet.slice(-4)}`,
      `Value: ~$39,701 (devnet sim)`,
      `Realized PnL: +${formatUSD(me.pnl)}`,
      `Auto-donations: ${formatUSD(me.donations)}`,
    ]))
    return
  }

  if (text.startsWith("/pnl")) {
    const trades = RECENT_SIGNALS.filter((s) => typeof s.pnl === "number")
    const total = trades.reduce((a, s) => a + (s.pnl ?? 0), 0)
    await send(chatId, fmt([
      `*PnL · last ${trades.length} trades*`,
      ...trades.slice(0, 5).map((s) => `· ${s.symbol} ${s.side} → ${s.pnl! >= 0 ? "+" : ""}$${s.pnl!.toFixed(2)}`),
      ``,
      `Total: ${total >= 0 ? "+" : ""}$${total.toFixed(2)}`,
    ]))
    return
  }

  if (text.startsWith("/signals")) {
    await send(chatId, fmt([
      "*Latest Signals*",
      ...RECENT_SIGNALS.slice(0, 5).map((s) => `· ${s.symbol} ${s.side} @ ${s.price} · ${s.strategy} · ${s.status}`),
    ]))
    return
  }

  if (text.startsWith("/donations")) {
    await send(chatId, fmt([
      "*Donation Receipts*",
      ...DONATIONS.slice(0, 5).map((d) => `· $${d.amount.toFixed(2)} → ${d.toCharity}`),
    ]))
    return
  }

  if (text.startsWith("/charities")) {
    await send(chatId, fmt([
      "*Top Charities*",
      ...CHARITIES.slice(0, 5).map((c) => `· ${c.name} — ${formatUSD(c.raised)} · ${c.category}`),
    ]))
    return
  }

  if (text.startsWith("/leaderboard")) {
    const top = [...STRATEGIES].sort((a, b) => b.followers - a.followers).slice(0, 5)
    await send(chatId, fmt([
      "*Top Strategies*",
      ...top.map((s, i) => `${i + 1}. ${s.name} — +${s.pnlPct}% · ${s.followers.toLocaleString()} followers`),
    ]))
    return
  }

  await send(chatId, "Unknown command. Try /start")
}

// Long-polling demo loop
async function poll(offset = 0): Promise<void> {
  if (BOT_TOKEN === "demo-token") {
    console.log("Telegram bot running in demo mode (no BOT_TOKEN). Simulating /start handler:")
    await handleCommand({ message_id: 1, chat: { id: 0, type: "private" }, text: "/start" })
    return
  }
  const res = await fetch(`${TELEGRAM_API}/getUpdates?timeout=30&offset=${offset}`)
  const data: { ok: boolean; result: { update_id: number; message?: TgMessage }[] } = await res.json()
  let nextOffset = offset
  for (const u of data.result ?? []) {
    nextOffset = u.update_id + 1
    if (u.message) await handleCommand(u.message)
  }
  await poll(nextOffset)
}

if (require.main === module) {
  poll().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
