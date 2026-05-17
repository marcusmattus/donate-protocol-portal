import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Outfit, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SolanaWalletProvider } from '@/lib/solana-provider'
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

export const metadata: Metadata = {
  title: 'Donate Protocol | Agentic Impact Infrastructure',
  description:
    'The agentic financial layer that converts trading alpha into real-world impact. Automate strategies and distribute profits to global causes via Solana.',
  keywords: ['DeFi', 'Solana', 'charity', 'trading', 'impact', 'donate'],
  openGraph: {
    title: 'Donate Protocol | Trade Smarter. Give Automatically.',
    description:
      'A Solana-native protocol that transforms trading activity into continuous impact.',
    type: 'website',
  },
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
        <SolanaWalletProvider>
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </SolanaWalletProvider>
      </body>
    </html>
  )
}
