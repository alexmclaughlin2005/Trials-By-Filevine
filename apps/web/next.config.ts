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
  // Disabled Turbopack temporarily due to ESM module resolution issues
  // experimental: {
  //   turbo: {},
  // },
};

export default nextConfig;
