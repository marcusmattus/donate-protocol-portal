import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js"
import { CHARITIES, STRATEGIES, DONATIONS, RECENT_SIGNALS, findCharity } from "./data.js"

/**
 * Registers readable resources. Agents can subscribe to or read these
 * without invoking a tool — useful for grounding context (the full charity
 * registry, live signals, donation ledger) before deciding on an action.
 */
export function registerResources(server: McpServer) {
  server.registerResource(
    "charity-registry",
    "donate://charities",
    {
      title: "Charity Registry",
      description: "The full Donate Protocol charity registry (verified destinations).",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(CHARITIES, null, 2) }],
    }),
  )

  server.registerResource(
    "strategy-book",
    "donate://strategies",
    {
      title: "Strategy Book",
      description: "All copy-trading strategies with performance metrics.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(STRATEGIES, null, 2) }],
    }),
  )

  server.registerResource(
    "signal-feed",
    "donate://signals",
    {
      title: "Live Signal Feed",
      description: "Most recent trade signals in the queue.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(RECENT_SIGNALS.slice(0, 50), null, 2) }],
    }),
  )

  server.registerResource(
    "donation-ledger",
    "donate://donations",
    {
      title: "Donation Ledger",
      description: "Settled donation events with tx signatures.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(DONATIONS, null, 2) }],
    }),
  )

  // Parameterized resource: a single charity by id.
  server.registerResource(
    "charity",
    new ResourceTemplate("donate://charity/{id}", { list: undefined }),
    {
      title: "Charity Profile",
      description: "A single charity profile addressed by id, e.g. donate://charity/solar-future",
      mimeType: "application/json",
    },
    async (uri, { id }) => {
      const charity = findCharity(String(id))
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(charity ?? { error: `not found: ${id}` }, null, 2),
          },
        ],
      }
    },
  )
}
