'use client';

import Link from 'next/link';
import { useIsPrivyConfigured } from '@/components/providers/privy-provider';
import { usePrivyAuth } from '@/hooks/use-privy-auth';

const mono = { fontFamily: 'var(--font-jetbrains), monospace' } as const;

/**
 * Sign-in control for the nav and inline surfaces.
 *
 * Splits on configuration at the component boundary — `usePrivy()` throws
 * outside a mounted PrivyProvider, and the provider is a no-op without an app
 * id — so the unconfigured case renders a link to /login, which explains what
 * to set, instead of calling the hook.
 *
 * The split reads the provider's own context rather than an env var: in client
 * code `NEXT_PUBLIC_*` is a build-time constant, so an env check here could
 * disagree with whether the provider actually mounted and call the hook outside
 * it.
 */
export function PrivyLoginButton() {
  if (!useIsPrivyConfigured()) {
    return (
      <Link
        href="/login"
        style={mono}
        className="px-3 py-1.5 border border-slate-700 text-slate-400 text-[10px] uppercase hover:border-teal-500/40 hover:text-teal-300"
      >
        Sign in
      </Link>
    );
  }
  return <ConnectedButton />;
}

function ConnectedButton() {
  const auth = usePrivyAuth();

  if (!auth.ready) {
    return (
      <span style={mono} className="px-3 py-1.5 border border-slate-800 text-slate-500 text-[10px] uppercase">
        Loading…
      </span>
    );
  }

  if (!auth.authenticated) {
    return (
      <button
        onClick={auth.login}
        style={mono}
        className="px-3 py-1.5 bg-teal-400 text-slate-950 font-bold text-[10px] uppercase hover:bg-teal-300"
      >
        Sign in
      </button>
    );
  }

  const label =
    auth.walletAddress
      ? `${auth.walletAddress.slice(0, 4)}…${auth.walletAddress.slice(-4)}`
      : auth.email ?? 'signed in';

  return (
    <div className="flex items-center gap-2" style={mono}>
      <span
        className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 border text-[10px] ${
          auth.serverSession === 'active'
            ? 'border-teal-500/40 bg-teal-500/5 text-teal-300'
            : 'border-amber-500/40 bg-amber-500/5 text-amber-300'
        }`}
        // The dot is the honest signal: green only once the server verified it.
        title={
          auth.serverSession === 'active'
            ? 'Session verified by the server'
            : 'Signed in to Privy, but the server has not verified this session'
        }
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            auth.serverSession === 'active' ? 'bg-lime-400' : 'bg-amber-400'
          }`}
        />
        <span className="truncate max-w-[12ch]">{label}</span>
      </span>
      <button
        onClick={() => void auth.logout()}
        className="px-3 py-1.5 border border-slate-700 text-slate-300 text-[10px] uppercase hover:border-rose-500/40 hover:text-rose-300"
      >
        Sign out
      </button>
    </div>
  );
}
