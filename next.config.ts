import type { NextConfig } from 'next'

const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

const nextConfig: NextConfig = {
  // Native-binary packages must be excluded from the Turbopack/webpack server bundle
  // so Node.js can load the platform-specific .node file at runtime.
  serverExternalPackages: ['@resvg/resvg-js'],

  images: {
    remotePatterns: [
      // Vercel Blob CDN — generated images and uploaded photos
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      // picsum.photos — MockProvider placeholder images during dev
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: SECURITY_HEADERS,
      },
    ]
  },
}

export default nextConfig
