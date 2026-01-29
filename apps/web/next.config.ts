import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@juries/types',
  ],
  images: {
    qualities: [75, 90, 100],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/api/**',
      },
    ],
  },
  eslint: {
    // Don't fail build on ESLint warnings (only errors)
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Don't fail build on TypeScript errors (we want to catch them, but this is a safety net)
    ignoreBuildErrors: false,
  },
  // Disabled Turbopack temporarily due to ESM module resolution issues
  // experimental: {
  //   turbo: {},
  // },
};

export default nextConfig;
