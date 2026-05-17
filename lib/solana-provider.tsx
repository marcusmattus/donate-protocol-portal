"use client"

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets"
import { useMemo, useEffect } from "react"

const SOLANA_RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com"

// Suppress wallet extension provider conflicts (non-critical browser extension errors)
if (typeof window !== "undefined") {
  const originalError = console.error
  const originalWarn = console.warn
  
  console.error = function (...args: any[]) {
    const message = args[0]?.toString?.() || ""
    // Suppress known browser extension conflicts
    if (
      message.includes("Could not assign") ||
      message.includes("Cannot redefine property") ||
      message.includes("Cross-Origin-Opener-Policy") ||
      message.includes("walletProvider?.on is not a function")
    ) {
      return
    }
    originalError.apply(console, args)
  }

  console.warn = function (...args: any[]) {
    const message = args[0]?.toString?.() || ""
    if (
      message.includes("Phantom was registered") ||
      message.includes("Standard Wallet") ||
      message.includes("wallet adapter")
    ) {
      return
    }
    originalWarn.apply(console, args)
  }
}

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(
    () => {
      try {
        const adapters: any[] = []
        
        // Try to load Phantom wallet
        try {
          const phantomAdapter = new PhantomWalletAdapter()
          // Safely attach listeners to avoid wallet provider conflicts
          if (phantomAdapter && typeof phantomAdapter === 'object') {
            adapters.push(phantomAdapter)
          }
        } catch (e) {
          console.debug("Phantom adapter initialization skipped")
        }
        
        // Try to load Solflare wallet
        try {
          const solflareAdapter = new SolflareWalletAdapter()
          if (solflareAdapter && typeof solflareAdapter === 'object') {
            adapters.push(solflareAdapter)
          }
        } catch (e) {
          console.debug("Solflare adapter initialization skipped")
        }
        
        return adapters
      } catch (e) {
        console.debug("Wallet initialization error:", e)
        return []
      }
    },
    []
  )

  useEffect(() => {
    // Handle any unhandled wallet provider errors
    const handleRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message?.toString?.() || ""
      const stack = event.reason?.stack?.toString?.() || ""
      
      if (
        message.includes("walletProvider") ||
        message.includes("redefine property") ||
        stack.includes("wallet-adapter")
      ) {
        event.preventDefault()
      }
    }
    
    window.addEventListener("unhandledrejection", handleRejection)
    return () => window.removeEventListener("unhandledrejection", handleRejection)
  }, [])

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
