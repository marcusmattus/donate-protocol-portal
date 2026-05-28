import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import {
  CHARITIES,
  STRATEGIES,
  DEMO_USERS,
  RECENT_SIGNALS,
  DONATIONS,
  findCharity,
  findStrategy,
  formatUSD,
  shortWallet,
  runRiskCheck,
  simulateTradeAndDonation,
  mockJupiterQuote,
  generateDemoTx,
  type Charity,
  type Strategy,
  type DonationEvent,
  type TradeSignal,
} from "./data.js"

const CATEGORY = z.enum([
  "climate", "education", "healthcare", "children",
  "food", "disaster", "publicgoods", "animal", "humanitarian",
])

const SIDE = z.enum(["BUY", "SELL"])

function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] }
}

function err(message: string) {
  return { isError: true, content: [{ type: "text" as const, text: message }] }
}

/**
 * Registers every Donate Protocol tool on the MCP server.
 * Tools are grouped: discovery (charities/strategies), telemetry
 * (signals/donations), and the agent pipeline (risk → quote → trade → donate).
 */
export function registerTools(server: McpServer) {
  // ── Discovery ──────────────────────────────────────────────
  server.registerTool(
    "list_charities",
    {
      title: "List charities",
      description:
        "List charities on the Donate Protocol marketplace. Optionally filter by category or verification, and sort by raised/impact/followers.",
      inputSchema: {
        category: CATEGORY.optional(),
        verifiedOnly: z.boolean().optional(),
        sort: z.enum(["raised", "impact", "followers"]).optional(),
        limit: z.number().int().positive().max(100).optional(),
      },
    },
    async ({ category, verifiedOnly, sort, limit }) => {
      let rows = CHARITIES.filter(
        (c: Charity) => (!category || c.category === category) && (!verifiedOnly || c.verified),
      )
      if (sort === "raised") rows = [...rows].sort((a, b) => b.raised - a.raised)
      else if (sort === "impact") rows = [...rows].sort((a, b) => b.impactScore - a.impactScore)
      else if (sort === "followers") rows = [...rows].sort((a, b) => b.followers - a.followers)
      return json(rows.slice(0, limit ?? 50))
    },
  )

  server.registerTool(
    "get_charity",
    {
      title: "Get charity",
      description: "Fetch the full profile of a single charity by its id.",
      inputSchema: { id: z.string().min(1) },
    },
    async ({ id }) => {
      const c = findCharity(id)
      return c ? json(c) : err(`Charity not found: ${id}`)
    },
  )

  server.registerTool(
    "list_strategies",
    {
      title: "List strategies",
      description: "List copy-trading strategies with win rate, PnL, followers, and donation rate.",
      inputSchema: { trendingOnly: z.boolean().optional() },
    },
    async ({ trendingOnly }) =>
      json(trendingOnly ? STRATEGIES.filter((s: Strategy) => s.trending) : STRATEGIES),
  )

  server.registerTool(
    "get_strategy",
    {
      title: "Get strategy",
      description: "Fetch a single copy-trading strategy by id.",
      inputSchema: { id: z.string().min(1) },
    },
    async ({ id }) => {
      const s = findStrategy(id)
      return s ? json(s) : err(`Strategy not found: ${id}`)
    },
  )

  // ── Telemetry ──────────────────────────────────────────────
  server.registerTool(
    "list_signals",
    {
      title: "List signals",
      description: "List recent trade signals in the queue. Filter by source.",
      inputSchema: {
        source: z.enum(["tradingview", "openclaw", "copy"]).optional(),
        limit: z.number().int().positive().max(100).optional(),
      },
    },
    async ({ source, limit }) => {
      const rows = source ? RECENT_SIGNALS.filter((s: TradeSignal) => s.source === source) : RECENT_SIGNALS
      return json(rows.slice(0, limit ?? 20))
    },
  )

  server.registerTool(
    "list_donations",
    {
      title: "List donations",
      description: "List recent settled donation events with amounts, charities, and tx signatures.",
      inputSchema: {
        charityId: z.string().optional(),
        limit: z.number().int().positive().max(100).optional(),
      },
    },
    async ({ charityId, limit }) => {
      const rows = charityId ? DONATIONS.filter((d: DonationEvent) => d.toCharityId === charityId) : DONATIONS
      return json(rows.slice(0, limit ?? 20))
    },
  )

  server.registerTool(
    "get_leaderboard",
    {
      title: "Get leaderboard",
      description: "Top traders, strategies, and charities ranked by PnL, followers, and raised volume.",
      inputSchema: { board: z.enum(["traders", "strategies", "charities", "all"]).optional() },
    },
    async ({ board = "all" }) => {
      const traders = [...DEMO_USERS].sort((a, b) => b.pnl - a.pnl)
      const strategies = [...STRATEGIES].sort((a, b) => b.followers - a.followers)
      const charities = [...CHARITIES].sort((a, b) => b.raised - a.raised)
      const out: Record<string, unknown> = {}
      if (board === "traders" || board === "all") out.traders = traders
      if (board === "strategies" || board === "all") out.strategies = strategies
      if (board === "charities" || board === "all") out.charities = charities.slice(0, 10)
      return json(out)
    },
  )

  // ── Agent pipeline ─────────────────────────────────────────
  server.registerTool(
    "check_risk",
    {
      title: "Check risk",
      description:
        "Run the Donate Protocol risk engine over a prospective trade. Returns a 0-100 score and pass/fail with reasons.",
      inputSchema: {
        symbol: z.string().min(1),
        side: SIDE,
        price: z.number().positive(),
        size: z.number().positive(),
      },
    },
    async ({ symbol, side, price, size }) =>
      json(runRiskCheck({ symbol, side, price, size })),
  )

  server.registerTool(
    "get_jupiter_quote",
    {
      title: "Get Jupiter quote (mock)",
      description: "Simulate a Jupiter aggregator route quote for an SPL swap (devnet mock).",
      inputSchema: {
        inMint: z.string().optional(),
        outMint: z.string().optional(),
        inAmount: z.number().positive(),
      },
    },
    async ({ inMint, outMint, inAmount }) =>
      json(
        mockJupiterQuote({
          inMint: inMint ?? "So11111111111111111111111111111111111111112",
          outMint: outMint ?? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          inAmount,
        }),
      ),
  )

  server.registerTool(
    "simulate_signal",
    {
      title: "Simulate signal end-to-end",
      description:
        "Run the full OpenClaw pipeline for a signal: ingest → risk → Jupiter quote → simulated trade → donation routing. Returns ordered step outputs plus the final donation.",
      inputSchema: {
        symbol: z.string().min(1),
        side: SIDE,
        price: z.number().positive(),
        size: z.number().positive(),
        strategyId: z.string().optional(),
        charityId: z.string().optional(),
      },
    },
    async ({ symbol, side, price, size, strategyId, charityId }) => {
      const strategy = findStrategy(strategyId ?? "momentum-alpha") ?? STRATEGIES[0]
      const charity = findCharity(charityId ?? "solar-future") ?? CHARITIES[0]
      const steps: { step: string; status: "ok" | "fail"; data: unknown }[] = []

      steps.push({ step: "ingest_signal", status: "ok", data: { symbol, side, price, size, strategy: strategy.name } })

      const risk = runRiskCheck({ symbol, side, price, size })
      steps.push({ step: "risk_check", status: risk.ok ? "ok" : "fail", data: risk })
      if (!risk.ok) return json({ ok: false, steps })

      const quote = mockJupiterQuote({
        inMint: "So11111111111111111111111111111111111111112",
        outMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        inAmount: size,
      })
      steps.push({ step: "jupiter_quote", status: "ok", data: quote })

      const trade = simulateTradeAndDonation({
        symbol, side, price, size,
        donationRatePct: strategy.donationRate,
        charityName: charity.name,
        charityWallet: charity.wallet,
      })
      steps.push({ step: "submit_trade", status: "ok", data: trade })
      steps.push({
        step: "trigger_donation",
        status: "ok",
        data: { amount: trade.donationAmount, to: charity.name, wallet: charity.wallet, tx: trade.txSignature },
      })
      steps.push({ step: "publish_dashboard", status: "ok", data: { broadcasted: true, topic: "trade.completed" } })
      steps.push({
        step: "notify_telegram",
        status: "ok",
        data: { message: `Trade executed: ${symbol} ${side} · profit $${trade.pnl.toFixed(2)} · donated $${trade.donationAmount.toFixed(2)} → ${charity.name}` },
      })

      return json({
        ok: true,
        steps,
        trade,
        donation: { to: charity.name, amount: trade.donationAmount, wallet: charity.wallet, tx: trade.txSignature },
      })
    },
  )

  server.registerTool(
    "route_donation",
    {
      title: "Route a donation",
      description:
        "Route a fixed donation amount to a charity wallet (devnet simulation). Appends a settled DonationEvent and returns the transaction signature.",
      inputSchema: {
        charityId: z.string().min(1),
        amount: z.number().positive().max(100_000),
        from: z.string().optional(),
        sourceTrade: z.string().optional(),
      },
    },
    async ({ charityId, amount, from, sourceTrade }) => {
      const charity = findCharity(charityId)
      if (!charity) return err(`Charity not found: ${charityId}`)
      const tx = generateDemoTx("Tx")
      const event: DonationEvent = {
        id: `don-${Date.now()}`,
        ts: Date.now(),
        amount,
        fromUser: from ? `wallet:${shortWallet(from)}` : "agent",
        toCharityId: charity.id,
        toCharity: charity.name,
        sourceTrade: sourceTrade ?? "manual",
        txSignature: tx,
        status: "settled",
      }
      DONATIONS.unshift(event)
      charity.raised += amount
      charity.donationsCount += 1
      return json({ ok: true, event, txSignature: tx, explorer: `https://explorer.solana.com/tx/${tx}?cluster=devnet` })
    },
  )

  server.registerTool(
    "ingest_tradingview_webhook",
    {
      title: "Ingest TradingView webhook",
      description:
        "Accept a raw TradingView alert payload, normalize it into a signal, and enqueue it for the agent. Mirrors POST /api/webhooks/tradingview/:token.",
      inputSchema: {
        symbol: z.string().min(1),
        side: SIDE.optional(),
        price: z.union([z.number(), z.string()]),
        size: z.union([z.number(), z.string()]).optional(),
        strategy: z.string().optional(),
      },
    },
    async ({ symbol, side, price, size, strategy }) => {
      const signal: TradeSignal = {
        id: `sig-${Date.now()}`,
        ts: Date.now(),
        symbol: symbol.toUpperCase(),
        side: side ?? "BUY",
        price: typeof price === "string" ? parseFloat(price) : price,
        size: size == null ? 10 : typeof size === "string" ? parseFloat(size) : size,
        strategy: strategy ?? "Momentum Alpha",
        source: "tradingview",
        status: "queued",
      }
      RECENT_SIGNALS.unshift(signal)
      return json({ ok: true, signal, queued: true })
    },
  )

  server.registerTool(
    "get_protocol_stats",
    {
      title: "Get protocol stats",
      description: "Aggregate protocol KPIs: total raised, charities, strategies, donors, and recent volume.",
      inputSchema: {},
    },
    async () => {
      const totalRaised = CHARITIES.reduce((a: number, c: Charity) => a + c.raised, 0)
      const totalDonations = DONATIONS.reduce((a: number, d: DonationEvent) => a + d.amount, 0)
      return json({
        charities: CHARITIES.length,
        verifiedCharities: CHARITIES.filter((c: Charity) => c.verified).length,
        strategies: STRATEGIES.length,
        totalRaised,
        totalRaisedDisplay: formatUSD(totalRaised),
        settledDonations: DONATIONS.length,
        donationVolume: totalDonations,
        donationVolumeDisplay: formatUSD(totalDonations),
        cluster: "devnet",
      })
    },
  )
}
