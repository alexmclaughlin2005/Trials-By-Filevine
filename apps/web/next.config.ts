import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@juries/types'],
  experimental: {
    turbo: {},
  },
};

export default nextConfig;
