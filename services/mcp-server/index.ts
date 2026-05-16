// Donate Protocol — MCP server scaffold
// Exposes Donate Protocol tools to OpenClaw or any MCP-compatible agent.
// Run with: pnpm tsx services/mcp-server/index.ts

import { CHARITIES, DONATIONS, RECENT_SIGNALS, STRATEGIES, findCharity, findStrategy } from "../../lib/demo-data"
import { runRiskCheck, simulateTradeAndDonation } from "../../lib/solana"

interface JsonRpcReq {
  jsonrpc: "2.0"
  id: number | string
  method: string
  params?: any
}

interface JsonRpcRes {
  jsonrpc: "2.0"
  id: number | string
  result?: any
  error?: { code: number; message: string }
}

const TOOLS = [
  {
    name: "list_charities",
    description: "List verified charities available on Donate Protocol.",
    input_schema: { type: "object", properties: { category: { type: "string" } } },
  },
  {
    name: "get_charity",
    description: "Get the full profile of a charity by id.",
    input_schema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "list_strategies",
    description: "List copy-trading strategies.",
    input_schema: { type: "object" },
  },
  {
    name: "list_signals",
    description: "List recent signals from the trading queue.",
    input_schema: { type: "object", properties: { limit: { type: "number" } } },
  },
  {
    name: "list_donations",
    description: "List recent donation events.",
    input_schema: { type: "object", properties: { limit: { type: "number" } } },
  },
  {
    name: "simulate_signal",
    description: "Risk-check and simulate a TradingView signal end-to-end, including donation routing.",
    input_schema: {
      type: "object",
      properties: {
        symbol: { type: "string" },
        side: { type: "string", enum: ["BUY", "SELL"] },
        price: { type: "number" },
        size: { type: "number" },
        strategyId: { type: "string" },
        charityId: { type: "string" },
      },
      required: ["symbol", "side", "price", "size"],
    },
  },
]

function handleTool(name: string, args: any): unknown {
  switch (name) {
    case "list_charities": {
      const cat = args?.category
      return cat ? CHARITIES.filter((c) => c.category === cat) : CHARITIES
    }
    case "get_charity":
      return findCharity(args?.id) ?? null
    case "list_strategies":
      return STRATEGIES
    case "list_signals":
      return RECENT_SIGNALS.slice(0, args?.limit ?? 20)
    case "list_donations":
      return DONATIONS.slice(0, args?.limit ?? 20)
    case "simulate_signal": {
      const strategy = findStrategy(args.strategyId ?? "momentum-alpha") ?? STRATEGIES[0]
      const charity = findCharity(args.charityId ?? "solar-future") ?? CHARITIES[0]
      const risk = runRiskCheck({ symbol: args.symbol, side: args.side, size: args.size, price: args.price })
      if (!risk.ok) return { ok: false, risk }
      const trade = simulateTradeAndDonation({
        symbol: args.symbol, side: args.side, price: args.price, size: args.size,
        donationRatePct: strategy.donationRate, charityName: charity.name, charityWallet: charity.wallet,
      })
      return { ok: true, risk, trade, donation: { to: charity.name, wallet: charity.wallet, amount: trade.donationAmount, tx: trade.txSignature } }
    }
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

function handle(req: JsonRpcReq): JsonRpcRes {
  try {
    if (req.method === "initialize") {
      return { jsonrpc: "2.0", id: req.id, result: { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "donate-protocol", version: "0.1.0" } } }
    }
    if (req.method === "tools/list") {
      return { jsonrpc: "2.0", id: req.id, result: { tools: TOOLS } }
    }
    if (req.method === "tools/call") {
      const { name, arguments: args } = req.params ?? {}
      const out = handleTool(name, args ?? {})
      return { jsonrpc: "2.0", id: req.id, result: { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] } }
    }
    return { jsonrpc: "2.0", id: req.id, error: { code: -32601, message: "Method not found" } }
  } catch (err: any) {
    return { jsonrpc: "2.0", id: req.id, error: { code: -32000, message: err?.message ?? "internal" } }
  }
}

if (require.main === module) {
  process.stdin.setEncoding("utf8")
  let buf = ""
  process.stdin.on("data", (chunk) => {
    buf += chunk
    const lines = buf.split("\n")
    buf = lines.pop() ?? ""
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const req: JsonRpcReq = JSON.parse(trimmed)
        const res = handle(req)
        process.stdout.write(JSON.stringify(res) + "\n")
      } catch (err) {
        // ignore malformed line
      }
    }
  })
  process.stderr.write("[mcp] donate-protocol server ready (stdio json-rpc)\n")
}
