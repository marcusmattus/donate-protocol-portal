// In-process smoke test for the Donate Protocol MCP server.
// Connects a client to the server over an in-memory transport and exercises
// tools, resources, and prompts. Run: pnpm smoke
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { createServer } from "../src/server.js"

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(`ASSERT FAILED: ${msg}`)
  process.stdout.write(`  ✓ ${msg}\n`)
}

async function main() {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const server = createServer()
  const client = new Client({ name: "smoke", version: "0.0.0" })

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
  process.stdout.write("connected\n")

  const tools = await client.listTools()
  assert(tools.tools.length >= 10, `lists ${tools.tools.length} tools`)
  assert(tools.tools.some((t) => t.name === "simulate_signal"), "exposes simulate_signal")

  const charities = await client.callTool({ name: "list_charities", arguments: { category: "climate", sort: "raised" } })
  const cText = (charities.content as any)[0].text as string
  assert(cText.includes("Solar Future Foundation"), "list_charities returns climate charities")

  const sim = await client.callTool({
    name: "simulate_signal",
    arguments: { symbol: "SOLUSDT", side: "BUY", price: 181.2, size: 50, strategyId: "momentum-alpha", charityId: "solar-future" },
  })
  const simText = (sim.content as any)[0].text as string
  assert(simText.includes("trigger_donation"), "simulate_signal runs full pipeline")
  assert(simText.includes("Solar Future Foundation"), "simulate_signal routes to chosen charity")

  const donate = await client.callTool({ name: "route_donation", arguments: { charityId: "kids-first", amount: 42 } })
  const donateText = (donate.content as any)[0].text as string
  assert(donateText.includes("explorer.solana.com"), "route_donation returns explorer link")

  const resources = await client.listResources()
  assert(resources.resources.some((r) => r.uri === "donate://charities"), "exposes charity-registry resource")
  const read = await client.readResource({ uri: "donate://charity/open-water" })
  assert(String((read.contents[0] as { text?: string }).text).includes("Open Water Relief"), "reads parameterized charity resource")

  const prompts = await client.listPrompts()
  assert(prompts.prompts.some((p) => p.name === "process_signal"), "exposes process_signal prompt")
  const prompt = await client.getPrompt({ name: "recommend_charity", arguments: { cause: "clean water" } })
  assert(prompt.messages.length > 0, "recommend_charity prompt renders messages")

  await client.close()
  await server.close()
  process.stdout.write("\nALL SMOKE CHECKS PASSED\n")
}

main().catch((err) => {
  process.stderr.write(`SMOKE FAILED: ${err instanceof Error ? err.stack : String(err)}\n`)
  process.exit(1)
})
