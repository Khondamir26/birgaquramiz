import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://telegram.org https://www.googletagmanager.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https: http://localhost:5000 http://127.0.0.1:5000`,
  "font-src 'self' data:",
  "connect-src 'self' http://localhost:5000 https://api.birga-quramiz.uz https://www.google-analytics.com https://cloudflareinsights.com",
  "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.birga-quramiz.uz',
      },
      {
        protocol: 'https',
        hostname: 'media.birga-quramiz.uz',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '5000',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '5000',
      },
      {
        protocol: 'https',
        hostname: '127.0.0.1',
        port: '5000',
      },
    ],
  },
  async headers() {
    const securityHeaders = [
      { key: 'Content-Security-Policy',    value: contentSecurityPolicy },
      { key: 'X-Frame-Options',            value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options',     value: 'nosniff' },
      { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security',  value: 'max-age=31536000; includeSubDomains; preload' },
      { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=()' },
    ]
    return [
      // Immutable cache for content-hashed static assets (JS/CSS chunks)
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Cache public images for 7 days
      {
        source: '/images/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },
      // Private/auth pages — never cache
      {
        source: '/(profile|orders|cart|checkout|admin|seller)(.*)',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store' },
          ...securityHeaders,
        ],
      },
      // Public pages — cache at Cloudflare edge for 60s, revalidate in background
      {
        source: '/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' },
          ...securityHeaders,
        ],
      },
    ]
  },
}

export default withNextIntl(nextConfig)
