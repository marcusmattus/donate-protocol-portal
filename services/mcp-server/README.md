# Donate Protocol — MCP Server

A Model Context Protocol server that exposes the Donate Protocol agent surface to
OpenClaw or any MCP-compatible host (Claude Desktop, Claude Code, custom agents).

Built on `@modelcontextprotocol/sdk`. All Solana interactions are **devnet
simulations** — no real funds move. Data is shared with the web app via
`../../lib/demo-data.ts`, so the agent and UI never drift.

## Run

```bash
pnpm install          # from this directory
pnpm dev              # stdio transport (most agents)
pnpm dev:http         # streamable HTTP on :8787/mcp (remote agents)
pnpm smoke            # in-process client exercises every tool/resource/prompt
pnpm typecheck        # tsc --noEmit
pnpm inspect          # open the MCP Inspector against the stdio server
```

## Tools (13)

| Tool | Purpose |
| --- | --- |
| `list_charities` | Filter/sort the charity marketplace |
| `get_charity` | Full charity profile by id |
| `list_strategies` / `get_strategy` | Copy-trading strategies |
| `list_signals` | Recent signals in the queue |
| `list_donations` | Settled donation events |
| `get_leaderboard` | Top traders / strategies / charities |
| `check_risk` | Risk engine score for a prospective trade |
| `get_jupiter_quote` | Mock Jupiter route quote |
| `simulate_signal` | Full pipeline: ingest → risk → quote → trade → donate |
| `route_donation` | Send a donation to a charity wallet (devnet) |
| `ingest_tradingview_webhook` | Normalize a raw TradingView alert into a signal |
| `get_protocol_stats` | Aggregate protocol KPIs |

## Resources

- `donate://charities` — full registry
- `donate://strategies` — strategy book
- `donate://signals` — live signal feed
- `donate://donations` — donation ledger
- `donate://charity/{id}` — single charity (templated)

## Prompts

- `process_signal` — agent playbook for an incoming signal
- `recommend_charity` — pick the best destination for a cause + budget
- `impact_report` — generate an impact report from the ledger

## Wire it into a host

### Claude Desktop / Claude Code (stdio)

Add to your MCP config (`claude_desktop_config.json` or `.mcp.json`):

```json
{
  "mcpServers": {
    "donate-protocol": {
      "command": "pnpm",
      "args": ["--dir", "services/mcp-server", "dev"]
    }
  }
}
```

A ready-to-copy version lives in [`mcp.config.example.json`](./mcp.config.example.json).

### Remote agents (HTTP)

```bash
pnpm dev:http
# POST JSON-RPC to http://localhost:8787/mcp
# GET /healthz for a liveness check
```

## Architecture

```
src/
  server.ts      createServer() — wires tools + resources + prompts
  tools.ts       all 13 tools (zod-validated inputs)
  resources.ts   donate:// resources incl. a templated charity URI
  prompts.ts     OpenClaw agent playbooks
  data.ts        single source of truth (re-exports ../../lib)
  stdio.ts       stdio entrypoint
  http.ts        streamable HTTP entrypoint (per-session transports)
scripts/
  smoke.ts       in-memory client integration test
```
