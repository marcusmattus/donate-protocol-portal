'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { ReactNode } from 'react'

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID

export function PrivyWalletProvider({ children }: { children: ReactNode }) {
  // No-op when Privy is not configured — keeps demo deploys working without
  // an app id and lets non-Privy pages continue to render their own wallet UI.
  if (!PRIVY_APP_ID) return <>{children}</>

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['wallet', 'email', 'google', 'github'],
        appearance: {
          theme: 'dark',
          accentColor: '#EC4899',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          requireUserPasswordOnCreate: false,
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}
