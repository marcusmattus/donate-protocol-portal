/**
 * Per-user token bucket + priority queue for TradingView MCP.
 *
 * The documented service limit is ~100 tool requests per minute per user, so
 * the bucket is sized to that and shaped by capability priority: a risk-engine
 * read jumps ahead of background research when capacity is scarce, rather than
 * every caller degrading equally.
 */

export interface RateLimitConfig {
  /** Requests allowed per window. */
  capacity: number
  /** Window length in ms. */
  windowMs: number
  /** Reject rather than queue once this many are already waiting. */
  maxQueueDepth: number
  /** Give up on a queued request after this long. */
  queueTimeoutMs: number
}

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  capacity: Number(process.env.TRADINGVIEW_RATE_CAPACITY ?? 100),
  windowMs: 60_000,
  maxQueueDepth: 200,
  queueTimeoutMs: 30_000,
}

interface Waiter {
  priority: number
  enqueuedAt: number
  resolve: () => void
  reject: (e: Error) => void
  timer: ReturnType<typeof setTimeout>
}

export class RateLimitError extends Error {
  constructor(message: string, readonly retryAfterMs: number) {
    super(message)
    this.name = "RateLimitError"
  }
}

class UserBucket {
  private tokens: number
  private lastRefill: number
  private queue: Waiter[] = []
  /** Set when the server itself tells us to back off (429 / Retry-After). */
  private cooldownUntil = 0

  constructor(private readonly config: RateLimitConfig) {
    this.tokens = config.capacity
    this.lastRefill = Date.now()
  }

  private refill(now: number): void {
    const elapsed = now - this.lastRefill
    if (elapsed <= 0) return
    const refilled = (elapsed / this.config.windowMs) * this.config.capacity
    if (refilled >= 1) {
      this.tokens = Math.min(this.config.capacity, this.tokens + Math.floor(refilled))
      this.lastRefill = now
    }
  }

  /** ms until at least one token is available. */
  private waitTime(now: number): number {
    const perToken = this.config.windowMs / this.config.capacity
    const sinceRefill = now - this.lastRefill
    return Math.max(this.cooldownUntil - now, Math.ceil(perToken - sinceRefill), 0)
  }

  acquire(priority: number): Promise<void> {
    const now = Date.now()
    this.refill(now)

    if (this.tokens >= 1 && now >= this.cooldownUntil && this.queue.length === 0) {
      this.tokens -= 1
      return Promise.resolve()
    }

    if (this.queue.length >= this.config.maxQueueDepth) {
      return Promise.reject(
        new RateLimitError(
          "TradingView request queue is full; shed this request",
          this.waitTime(now)
        )
      )
    }

    return new Promise<void>((resolve, reject) => {
      const waiter: Waiter = {
        priority,
        enqueuedAt: now,
        resolve,
        reject,
        timer: setTimeout(() => {
          this.queue = this.queue.filter((w) => w !== waiter)
          reject(
            new RateLimitError(
              "timed out waiting for TradingView rate-limit capacity",
              this.waitTime(Date.now())
            )
          )
        }, this.config.queueTimeoutMs),
      }

      // Stable insert: priority first, then FIFO within a priority band.
      const idx = this.queue.findIndex((w) => w.priority > priority)
      if (idx === -1) this.queue.push(waiter)
      else this.queue.splice(idx, 0, waiter)

      this.scheduleDrain()
    })
  }

  private drainTimer: ReturnType<typeof setTimeout> | null = null

  private scheduleDrain(): void {
    if (this.drainTimer || this.queue.length === 0) return
    const delay = Math.max(5, this.waitTime(Date.now()))
    this.drainTimer = setTimeout(() => {
      this.drainTimer = null
      this.drain()
    }, delay)
    // Don't hold the process open for a background drain.
    if (typeof this.drainTimer === "object" && "unref" in this.drainTimer) {
      ;(this.drainTimer as unknown as { unref(): void }).unref()
    }
  }

  private drain(): void {
    const now = Date.now()
    this.refill(now)
    while (this.queue.length > 0 && this.tokens >= 1 && now >= this.cooldownUntil) {
      const waiter = this.queue.shift()!
      clearTimeout(waiter.timer)
      this.tokens -= 1
      waiter.resolve()
    }
    this.scheduleDrain()
  }

  /** Apply a server-sent backoff, e.g. from a 429 Retry-After header. */
  penalize(retryAfterMs: number): void {
    this.cooldownUntil = Math.max(this.cooldownUntil, Date.now() + retryAfterMs)
    this.tokens = 0
    this.scheduleDrain()
  }

  snapshot() {
    this.refill(Date.now())
    return {
      availableTokens: Math.floor(this.tokens),
      capacity: this.config.capacity,
      queueDepth: this.queue.length,
      cooldownMs: Math.max(0, this.cooldownUntil - Date.now()),
    }
  }
}

const buckets = new Map<string, UserBucket>()

function bucketFor(userId: string, config: RateLimitConfig): UserBucket {
  let b = buckets.get(userId)
  if (!b) {
    b = new UserBucket(config)
    buckets.set(userId, b)
  }
  return b
}

export function acquireSlot(
  userId: string,
  priority: number,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): Promise<void> {
  return bucketFor(userId, config).acquire(priority)
}

export function penalizeUser(
  userId: string,
  retryAfterMs: number,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): void {
  bucketFor(userId, config).penalize(retryAfterMs)
}

export function rateLimitSnapshot(userId: string) {
  const b = buckets.get(userId)
  return b ? b.snapshot() : { availableTokens: DEFAULT_RATE_LIMIT.capacity, capacity: DEFAULT_RATE_LIMIT.capacity, queueDepth: 0, cooldownMs: 0 }
}

/** Test seam. */
export function resetRateLimiter(): void {
  buckets.clear()
}
