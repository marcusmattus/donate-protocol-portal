"use client"

import { Toaster } from "sonner"
import { WalletStateProvider } from "@/components/wallet-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletStateProvider>
      {children}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "rgba(15,23,42,0.95)",
            border: "1px solid rgba(20,184,166,0.3)",
            color: "#f8fafc",
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: "12px",
          },
        }}
      />
    </WalletStateProvider>
  )
}
