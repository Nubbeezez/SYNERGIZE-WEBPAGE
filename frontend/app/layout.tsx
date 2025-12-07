import type { Metadata } from 'next'
import './globals.css'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: {
    default: 'Synergize - CS2 Community',
    template: '%s | Synergize',
  },
  description: 'The ultimate CS2 community platform. Browse servers, check leaderboards, and join the action.',
  keywords: ['CS2', 'Counter-Strike 2', 'gaming', 'community', 'servers', 'leaderboards'],
  authors: [{ name: 'Synergize' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Synergize',
    title: 'Synergize - CS2 Community',
    description: 'The ultimate CS2 community platform',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Synergize - CS2 Community',
    description: 'The ultimate CS2 community platform',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Navigation />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
