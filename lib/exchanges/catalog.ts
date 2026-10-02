/**
 * Exchanges a connection may be stored for.
 *
 * This is an allow-list, not a capability claim: storing a credential for an
 * exchange says nothing about whether this app can trade on it. Execution still
 * goes through the Risk Engine and the user's own policy, and nothing in the
 * codebase places an order today.
 *
 * `requiresPassphrase` reflects which APIs issue a third factor alongside key
 * and secret. Getting it wrong only affects validation, never security: a
 * passphrase that is supplied is sealed either way.
 */

export interface ExchangeDescriptor {
  id: string
  label: string
  requiresPassphrase: boolean
}

export const EXCHANGES: readonly ExchangeDescriptor[] = [
  { id: "kraken", label: "Kraken", requiresPassphrase: false },
  { id: "binance", label: "Binance", requiresPassphrase: false },
  { id: "bybit", label: "Bybit", requiresPassphrase: false },
  { id: "coinbase", label: "Coinbase", requiresPassphrase: true },
  { id: "okx", label: "OKX", requiresPassphrase: true },
  { id: "kucoin", label: "KuCoin", requiresPassphrase: true },
] as const

export function findExchange(id: unknown): ExchangeDescriptor | null {
  if (typeof id !== "string") return null
  return EXCHANGES.find((e) => e.id === id.toLowerCase()) ?? null
}
