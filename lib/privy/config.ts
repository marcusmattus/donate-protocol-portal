/**
 * Privy client configuration — browser-safe.
 *
 * Nothing in this file may reference PRIVY_APP_SECRET. The app secret is a
 * server credential; the previous lib/privy-config.ts exported it from a module
 * that either side could import, and also tried to construct the browser
 * `PrivyClient` with it. `PrivyClient` in @privy-io/react-auth is the in-page
 * client and takes no secret — server-side work belongs in lib/privy/verify.ts,
 * which never runs in the browser.
 */

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? ""

/** Privy's own client id, when the app is configured with one. Optional. */
export const PRIVY_CLIENT_ID = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID ?? ""

export function isPrivyConfigured(): boolean {
  return PRIVY_APP_ID.length > 0
}

/** Solana cluster the embedded wallet should default to. */
export const SOLANA_CLUSTER =
  (process.env.NEXT_PUBLIC_SOLANA_NETWORK as "devnet" | "mainnet-beta" | undefined) ?? "devnet"

/**
 * Login methods, in the order Privy renders them.
 *
 * Email and the social providers create an embedded wallet for users who have
 * none, which is the point of using Privy here: someone can start donating
 * without already owning a Solana wallet.
 */
export const LOGIN_METHODS = ["email", "google", "wallet", "github"] as const

/** Terminal-console palette, so the Privy modal doesn't arrive in pink. */
export const PRIVY_APPEARANCE = {
  theme: "dark" as const,
  accentColor: "#14b8a6" as const,
  logo: undefined,
  showWalletLoginFirst: false,
} as const
