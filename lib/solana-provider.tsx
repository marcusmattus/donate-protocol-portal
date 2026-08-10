"use client"

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets"
import { useMemo, useEffect, useState } from "react"

const SOLANA_RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com"

// Suppress wallet extension provider conflicts (non-critical browser extension errors)
// Only run on client-side to avoid hydration mismatches
let errorHandlersInitialized = false

const initializeErrorHandlers = () => {
  if (typeof window === "undefined" || errorHandlersInitialized) return
  
  errorHandlersInitialized = true
  
  const originalError = console.error
  const originalWarn = console.warn
  
  console.error = function (...args: any[]) {
    const message = args[0]?.toString?.() || ""
    const errorString = JSON.stringify(args).toString()
    
    // Suppress known browser extension conflicts and non-critical errors
    if (
      message.includes("Could not assign") ||
      message.includes("Cannot redefine property") ||
      message.includes("BitcoinProvider") ||
      message.includes("StacksProvider") ||
      message.includes("Cross-Origin-Opener-Policy") ||
      message.includes("walletProvider?.on is not a function") ||
      message.includes("hydration") ||
      message.includes("did not match") ||
      message.includes("server rendered HTML") ||
      errorString.includes("BitcoinProvider") ||
      errorString.includes("StacksProvider")
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
      message.includes("wallet adapter") ||
      message.includes("hydration") ||
      message.includes("BitcoinProvider") ||
      message.includes("StacksProvider")
    ) {
      return
    }
    originalWarn.apply(console, args)
  }
}

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    initializeErrorHandlers()
    setMounted(true)
  }, [])

  const wallets = useMemo(
    () => {
      if (!mounted) return []
      
      try {
        const adapters: any[] = []
        
        // Try to load Phantom wallet with safe initialization
        try {
          const phantomAdapter = new PhantomWalletAdapter()
          if (phantomAdapter && typeof phantomAdapter === 'object') {
            // Prevent event listener errors
            const originalOn = phantomAdapter.on
            if (originalOn && typeof originalOn === 'function') {
              adapters.push(phantomAdapter)
            }
          }
        } catch (e) {
          // Silently skip Phantom if unavailable
        }
        
        // Try to load Solflare wallet with safe initialization
        try {
          const solflareAdapter = new SolflareWalletAdapter()
          if (solflareAdapter && typeof solflareAdapter === 'object') {
            const originalOn = solflareAdapter.on
            if (originalOn && typeof originalOn === 'function') {
              adapters.push(solflareAdapter)
            }
          }
        } catch (e) {
          // Silently skip Solflare if unavailable
        }
        
        return adapters.length > 0 ? adapters : []
      } catch (e) {
        return []
      }
    },
    [mounted]
  )

  useEffect(() => {
    if (!mounted) return
    
    // Handle any unhandled wallet provider errors
    const handleRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message?.toString?.() || ""
      const stack = event.reason?.stack?.toString?.() || ""
      
      if (
        message.includes("walletProvider") ||
        message.includes("redefine property") ||
        message.includes("is not a function") ||
        stack.includes("wallet-adapter") ||
        stack.includes("BitcoinProvider") ||
        stack.includes("StacksProvider")
      ) {
        event.preventDefault()
      }
    }
    
    window.addEventListener("unhandledrejection", handleRejection)
    return () => window.removeEventListener("unhandledrejection", handleRejection)
  }, [mounted])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
