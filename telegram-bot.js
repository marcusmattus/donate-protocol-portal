#!/usr/bin/env node

/**
 * Donate Protocol Telegram Bot
 * Demo implementation with realistic trading/donation notifications
 *
 * Usage:
 * TELEGRAM_BOT_TOKEN=your_token node telegram-bot.js
 */

const http = require("http")
const https = require("https")
const fs = require("fs")

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const WEBHOOK_URL = process.env.WEBHOOK_URL || "http://localhost:3001"
const BOT_PORT = process.env.BOT_PORT || 3001

if (!BOT_TOKEN) {
  console.error("Error: TELEGRAM_BOT_TOKEN environment variable not set")
  process.exit(1)
}

// Telegram API helper
function sendTelegramMessage(chatId, text, options = {}) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      chat_id: chatId,
      text: text,
      parse_mode: "HTML",
      ...options,
    })

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?${params}`

    https
      .get(url, (res) => {
        let data = ""
        res.on("data", (chunk) => {
          data += chunk
        })
        res.on("end", () => {
          resolve(JSON.parse(data))
        })
      })
      .on("error", (err) => {
        reject(err)
      })
  })
}

// Demo trade notifications
const DEMO_NOTIFICATIONS = [
  {
    type: "trade",
    user: "Marcus Alpha",
    symbol: "SOLUSDT",
    action: "BUY",
    amount: "50",
    price: "181.20",
    pnl: "+412.20",
  },
  {
    type: "donation",
    user: "Marcus Alpha",
    charity: "Solar Future Foundation",
    amount: "20.61",
    percentage: "5%",
  },
  {
    type: "trade",
    user: "Sarah Quant",
    symbol: "SOLUSDT",
    action: "SELL",
    amount: "100",
    price: "182.50",
    pnl: "+1,832.40",
  },
  {
    type: "donation",
    user: "Sarah Quant",
    charity: "Open Water Relief",
    amount: "91.62",
    percentage: "5%",
  },
]

// Format messages
function formatTradeNotification(data) {
  return (
    `📊 <b>Trade Executed</b>\n\n` +
    `👤 <b>${data.user}</b>\n` +
    `📈 ${data.action} ${data.amount} ${data.symbol}\n` +
    `💰 Price: $${data.price}\n` +
    `🎯 PnL: <b>${data.pnl}</b>\n\n` +
    `<i>Strategy autotraded via Donate Protocol</i>`
  )
}

function formatDonationNotification(data) {
  return (
    `🎁 <b>Donation Generated</b>\n\n` +
    `👤 <b>${data.user}</b>\n` +
    `💚 Destination: <b>${data.charity}</b>\n` +
    `💵 Amount: <b>$${data.amount}</b>\n` +
    `📊 From Profit: <b>${data.percentage}</b>\n\n` +
    `<i>Your trading generated impact ✨</i>`
  )
}

function formatPortfolioResponse(wallet) {
  return (
    `📊 <b>Your Portfolio</b>\n\n` +
    `💳 Wallet: <code>${wallet.slice(0, 6)}...${wallet.slice(-4)}</code>\n` +
    `💰 Total Volume: $125,000\n` +
    `📈 PnL This Month: +$5,932 (4.7%)\n` +
    `💚 Total Donated: $217\n` +
    `📱 Active Strategies: 1\n` +
    `🏅 Followed Charities: 2\n\n` +
    `<i>Use /dashboard for full details</i>`
  )
}

function formatLeaderboard() {
  return (
    `🏆 <b>Global Leaderboard</b>\n\n` +
    `1️⃣ Sarah Quant\n` +
    `   📈 PnL: +$19,102\n` +
    `   💚 Donated: $1,100\n\n` +
    `2️⃣ Marcus Alpha\n` +
    `   📈 PnL: +$5,932\n` +
    `   💚 Donated: $217\n\n` +
    `3️⃣ CryptoNova\n` +
    `   📈 PnL: +$2,240\n` +
    `   💚 Donated: $77\n\n` +
    `<i>Updated every hour</i>`
  )
}

// Handle incoming messages
async function handleMessage(message) {
  const chatId = message.chat.id
  const text = message.text || ""
  const userName = message.from.first_name

  console.log(`📨 Message from ${userName}: ${text}`)

  if (text === "/start") {
    await sendTelegramMessage(
      chatId,
      `🚀 <b>Welcome to Donate Protocol</b>\n\n` +
        `Transform your trading into impact.\n\n` +
        `Available commands:\n` +
        `/portfolio - View your holdings\n` +
        `/pnl - Check your P&L\n` +
        `/donations - Donation history\n` +
        `/charities - Browse verified causes\n` +
        `/leaderboard - Global rankings\n` +
        `/settings - Configure preferences\n\n` +
        `Let's start trading with purpose! 💚`
    )
  } else if (text === "/portfolio") {
    await sendTelegramMessage(chatId, formatPortfolioResponse("7XYDemo222"))
  } else if (text === "/leaderboard") {
    await sendTelegramMessage(chatId, formatLeaderboard())
  } else if (text === "/pnl") {
    await sendTelegramMessage(
      chatId,
      `📈 <b>Your P&L</b>\n\n` +
        `This Month: +$5,932 (4.7%)\n` +
        `This Week: +$1,204 (1.2%)\n` +
        `Today: +$412 (0.3%)\n\n` +
        `🎯 Win Rate: 73%\n` +
        `📊 Total Trades: 24\n\n` +
        `💚 Generated Impact: $217 in donations`
    )
  } else if (text === "/donations") {
    await sendTelegramMessage(
      chatId,
      `💚 <b>Your Donations</b>\n\n` +
        `Today:\n` +
        `• $20.61 → Solar Future Foundation\n` +
        `• $8.24 → Kids First DAO\n\n` +
        `This Week: $127.43\n` +
        `This Month: $217.82\n\n` +
        `🌍 Total Impact: $217\n` +
        `🏥 Lives Improved: ~45 people`
    )
  } else if (text === "/charities") {
    await sendTelegramMessage(
      chatId,
      `🌍 <b>Featured Charities</b>\n\n` +
        `1. <b>Solar Future Foundation</b>\n` +
        `   Climate | $410K raised | 98/100 impact\n\n` +
        `2. <b>Open Water Relief</b>\n` +
        `   Water | $1.4M raised | 99/100 impact\n\n` +
        `3. <b>Kids First DAO</b>\n` +
        `   Education | $180K raised | 94/100 impact\n\n` +
        `Use /settings to choose your charities`
    )
  } else if (text === "/demo") {
    // Trigger demo notifications
    const notification = DEMO_NOTIFICATIONS[Math.floor(Math.random() * DEMO_NOTIFICATIONS.length)]

    if (notification.type === "trade") {
      await sendTelegramMessage(chatId, formatTradeNotification(notification))
    } else {
      await sendTelegramMessage(chatId, formatDonationNotification(notification))
    }
  } else {
    await sendTelegramMessage(
      chatId,
      `I didn't understand that command. Try:\n` +
        `/portfolio\n/pnl\n/donations\n/charities\n/leaderboard\n/settings`
    )
  }
}

// HTTP Server for webhook
const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/webhook") {
    let body = ""

    req.on("data", (chunk) => {
      body += chunk.toString()
    })

    req.on("end", async () => {
      try {
        const update = JSON.parse(body)
        console.log(`🔔 Webhook received:`, JSON.stringify(update, null, 2))

        if (update.message) {
          await handleMessage(update.message)
        }

        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ ok: true }))
      } catch (error) {
        console.error("Error handling webhook:", error)
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ ok: false, error: error.message }))
      }
    })
  } else if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ status: "healthy", bot: "donate-protocol" }))
  } else {
    res.writeHead(404, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ error: "Not found" }))
  }
})

// Start server
server.listen(BOT_PORT, () => {
  console.log(`🤖 Telegram bot running on port ${BOT_PORT}`)
  console.log(`📨 Webhook ready at ${WEBHOOK_URL}/webhook`)
  console.log(`🔗 Bot token: ${BOT_TOKEN.slice(0, 10)}...`)
})

// Handle errors
server.on("error", (err) => {
  console.error("Server error:", err)
  process.exit(1)
})

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down bot...")
  server.close(() => {
    console.log("✅ Bot stopped")
    process.exit(0)
  })
})
