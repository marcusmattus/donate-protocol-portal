/**
 * Minimal MCP client over the Streamable HTTP transport.
 *
 * Streamable HTTP (MCP 2025-03-26) is a single endpoint that takes JSON-RPC via
 * POST and answers with either `application/json` or an SSE stream, depending
 * on what the server chooses. Both are handled here. A session id handed back
 * in `Mcp-Session-Id` is echoed on later requests.
 *
 * This is deliberately a thin transport: it knows JSON-RPC, SSE framing,
 * timeouts and 401/429 semantics, and nothing about TradingView. Policy —
 * caching, rate limiting, audit, retries — lives in the connector above it.
 */

const PROTOCOL_VERSION = "2025-03-26"

export interface McpToolDefinition {
  name: string
  description?: string
  inputSchema?: Record<string, unknown>
}

export interface McpCallResult {
  /** Structured content when the server provides it, else parsed text. */
  data: unknown
  isError: boolean
  raw: unknown
}

export class McpTransportError extends Error {
  constructor(
    message: string,
    readonly kind:
      | "unauthorized"
      | "rate_limited"
      | "timeout"
      | "network"
      | "protocol"
      | "server_error",
    readonly status?: number,
    readonly retryAfterMs?: number
  ) {
    super(message)
    this.name = "McpTransportError"
  }
}

interface JsonRpcResponse {
  jsonrpc: "2.0"
  id?: number | string
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
}

export interface McpClientOptions {
  endpoint: string
  /** Called per request; returns the bearer token. Kept as a callback so the
   *  client never holds a token across requests. */
  getBearer: () => Promise<string> | string
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

export class McpClient {
  private sessionId: string | null = null
  private nextId = 1
  private initialized = false
  private readonly fetchImpl: typeof fetch
  private readonly timeoutMs: number

  constructor(private readonly options: McpClientOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch
    this.timeoutMs = options.timeoutMs ?? 20_000
  }

  private async post(body: unknown, timeoutMs = this.timeoutMs): Promise<JsonRpcResponse | null> {
    const bearer = await this.options.getBearer()
    const headers: Record<string, string> = {
      "content-type": "application/json",
      // Advertise both so the server may stream or answer inline.
      accept: "application/json, text/event-stream",
      authorization: `Bearer ${bearer}`,
      "mcp-protocol-version": PROTOCOL_VERSION,
    }
    if (this.sessionId) headers["mcp-session-id"] = this.sessionId

    let res: Response
    try {
      res = await this.fetchImpl(this.options.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (e) {
      const isTimeout = e instanceof Error && /abort|timeout/i.test(e.name + e.message)
      throw new McpTransportError(
        isTimeout ? "TradingView MCP request timed out" : "TradingView MCP request failed",
        isTimeout ? "timeout" : "network"
      )
    }

    const newSession = res.headers.get("mcp-session-id")
    if (newSession) this.sessionId = newSession

    if (res.status === 401 || res.status === 403) {
      this.initialized = false
      this.sessionId = null
      throw new McpTransportError(
        "TradingView rejected the credential; reauthorization required",
        "unauthorized",
        res.status
      )
    }
    if (res.status === 429) {
      const retryAfter = res.headers.get("retry-after")
      const retryMs = retryAfter ? Number(retryAfter) * 1000 : 60_000
      throw new McpTransportError(
        "TradingView rate limit reached",
        "rate_limited",
        429,
        Number.isFinite(retryMs) ? retryMs : 60_000
      )
    }
    if (res.status === 202) return null // Accepted notification, no body.
    if (!res.ok) {
      throw new McpTransportError(
        `TradingView MCP returned ${res.status}`,
        "server_error",
        res.status
      )
    }

    const contentType = res.headers.get("content-type") ?? ""
    if (contentType.includes("text/event-stream")) {
      return this.readSse(res)
    }
    if (!contentType.includes("application/json")) {
      const text = await res.text()
      if (!text.trim()) return null
      try {
        return JSON.parse(text) as JsonRpcResponse
      } catch {
        throw new McpTransportError("unparseable MCP response body", "protocol")
      }
    }
    return (await res.json()) as JsonRpcResponse
  }

  /**
   * Read an SSE body and return the first JSON-RPC response carrying a result
   * or error. Intermediate notifications (progress, logging) are skipped.
   */
  private async readSse(res: Response): Promise<JsonRpcResponse | null> {
    if (!res.body) return null
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        let sep: number
        // SSE events are separated by a blank line.
        while ((sep = buffer.search(/\r?\n\r?\n/)) !== -1) {
          const rawEvent = buffer.slice(0, sep)
          buffer = buffer.slice(sep).replace(/^\r?\n\r?\n/, "")

          const dataLines = rawEvent
            .split(/\r?\n/)
            .filter((l) => l.startsWith("data:"))
            .map((l) => l.slice(5).trimStart())
          if (dataLines.length === 0) continue

          try {
            const parsed = JSON.parse(dataLines.join("\n")) as JsonRpcResponse
            if (parsed && (parsed.result !== undefined || parsed.error !== undefined)) {
              return parsed
            }
          } catch {
            // Not a JSON-RPC frame — keep reading.
          }
        }
      }
    } finally {
      reader.releaseLock()
      // Stop the server streaming into a response nobody is reading.
      await res.body.cancel().catch(() => {})
    }
    return null
  }

  private unwrap(response: JsonRpcResponse | null): unknown {
    if (!response) throw new McpTransportError("empty MCP response", "protocol")
    if (response.error) {
      throw new McpTransportError(
        `MCP error ${response.error.code}: ${response.error.message}`,
        "protocol"
      )
    }
    return response.result
  }

  async initialize(): Promise<void> {
    if (this.initialized) return
    const res = await this.post({
      jsonrpc: "2.0",
      id: this.nextId++,
      method: "initialize",
      params: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: "donate-protocol", version: "1.0.0" },
      },
    })
    this.unwrap(res)
    // Best-effort; a server that does not want the notification will 202/404.
    await this.post({ jsonrpc: "2.0", method: "notifications/initialized" }).catch(() => null)
    this.initialized = true
  }

  async listTools(): Promise<McpToolDefinition[]> {
    await this.initialize()
    const result = this.unwrap(
      await this.post({ jsonrpc: "2.0", id: this.nextId++, method: "tools/list" })
    ) as { tools?: McpToolDefinition[] }
    return result?.tools ?? []
  }

  async callTool(
    name: string,
    args: Record<string, unknown>,
    timeoutMs?: number
  ): Promise<McpCallResult> {
    await this.initialize()
    const result = this.unwrap(
      await this.post(
        { jsonrpc: "2.0", id: this.nextId++, method: "tools/call", params: { name, arguments: args } },
        timeoutMs
      )
    ) as {
      content?: { type: string; text?: string }[]
      structuredContent?: unknown
      isError?: boolean
    }

    const isError = Boolean(result?.isError)
    if (result?.structuredContent !== undefined) {
      return { data: result.structuredContent, isError, raw: result }
    }

    const text = (result?.content ?? [])
      .filter((c) => c.type === "text" && typeof c.text === "string")
      .map((c) => c.text as string)
      .join("\n")

    if (!text) return { data: null, isError, raw: result }
    try {
      return { data: JSON.parse(text), isError, raw: result }
    } catch {
      return { data: text, isError, raw: result }
    }
  }

  /** Drop the negotiated session, e.g. after reauthorization. */
  reset(): void {
    this.sessionId = null
    this.initialized = false
  }
}
