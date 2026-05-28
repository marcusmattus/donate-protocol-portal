#!/usr/bin/env node
import { createServer as createHttpServer, IncomingMessage, ServerResponse } from "node:http"
import { randomUUID } from "node:crypto"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js"
import { createServer, SERVER_INFO } from "./server.js"

// Streamable HTTP entrypoint — for remote agents (OpenClaw cloud, hosted hosts).
// Maintains one MCP server + transport per session id.

const PORT = Number(process.env.PORT ?? 8787)
const sessions = new Map<string, StreamableHTTPServerTransport>()

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = ""
    req.on("data", (c) => (raw += c))
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : undefined)
      } catch (e) {
        reject(e)
      }
    })
    req.on("error", reject)
  })
}

const http = createHttpServer(async (req: IncomingMessage, res: ServerResponse) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify({ ok: true, server: SERVER_INFO }))
    return
  }

  if (req.url !== "/mcp") {
    res.writeHead(404).end("not found")
    return
  }

  const sessionId = req.headers["mcp-session-id"] as string | undefined

  try {
    if (req.method === "POST") {
      const body = await readBody(req)
      let transport = sessionId ? sessions.get(sessionId) : undefined

      if (!transport && isInitializeRequest(body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id) => {
            sessions.set(id, transport!)
          },
        })
        transport.onclose = () => {
          if (transport!.sessionId) sessions.delete(transport!.sessionId)
        }
        await createServer().connect(transport)
      }

      if (!transport) {
        res.writeHead(400, { "content-type": "application/json" })
        res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "No valid session" }, id: null }))
        return
      }

      await transport.handleRequest(req, res, body)
      return
    }

    // GET (SSE stream) and DELETE (session teardown) reuse the existing transport.
    const transport = sessionId ? sessions.get(sessionId) : undefined
    if (!transport) {
      res.writeHead(400).end("Invalid or missing session id")
      return
    }
    await transport.handleRequest(req, res)
  } catch (err) {
    process.stderr.write(`[mcp:http] error: ${err instanceof Error ? err.message : String(err)}\n`)
    if (!res.headersSent) res.writeHead(500).end("internal error")
  }
})

http.listen(PORT, () => {
  process.stderr.write(`[mcp] ${SERVER_INFO.name}@${SERVER_INFO.version} on http://localhost:${PORT}/mcp\n`)
})
