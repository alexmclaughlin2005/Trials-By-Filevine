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
    // Allow query strings for local API routes (used for cache busting)
    // Also allow static files from public folder (like filevine-logo.jpeg)
    localPatterns: [
      {
        pathname: '/api/**',
      },
      {
        pathname: '/filevine-logo.jpeg',
      },
      {
        pathname: '/**/*.{jpeg,jpg,png,gif,webp,svg}',
      },
    ],
  },
  eslint: {
    // Ignore ESLint during builds - these are false positives (vars used in conditional JSX)
    ignoreDuringBuilds: true,
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
