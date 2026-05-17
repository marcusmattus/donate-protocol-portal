'use client'

import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useCallback, useEffect, useState } from 'react'

export function usePivyWallet() {
  const { user, login, logout, authenticated } = usePrivy()
  const { wallets } = useWallets()
  const [wallet, setWallet] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (wallets && wallets.length > 0) {
      setWallet(wallets[0])
    }
  }, [wallets])

  const connectWallet = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      if (!authenticated) {
        await login()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
    } finally {
      setLoading(false)
    }
  }, [authenticated, login])

  const disconnectWallet = useCallback(async () => {
    try {
      setLoading(true)
      await logout()
      setWallet(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet')
    } finally {
      setLoading(false)
    }
  }, [logout])

  const sendTransaction = useCallback(
    async (tx: any) => {
      if (!wallet) {
        throw new Error('No wallet connected')
      }
      try {
        setLoading(true)
        const signature = await wallet.sendTransaction(tx)
        return signature
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Transaction failed'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [wallet]
  )

  return {
    wallet,
    user,
    authenticated,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    sendTransaction,
  }
}
