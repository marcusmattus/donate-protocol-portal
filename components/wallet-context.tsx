"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { simulateConnect, ConnectedWallet, WalletProvider as Provider } from "@/lib/solana"

interface WalletState {
  wallet: ConnectedWallet | null
  connecting: Provider | null
  connect: (p: Provider) => Promise<ConnectedWallet>
  disconnect: () => void
}

const Ctx = createContext<WalletState | null>(null)
const STORAGE_KEY = "dp:wallet"

export function WalletStateProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null)
  const [connecting, setConnecting] = useState<Provider | null>(null)

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null
      if (raw) setWallet(JSON.parse(raw))
    } catch {}
  }, [])

  const connect = useCallback(async (p: Provider) => {
    setConnecting(p)
    await new Promise((r) => setTimeout(r, 700))
    const w = simulateConnect(p)
    setWallet(w)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(w))
    } catch {}
    setConnecting(null)
    return w
  }, [])

  const disconnect = useCallback(() => {
    setWallet(null)
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }, [])

  const value = useMemo(() => ({ wallet, connecting, connect, disconnect }), [wallet, connecting, connect, disconnect])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useWallet(): WalletState {
  const v = useContext(Ctx)
  if (!v) throw new Error("useWallet must be used inside <WalletStateProvider>")
  return v
}
