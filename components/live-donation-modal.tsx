'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Send, AlertCircle } from 'lucide-react';

interface DonationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  charityName: string;
  charityAddress: string;
  charityId: string;
}

export function LiveDonationModal({
  open,
  onOpenChange,
  charityName,
  charityAddress,
  charityId,
}: DonationModalProps) {
  const { user, sendTransaction } = usePrivy();
  const [amount, setAmount] = useState('0.1');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  const handleDonate = async () => {
    if (!user?.wallet?.address) {
      toast.error('Please connect your wallet first');
      return;
    }

    setLoading(true);

    try {
      // Create donation transaction
      const response = await fetch('/api/donations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderAddress: user.wallet.address,
          amount: parseFloat(amount),
          charityAddress,
          charityName,
          charityId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create donation transaction');
      }

      const data = await response.json();
      setBalance(data.balance);

      if (data.balance < parseFloat(amount)) {
        toast.info(
          'Insufficient balance. Please request testnet SOL from faucet.'
        );
        setLoading(false);
        return;
      }

      // Send transaction through Privy
      if (sendTransaction) {
        const txBuffer = Buffer.from(data.transaction, 'base64');
        const signature = await sendTransaction(txBuffer);

        toast.success(`Donation sent! Signature: ${signature.substring(0, 20)}...`);
        onOpenChange(false);
        setAmount('0.1');
      }
    } catch (error) {
      console.error('Donation error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to send donation'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Donate to {charityName}</DialogTitle>
          <DialogDescription>
            Send a donation via Solana Devnet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!user?.wallet?.address && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                Connect your wallet to donate
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (SOL)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
              step="0.001"
              min="0"
            />
          </div>

          {balance !== null && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground">
                Wallet Balance: <span className="font-semibold">{balance.toFixed(4)} SOL</span>
              </p>
            </div>
          )}

          <div className="pt-2 space-y-2">
            <Button
              onClick={handleDonate}
              disabled={loading || !user?.wallet?.address || !amount}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Donation
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Charity Address: {charityAddress.slice(0, 8)}...{charityAddress.slice(-8)}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
