'use client';

import { usePrivy } from '@privy-io/react-auth';
import { PrivyLoginButton } from '@/components/privy-login-button';
import { useEffect, useState } from 'react';
import { getWalletBalance } from '@/lib/solana-donation';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Wallet, TrendingUp, Gift, Users } from 'lucide-react';

export function PrivyWalletDashboard() {
  const { user, authenticated } = usePrivy();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authenticated && user?.wallet?.address) {
      setLoading(true);
      getWalletBalance(user.wallet.address)
        .then(setBalance)
        .finally(() => setLoading(false));
    }
  }, [authenticated, user?.wallet?.address]);

  if (!authenticated) {
    return (
      <div className="p-8 rounded-lg border border-slate-800 bg-slate-900/30 text-center space-y-4">
        <h3 className="text-lg font-semibold">Connect Your Wallet</h3>
        <p className="text-slate-400 text-sm">
          Link your wallet to start making donations and track your impact
        </p>
        <PrivyLoginButton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Connected Wallet Card */}
        <div className="p-6 rounded-lg border border-teal-500/20 bg-gradient-to-br from-teal-500/10 to-transparent">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase text-teal-400 font-bold mb-2">
                Connected Wallet
              </p>
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Privy
              </h3>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-teal-500/10">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Address</span>
              <code className="text-[10px] text-teal-400 font-mono bg-black/30 px-2 py-1 rounded">
                {user?.wallet?.address?.slice(0, 8)}...
                {user?.wallet?.address?.slice(-8)}
              </code>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Balance</span>
              <div className="flex items-center gap-2">
                {loading ? (
                  <span className="text-slate-500 animate-pulse">Loading...</span>
                ) : (
                  <span className="text-lg font-bold text-lime-400">
                    {balance?.toFixed(4) || '0.0000'} SOL
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Network</span>
              <span className="text-sm font-mono text-teal-400">Devnet</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/50">
            <p className="text-[10px] uppercase text-slate-500 font-bold mb-2">
              Total Donated
            </p>
            <p className="text-2xl font-bold text-lime-400">$2,317</p>
            <p className="text-[10px] text-slate-500 mt-1">12 donations</p>
          </div>

          <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/50">
            <p className="text-[10px] uppercase text-slate-500 font-bold mb-2">
              Charities Helped
            </p>
            <p className="text-2xl font-bold text-teal-400">7</p>
            <p className="text-[10px] text-slate-500 mt-1">Multiple causes</p>
          </div>

          <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/50">
            <p className="text-[10px] uppercase text-slate-500 font-bold mb-2">
              Impact Score
            </p>
            <p className="text-2xl font-bold text-cyan-400">94/100</p>
            <p className="text-[10px] text-slate-500 mt-1">Excellent donor</p>
          </div>

          <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/50">
            <p className="text-[10px] uppercase text-slate-500 font-bold mb-2">
              Community Rank
            </p>
            <p className="text-2xl font-bold text-purple-400">#47</p>
            <p className="text-[10px] text-slate-500 mt-1">Top 1% donors</p>
          </div>
        </div>
      </div>

      {/* Donation Activity */}
      <div className="p-6 rounded-lg border border-slate-800 bg-slate-900/30">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-teal-400" />
          Donation Activity
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={[
              { month: 'Jan', amount: 120, count: 2 },
              { month: 'Feb', amount: 150, count: 3 },
              { month: 'Mar', amount: 200, count: 4 },
              { month: 'Apr', amount: 280, count: 5 },
              { month: 'May', amount: 220, count: 3 },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Donations */}
      <div className="p-6 rounded-lg border border-slate-800 bg-slate-900/30">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Gift className="w-5 h-5 text-lime-400" />
          Recent Donations
        </h3>

        <div className="space-y-3">
          {[
            {
              charity: 'Solar Future Foundation',
              amount: '0.5',
              date: '2 hours ago',
            },
            {
              charity: 'Kids First DAO',
              amount: '0.25',
              date: '1 day ago',
            },
            {
              charity: 'Open Water Relief',
              amount: '1.2',
              date: '3 days ago',
            },
          ].map((donation, i) => (
            <div
              key={i}
              className="flex justify-between items-center p-3 rounded border border-slate-800/50 bg-slate-900/20"
            >
              <div>
                <p className="font-medium text-white">{donation.charity}</p>
                <p className="text-[10px] text-slate-500">{donation.date}</p>
              </div>
              <span className="font-bold text-lime-400">
                +{donation.amount} SOL
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Connected Charities */}
      <div className="p-6 rounded-lg border border-slate-800 bg-slate-900/30">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Users className="w-5 h-5 text-teal-400" />
          Connected Charities
        </h3>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              name: 'Solar Future',
              category: 'Climate',
              followers: '12,045',
            },
            {
              name: 'Kids First DAO',
              category: 'Children',
              followers: '8,332',
            },
            {
              name: 'Open Water',
              category: 'Humanitarian',
              followers: '25,101',
            },
          ].map((charity, i) => (
            <div
              key={i}
              className="p-4 rounded border border-slate-800 bg-slate-900/50 hover:border-teal-500/50 transition"
            >
              <p className="font-semibold text-white">{charity.name}</p>
              <p className="text-[10px] text-slate-500 uppercase my-2">
                {charity.category}
              </p>
              <p className="text-sm text-lime-400">{charity.followers} followers</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
