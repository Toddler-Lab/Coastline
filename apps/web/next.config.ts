import type { NextConfig } from 'next';

const apiUrl = process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:3001';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The dev server only allows its own hostname by default. This demo is opened through
  // both `localhost` and `127.0.0.1`, so allow the loopback alias too. Without it the
  // browser blocks the dev client runtime and the page never hydrates.
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
