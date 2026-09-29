'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Privy login, synced to a verified server session.
 *
 * Privy's own hooks tell you whether the *browser* thinks you are logged in.
 * This adds the half that matters to the backend: it takes the Privy access
 * token, posts it to /api/auth/privy, and reports whether the server verified
 * it. Those two can legitimately disagree — the client can hold a valid Privy
 * session while our cookie has expired — so both are exposed rather than
 * collapsed into one boolean.
 *
 * MUST be rendered inside PrivyWalletProvider, which only mounts the real
 * PrivyProvider when an app id is configured. `usePrivy()` throws outside it,
 * so callers gate on `isPrivyConfigured()` at the *component* boundary and
 * render a different component when unconfigured — never by calling this hook
 * conditionally.
 */

export type ServerSessionState =
  | 'unknown'      // not checked yet
  | 'none'         // no server session
  | 'syncing'      // exchanging the Privy token
  | 'active'       // server verified the login
  | 'unavailable'  // Privy or the session key is not configured server-side
  | 'error'

export interface PrivyAuthState {
  ready: boolean
  authenticated: boolean
  serverSession: ServerSessionState
  userId: string | null
  email: string | null
  walletAddress: string | null
  error: string | null
  login: () => void
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

export function usePrivyAuth(): PrivyAuthState {
  const { ready, authenticated, user, login, logout: privyLogout, getAccessToken } = usePrivy()

  const [serverSession, setServerSession] = useState<ServerSessionState>('unknown')
  const [serverUserId, setServerUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  /** Guards against two exchanges racing on a double render. */
  const exchanging = useRef(false)

  const exchange = useCallback(async () => {
    if (exchanging.current) return
    exchanging.current = true
    setError(null)
    setServerSession('syncing')
    try {
      const token = await getAccessToken()
      if (!token) {
        setServerSession('none')
        setServerUserId(null)
        return
      }
      const res = await fetch('/api/auth/privy', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
      })
      const body = await res.json().catch(() => ({}))
      if (res.status === 503) {
        setServerSession('unavailable')
        setError(body.hint ?? body.error ?? 'server-side Privy support is not configured')
        return
      }
      if (!res.ok) {
        setServerSession('error')
        setError(body.error ?? `session exchange failed (${res.status})`)
        return
      }
      setServerUserId(body.user?.userId ?? null)
      setServerSession('active')
    } catch (e) {
      setServerSession('error')
      setError(e instanceof Error ? e.message : 'session exchange failed')
    } finally {
      exchanging.current = false
    }
  }, [getAccessToken])

  // Exchange once Privy reports an authenticated browser; clear on logout.
  // Only re-runs from 'unknown'/'none' so a failed exchange does not spin.
  useEffect(() => {
    if (!ready) return
    if (authenticated) {
      if (serverSession === 'unknown' || serverSession === 'none') void exchange()
    } else if (serverSession !== 'none') {
      setServerSession('none')
      setServerUserId(null)
    }
  }, [ready, authenticated, serverSession, exchange])

  const logout = useCallback(async () => {
    // Clear our cookie first: if Privy's logout fails we still want the server
    // session gone, rather than a cookie outliving the intent to log out.
    await fetch('/api/auth/privy', { method: 'DELETE' }).catch(() => {})
    setServerSession('none')
    setServerUserId(null)
    await privyLogout()
  }, [privyLogout])

  return {
    ready,
    authenticated,
    serverSession,
    userId: serverUserId ?? user?.id ?? null,
    email: typeof user?.email?.address === 'string' ? user.email.address : null,
    walletAddress: user?.wallet?.address ?? null,
    error,
    login,
    logout,
    refresh: exchange,
  }
}
