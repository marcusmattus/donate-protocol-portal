'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { ReactNode } from 'react'
import {
  LOGIN_METHODS,
  PRIVY_APPEARANCE,
  PRIVY_APP_ID,
  PRIVY_CLIENT_ID,
  isPrivyConfigured,
} from '@/lib/privy/config'

export function PrivyWalletProvider({ children }: { children: ReactNode }) {
  // No-op when Privy is not configured — keeps demo deploys rendering without
  // an app id, and lets non-Privy pages use their own wallet UI. The login page
  // detects the same condition and explains what to set.
  if (!isPrivyConfigured()) return <>{children}</>

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      clientId={PRIVY_CLIENT_ID || undefined}
      config={{
        loginMethods: [...LOGIN_METHODS],
        appearance: PRIVY_APPEARANCE,
        embeddedWallets: {
          // Someone arriving by email has no wallet; create one so they can
          // donate without first going and getting one.
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}
