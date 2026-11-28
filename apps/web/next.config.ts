import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const apiUrl = process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:3001';
const monorepoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** The destination the pre-v2 routes belonged to. */
const LEGACY_DESTINATION = 'coxs-bazar';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    agentUpgrade: 'security',
  },
  turbopack: {
    root: monorepoRoot,
  },
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
  /** Every route from the map-centred build answers with a permanent redirect (design.md 6.3). */
  async redirects() {
    return [
      {
        source: '/',
        has: [{ type: 'query', key: 'point', value: '(?<point>[A-Za-z]+)' }],
        destination: '/sunbeds/:point',
        permanent: true,
      },
      { source: '/hotels', destination: `/d/${LEGACY_DESTINATION}/stay`, permanent: true },
      { source: '/hotels/:slug', destination: '/l/hotel-:slug', permanent: true },
      { source: '/food/orders/:ref', destination: '/trips/:ref', permanent: true },
      { source: '/food/reservations/:ref', destination: '/trips/:ref', permanent: true },
      { source: '/food', destination: `/d/${LEGACY_DESTINATION}/food`, permanent: true },
      { source: '/food/:code', destination: '/l/dining-:code', permanent: true },
      { source: '/bookings', destination: '/trips', permanent: true },
      { source: '/bookings/:ref', destination: '/trips/:ref', permanent: true },
      { source: '/rides', destination: `/d/${LEGACY_DESTINATION}/rides`, permanent: true },
      { source: '/activities', destination: `/d/${LEGACY_DESTINATION}/tours`, permanent: true },
      {
        source: '/admin/points',
        destination: `/admin/destinations/${LEGACY_DESTINATION}`,
        permanent: true,
      },
      {
        source: '/admin/points/:code',
        destination: `/admin/destinations/${LEGACY_DESTINATION}`,
        permanent: true,
      },
      { source: '/admin/dining', destination: '/provider', permanent: true },
      { source: '/admin/dining/venues', destination: '/provider/listings', permanent: true },
      {
        source: '/admin/dining/venues/:code',
        destination: '/provider/listings/:code',
        permanent: true,
      },
      { source: '/admin/dining/reservations', destination: '/provider/bookings', permanent: true },
      { source: '/admin/dining/kitchen', destination: '/provider/orders', permanent: true },
    ];
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
