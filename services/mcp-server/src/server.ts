import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { registerTools } from "./tools.js"
import { registerResources } from "./resources.js"
import { registerPrompts } from "./prompts.js"

export const SERVER_INFO = {
  name: "donate-protocol",
  version: "0.2.0",
} as const

/**
 * Builds a fully-configured Donate Protocol MCP server instance.
 * Transport-agnostic: connect it to stdio (CLI agents, Claude Desktop)
 * or streamable HTTP (remote agents) at the call site.
 */
export function createServer(): McpServer {
  const server = new McpServer(SERVER_INFO, {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
      logging: {},
    },
    instructions:
      "Donate Protocol agent surface. Use the discovery tools (list_charities, list_strategies) " +
      "to ground context, the pipeline tools (check_risk, get_jupiter_quote, simulate_signal, " +
      "route_donation) to act on signals, and the donate:// resources for bulk context. " +
      "All Solana interactions are devnet simulations — no real funds move.",
  })

  registerTools(server)
  registerResources(server)
  registerPrompts(server)

  return server
}
