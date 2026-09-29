'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useWallets as useSolanaWallets } from '@privy-io/react-auth/solana';
import { useCallback } from 'react';

/**
 * Wallets attached to the logged-in Privy user.
 *
 * Solana wallets come from the `/solana` entry point, not from the main
 * `useWallets()`. The previous version looked for
 * `useWallets().find(w => w.walletClientType === 'solana')`, which never
 * matched: `walletClientType` names the *provider* ('privy', 'phantom',
 * 'metamask'), and the main hook only returns EVM wallets, so `solanaWallet`
 * was permanently undefined and the Solana path silently did nothing.
 */
export function usePrivyWallet() {
  const { user, logout, ready, authenticated } = usePrivy();
  const { wallets: evmWallets } = useWallets();
  const { wallets: solanaWallets } = useSolanaWallets();

  const solanaWallet = solanaWallets[0];
  const ethereumWallet = evmWallets.find((w) => w.chainType === 'ethereum');

  const disconnectWallet = useCallback(async () => {
    await logout();
  }, [logout]);

  return {
    user,
    ready,
    authenticated,
    solanaWallet,
    ethereumWallet,
    solanaWallets,
    evmWallets,
    disconnectWallet,
    solanaAddress: solanaWallet?.address,
    ethereumAddress: ethereumWallet?.address,
  };
}
