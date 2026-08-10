'use client'

import React, { useEffect } from 'react'

export function ExtensionErrorSuppressor() {
  useEffect(() => {
    // Suppress extension-related unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const message = reason?.message?.toString?.() || reason?.toString?.() || ''
      const stack = reason?.stack?.toString?.() || ''

      // Suppress wallet extension conflicts
      if (
        message.includes('BitcoinProvider') ||
        message.includes('StacksProvider') ||
        message.includes('redefine property') ||
        message.includes('walletProvider') ||
        message.includes('Exodus') ||
        message.includes('Xverse') ||
        stack.includes('chrome-extension')
      ) {
        event.preventDefault()
        return
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  }, [])

  return null
}
