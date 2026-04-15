// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { DM_Sans, DM_Mono } from 'next/font/google'
import { Providers } from '@/components/layout/Providers'
import '@/styles/globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-sans',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

// ── Metadata completa para PWA ────────────────────────────
export const metadata: Metadata = {
  title: { default: 'Locações', template: '%s | Sistema de Locações' },
  description: 'Sistema profissional de gestão de acervo e locações para eventos',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Locações',
    startupImage: ['/icons/icon-512.png'],
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/icons/icon-192.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#a855f7',
    'msapplication-TileImage': '/icons/icon-144.png',
  },
}

// ── Viewport / theme color ────────────────────────────────
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#a855f7' },
    { media: '(prefers-color-scheme: light)', color: '#7c3aed' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${dmSans.variable} ${dmMono.variable}`}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}