import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Providers } from './providers'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://synergize.example.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Synergize - CS2 Community',
    template: '%s | Synergize',
  },
  description: 'The ultimate CS2 community platform. Browse servers, check leaderboards, and join the action.',
  keywords: ['CS2', 'Counter-Strike 2', 'gaming', 'community', 'servers', 'leaderboards', 'bans', 'stats'],
  authors: [{ name: 'Synergize' }],
  creator: 'Synergize',
  publisher: 'Synergize',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Synergize',
    title: 'Synergize - CS2 Community',
    description: 'The ultimate CS2 community platform. Browse servers, track stats, and join the action.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Synergize CS2 Community Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Synergize - CS2 Community',
    description: 'The ultimate CS2 community platform',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: siteUrl,
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f0f14',
  width: 'device-width',
  initialScale: 1,
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
          <LoadingScreen />
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
