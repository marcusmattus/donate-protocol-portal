#!/usr/bin/env node
/**
 * Reconcile lib/tradingview/catalog.ts against the live TradingView MCP server.
 *
 * The catalog's remote tool names are an expectation until this has run. It
 * calls tools/list over the Streamable HTTP transport and reports every catalog
 * entry whose remote name is absent, plus every server tool we do not map.
 *
 * Usage:
 *   TRADINGVIEW_ACCESS_TOKEN=... node scripts/tv-reconcile.mjs
 *
 * Obtain the token by completing the OAuth flow (POST /api/tradingview/oauth/start),
 * then read it from the connection — it is never printed by this script.
 */

import { readFileSync } from "node:fs"

const ENDPOINT = process.env.TRADINGVIEW_MCP_URL || "https://mcp.tradingview.com/mcp"
const TOKEN = process.env.TRADINGVIEW_ACCESS_TOKEN
const PROTOCOL_VERSION = "2025-03-26"

if (!TOKEN) {
  console.error("TRADINGVIEW_ACCESS_TOKEN is required (complete the OAuth flow first).")
  process.exit(2)
}

/** Parse the catalog's remote names without importing TypeScript. */
function catalogRemoteNames() {
  const src = readFileSync(new URL("../lib/tradingview/catalog.ts", import.meta.url), "utf8")
  const body = src.slice(src.indexOf("export const TV_CATALOG"))
  const out = new Map()
  const re = /^\s{2}(\w+):\s*\{\s*remote:\s*"([^"]+)"/gm
  let m
  while ((m = re.exec(body))) out.set(m[1], m[2])
  return out
}

let sessionId = null
let nextId = 1

async function rpc(method, params) {
  const headers = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    authorization: `Bearer ${TOKEN}`,
    "mcp-protocol-version": PROTOCOL_VERSION,
  }
  if (sessionId) headers["mcp-session-id"] = sessionId

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
    signal: AbortSignal.timeout(20_000),
  })

  const sid = res.headers.get("mcp-session-id")
  if (sid) sessionId = sid
  if (res.status === 401 || res.status === 403) throw new Error("unauthorized — token rejected or expired")
  if (!res.ok) throw new Error(`${method} returned ${res.status}`)

  const contentType = res.headers.get("content-type") || ""
  const text = await res.text()

  if (contentType.includes("text/event-stream")) {
    for (const block of text.split(/\r?\n\r?\n/)) {
      const data = block.split(/\r?\n/).filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("\n")
      if (!data) continue
      try {
        const parsed = JSON.parse(data)
        if (parsed.result !== undefined || parsed.error !== undefined) {
          if (parsed.error) throw new Error(parsed.error.message)
          return parsed.result
        }
      } catch { /* keep scanning frames */ }
    }
    throw new Error(`no JSON-RPC result in the ${method} stream`)
  }

  const parsed = JSON.parse(text)
  if (parsed.error) throw new Error(parsed.error.message)
  return parsed.result
}

const main = async () => {
  await rpc("initialize", {
    protocolVersion: PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: { name: "donate-protocol-reconcile", version: "1.0.0" },
  })

  const result = await rpc("tools/list", {})
  const remoteNames = (result?.tools ?? []).map((t) => t.name)
  const catalog = catalogRemoteNames()

  const missing = []
  const matched = []
  for (const [capability, remote] of catalog) {
    ;(remoteNames.includes(remote) ? matched : missing).push({ capability, remote })
  }
  const mapped = new Set(catalog.values())
  const unmapped = remoteNames.filter((n) => !mapped.has(n))

  console.log(`\nTradingView MCP — ${ENDPOINT}`)
  console.log(`server exposes ${remoteNames.length} tools; catalog declares ${catalog.size}\n`)
  console.log(`✅ matched: ${matched.length}`)

  if (missing.length) {
    console.log(`\n❌ ${missing.length} catalog entries have no matching server tool:`)
    for (const m of missing) console.log(`   ${m.capability.padEnd(28)} expected remote "${m.remote}"`)
    console.log(`\n   Fix the 'remote' field for these in lib/tradingview/catalog.ts.`)
  }
  if (unmapped.length) {
    console.log(`\nℹ️  ${unmapped.length} server tools are not in the catalog:`)
    for (const n of unmapped) console.log(`   ${n}`)
  }
  if (!missing.length) {
    console.log("\nAll catalog entries resolve. Set verified: true on them and you can turn on")
    console.log("TRADINGVIEW_REQUIRE_VERIFIED_TOOLS=true in production.\n")
  }

  process.exit(missing.length ? 1 : 0)
}

main().catch((e) => {
  console.error(`\nreconciliation failed: ${e.message}\n`)
  process.exit(1)
})
