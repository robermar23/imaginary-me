import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'imaginary me — Reimagine yourself in infinite worlds',
  description:
    'Tell us what you love. Upload a photo. Discover who you could be through AI-generated portraits.',
  openGraph: {
    title: 'imaginary me',
    description: 'Reimagine yourself in infinite worlds',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0f',
}

interface RootLayoutProps {
  readonly children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#1a1a28',
              color: '#f0f0f8',
              border: '1px solid #2a2a3d',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
            },
            success: {
              iconTheme: { primary: '#00c27a', secondary: '#f0f0f8' },
            },
            error: {
              iconTheme: { primary: '#ff4455', secondary: '#f0f0f8' },
            },
          }}
        />
      </body>
    </html>
  )
}
