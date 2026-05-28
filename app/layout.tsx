import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Outfit, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/components/providers'
import { SolanaWalletProvider } from '@/lib/solana-provider'
import { PrivyWalletProvider } from '@/components/providers/privy-provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '600', '800'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '700'],
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '600', '800'],
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['500', '700'],
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://donate-protocol.example'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Donate Protocol | Trade Smarter. Give Automatically.',
    template: '%s · Donate Protocol',
  },
  description:
    'A Solana-native protocol that transforms trading activity into continuous impact. Automate strategies, copy operators, and route profits to verified causes on-chain.',
  keywords: [
    'Solana', 'DeFi', 'charity', 'donation', 'trading', 'copy trading',
    'TradingView', 'Jupiter', 'agent', 'OpenClaw', 'MCP', 'impact',
  ],
  authors: [{ name: 'Donate Protocol' }],
  category: 'finance',
  openGraph: {
    title: 'Donate Protocol | Trade Smarter. Give Automatically.',
    description:
      'A Solana-native protocol that transforms trading activity into continuous impact.',
    url: siteUrl,
    siteName: 'Donate Protocol',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Donate Protocol',
    description: 'Trade smarter. Give automatically. Solana-native impact infrastructure.',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${outfit.variable} ${spaceGrotesk.variable} bg-background`}
    >
      <body className="antialiased">
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <PrivyWalletProvider>
          <SolanaWalletProvider>
            {children}
            {process.env.NODE_ENV === 'production' && <Analytics />}
          </SolanaWalletProvider>
        </PrivyWalletProvider>
      </body>
    </html>
  )
}
