import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'allone.ge',
      },
      {
        protocol: 'https',
        hostname: 'www.allone.ge',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'motion-primitives.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 90, 100],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Optimize production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    inlineCss: true,
  },
  turbopack: {
    root: '/Users/macintoshi/projects/allone-website',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
