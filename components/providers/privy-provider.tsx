'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { createContext, useContext, type ReactNode } from 'react'
import { LOGIN_METHODS, PRIVY_APPEARANCE } from '@/lib/privy/config'

/**
 * Privy provider, configured from the server rather than from the client bundle.
 *
 * `NEXT_PUBLIC_*` is inlined into client bundles at *build* time. Reading the app
 * id here directly therefore froze the configured/unconfigured decision at build:
 * a deployment that supplied the app id only as a runtime variable rendered the
 * "Privy is not configured" panel forever, and no amount of restarting fixed it.
 * So the id arrives as a prop from the root layout, which is a server component
 * and reads the value per process.
 *
 * It also closes a crash: when the build baked "configured" but the running
 * process had no app id, this provider did not mount while client components
 * still believed Privy was available and called `usePrivy()` outside a provider,
 * which throws. Client code now gates on the context below — the one source that
 * knows whether the provider actually mounted — instead of on an inlined env var.
 */

const PrivyConfiguredContext = createContext(false)

/** Whether a real PrivyProvider is mounted above this component. */
export function useIsPrivyConfigured(): boolean {
  return useContext(PrivyConfiguredContext)
}

export function PrivyWalletProvider({
  children,
  appId,
  clientId,
}: {
  children: ReactNode
  appId?: string
  clientId?: string
}) {
  const resolvedAppId = (appId ?? '').trim()

  // No-op when Privy is not configured — keeps demo deploys rendering without an
  // app id, and lets non-Privy pages use their own wallet UI. The context still
  // publishes `false` so descendants can tell, instead of guessing from env.
  if (!resolvedAppId) {
    return (
      <PrivyConfiguredContext.Provider value={false}>{children}</PrivyConfiguredContext.Provider>
    )
  }

  return (
    <PrivyConfiguredContext.Provider value={true}>
      <PrivyProvider
        appId={resolvedAppId}
        clientId={clientId || undefined}
        config={{
          loginMethods: [...LOGIN_METHODS],
          appearance: PRIVY_APPEARANCE,
          embeddedWallets: {
            // Someone arriving by email has no wallet; create one so they can
            // donate without first going and getting one.
            //
            // Keyed under `solana` because that is where Privy reads it. A bare
            // `createOnLogin` at this level is not part of the config type, so it
            // was silently ignored and the setting stayed at its default of
            // 'off' — meaning no embedded wallet was created on login at all,
            // which is the one thing the sign-up flow promises. `tsc` catches
            // this; `next build` does not, because next.config.mjs sets
            // typescript.ignoreBuildErrors.
            solana: { createOnLogin: 'users-without-wallets' },
          },
        }}
      >
        {children}
      </PrivyProvider>
    </PrivyConfiguredContext.Provider>
  )
}
