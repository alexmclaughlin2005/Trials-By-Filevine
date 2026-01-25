import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@juries/types',
  ],
  // Disabled Turbopack temporarily due to ESM module resolution issues
  // experimental: {
  //   turbo: {},
  // },
};

export default nextConfig;
