#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { createServer, SERVER_INFO } from "./server.js"

// stdio entrypoint — the transport most agents use (Claude Desktop, CLI agents,
// OpenClaw local). Logs go to stderr so stdout stays a clean JSON-RPC channel.
async function main() {
  const server = createServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
  process.stderr.write(`[mcp] ${SERVER_INFO.name}@${SERVER_INFO.version} ready on stdio\n`)
}

main().catch((err) => {
  process.stderr.write(`[mcp] fatal: ${err instanceof Error ? err.stack : String(err)}\n`)
  process.exit(1)
})
