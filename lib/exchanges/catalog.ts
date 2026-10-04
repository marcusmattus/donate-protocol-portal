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
  /**
   * Whether a stored credential can be checked against the exchange.
   *
   * False is never "too hard" — it means the signing scheme could not be
   * verified against the live API, and shipping an unverified signer would
   * report a working key as rejected. `validationNote` says which case it is.
   */
  canValidate: boolean
  validationNote?: string
}

export const EXCHANGES: readonly ExchangeDescriptor[] = [
  { id: "kraken", label: "Kraken", requiresPassphrase: false, canValidate: true },
  {
    id: "binance",
    label: "Binance",
    requiresPassphrase: false,
    canValidate: false,
    validationNote: "Binance answers 451 (restricted location) from this deployment, so its signing could not be verified",
  },
  {
    id: "bybit",
    label: "Bybit",
    requiresPassphrase: false,
    canValidate: false,
    validationNote: "Bybit answers 403 (country block) from this deployment, so its signing could not be verified",
  },
  {
    id: "coinbase",
    label: "Coinbase",
    requiresPassphrase: true,
    canValidate: false,
    validationNote: "Coinbase has two incompatible key generations (legacy HMAC and CDP ES256) and a key does not say which",
  },
  { id: "okx", label: "OKX", requiresPassphrase: true, canValidate: true },
  { id: "kucoin", label: "KuCoin", requiresPassphrase: true, canValidate: true },
] as const

export function findExchange(id: unknown): ExchangeDescriptor | null {
  if (typeof id !== "string") return null
  return EXCHANGES.find((e) => e.id === id.toLowerCase()) ?? null
}
