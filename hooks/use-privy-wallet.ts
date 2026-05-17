'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useCallback } from 'react';

export function usePrivyWallet() {
  const { user, logout, ready, authenticated } = usePrivy();
  const { wallets } = useWallets();

  const solanaWallet = wallets.find((w) => w.walletClientType === 'solana');
  const ethereumWallet = wallets.find((w) => w.chainType === 'ethereum');

  const connectSolanaWallet = useCallback(async () => {
    if (solanaWallet) {
      await solanaWallet.switchChain?.('solana:devnet');
      return solanaWallet;
    }
  }, [solanaWallet]);

  const disconnectWallet = useCallback(async () => {
    await logout();
  }, [logout]);

  return {
    user,
    ready,
    authenticated,
    solanaWallet,
    ethereumWallet,
    wallets,
    connectSolanaWallet,
    disconnectWallet,
    solanaAddress: solanaWallet?.address,
    ethereumAddress: ethereumWallet?.address,
  };
}
