'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut, Wallet } from 'lucide-react';

export function PrivyLoginButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();

  if (!ready) {
    return (
      <Button disabled className="gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (authenticated && user?.wallet?.address) {
    return (
      <div className="flex items-center gap-2">
        <div className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-sm font-mono">
          {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => logout()}
          title="Disconnect"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={login} className="gap-2">
      <Wallet className="w-4 h-4" />
      Connect Wallet
    </Button>
  );
}
