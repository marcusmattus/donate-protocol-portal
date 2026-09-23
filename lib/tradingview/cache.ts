/**
 * TTL cache for TradingView read capabilities, with single-flight.
 *
 * Two jobs: stay under the rate limit by not asking twice for the same thing,
 * and keep serving during a TradingView outage. Entries are kept past their TTL
 * so `getStale` can back a degraded response — a dashboard showing data from
 * four minutes ago beats a dashboard showing an error, as long as it says so.
 */

export interface CacheEntry<T> {
  value: T
  storedAt: number
  expiresAt: number
}

const MAX_ENTRIES = Number(process.env.TRADINGVIEW_CACHE_MAX_ENTRIES ?? 2_000)
/** How long a stale entry stays usable for degraded responses. */
const STALE_RETENTION_MS = 15 * 60_000

const store = new Map<string, CacheEntry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()

export function cacheKey(userId: string, capability: string, args: unknown): string {
  // Stable stringify so key order in the args object doesn't fragment the cache.
  return `${userId}::${capability}::${stableStringify(args)}`
}

function stableStringify(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null"
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`
  const obj = v as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`
}

function evictIfNeeded(): void {
  if (store.size <= MAX_ENTRIES) return
  // Oldest-stored first; Map preserves insertion order.
  const excess = store.size - MAX_ENTRIES
  let i = 0
  for (const key of store.keys()) {
    store.delete(key)
    if (++i >= excess) break
  }
}

export function getFresh<T>(key: string): T | undefined {
  const hit = store.get(key) as CacheEntry<T> | undefined
  if (!hit) return undefined
  if (Date.now() >= hit.expiresAt) return undefined
  return hit.value
}

/** A past-TTL value, for degraded responses. Returns age so callers can disclose it. */
export function getStale<T>(key: string): { value: T; ageMs: number } | undefined {
  const hit = store.get(key) as CacheEntry<T> | undefined
  if (!hit) return undefined
  const age = Date.now() - hit.storedAt
  if (age > STALE_RETENTION_MS) {
    store.delete(key)
    return undefined
  }
  return { value: hit.value, ageMs: age }
}

export function put<T>(key: string, value: T, ttlMs: number): void {
  const now = Date.now()
  store.delete(key) // Re-insert so eviction order tracks recency of write.
  store.set(key, { value, storedAt: now, expiresAt: now + ttlMs })
  evictIfNeeded()
}

/**
 * Run `fn` at most once concurrently per key.
 * Without this, ten dashboard panels mounting together become ten identical
 * MCP calls and a needless brush with the rate limit.
 */
export async function singleFlight<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined
  if (existing) return existing

  const p = fn().finally(() => inflight.delete(key))
  inflight.set(key, p as Promise<unknown>)
  return p
}

export function invalidatePrefix(prefix: string): number {
  let n = 0
  for (const key of [...store.keys()]) {
    if (key.startsWith(prefix)) {
      store.delete(key)
      n++
    }
  }
  return n
}

export function cacheStats() {
  const now = Date.now()
  let fresh = 0
  for (const e of store.values()) if (now < e.expiresAt) fresh++
  return { entries: store.size, fresh, stale: store.size - fresh, inflight: inflight.size }
}

/** Test seam. */
export function resetCache(): void {
  store.clear()
  inflight.clear()
}
