/**
 * First-sighting registry for Privy identities.
 *
 * Privy has exactly one authentication flow: `login()` creates an account for a
 * new user and signs in an existing one. "Sign up" and "sign in" are therefore
 * not two Privy operations — they are one operation with two outcomes, and the
 * only party that can tell them apart is whoever remembers having seen the DID
 * before.
 *
 * Privy's `useLogin` does report an `isNewUser` flag, but it arrives from the
 * browser, and a flag the server cannot check is not something to branch on. So
 * the server keeps its own record instead: the first time a DID completes a
 * verified session exchange, that is a sign-up; every time after, a sign-in.
 *
 * This is deliberately NOT an authorization input. It decides which sentence
 * the user reads and which page they land on. Nothing may gate a capability on
 * it, and two properties follow from that:
 *
 *   - A restart empties the Map, and eviction drops the coldest entries, so a
 *     returning user can be reported as new. That is tolerable precisely
 *     because the only consequence is a greeting.
 *   - Only a verified session exchange records an account. Reads never create
 *     one, so holding a session cookie — however it was obtained — cannot
 *     fabricate an account record.
 *
 * In-memory for now, matching the other stores here; swap the Map for the
 * Prisma model before production. The accessor surface is deliberately narrow
 * so that swap stays contained.
 */

export interface Account {
  /** Privy DID. */
  userId: string
  /** First time the server saw a verified login for this DID. */
  createdAt: number
  lastSeenAt: number
  /** Verified exchanges seen, including the first. */
  authCount: number
}

/** Bounded so a stream of distinct DIDs cannot grow this without limit. */
const MAX_ACCOUNTS = Math.max(1, Number(process.env.AUTH_ACCOUNTS_MAX) || 5000)

const accounts = new Map<string, Account>()

function evictColdestIfFull(): void {
  if (accounts.size < MAX_ACCOUNTS) return
  let coldestId: string | null = null
  let coldestSeenAt = Infinity
  for (const account of accounts.values()) {
    if (account.lastSeenAt < coldestSeenAt) {
      coldestSeenAt = account.lastSeenAt
      coldestId = account.userId
    }
  }
  if (coldestId !== null) accounts.delete(coldestId)
}

export interface AuthenticationRecord {
  /** True when this is the first verified login the server has seen for the DID. */
  isNewAccount: boolean
  account: Account
}

/**
 * Record a verified login and report whether it created the account.
 *
 * Call this only after the Privy token's signature has been verified — this is
 * what makes "sign up" a server-side fact rather than a client assertion.
 */
export function recordAuthentication(userId: string, now: number = Date.now()): AuthenticationRecord {
  const existing = accounts.get(userId)
  if (existing) {
    existing.lastSeenAt = now
    existing.authCount += 1
    return { isNewAccount: false, account: existing }
  }

  evictColdestIfFull()
  const account: Account = { userId, createdAt: now, lastSeenAt: now, authCount: 1 }
  accounts.set(userId, account)
  return { isNewAccount: true, account }
}

/** Look up an account without creating one. Reads must never mint accounts. */
export function findAccount(userId: string): Account | null {
  return accounts.get(userId) ?? null
}

/** Shape safe to put in an API response: no counters a caller could mine. */
export function describeAccount(account: Account): { createdAt: number; returning: boolean } {
  return { createdAt: account.createdAt, returning: account.authCount > 1 }
}

/** Test seam. Not reachable over HTTP. */
export function resetAccounts(): void {
  accounts.clear()
}
