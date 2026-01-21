import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@trialforge/types'],
  experimental: {
    turbo: {},
  },
};

export default nextConfig;
