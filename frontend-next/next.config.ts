import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable experimental features if needed
  experimental: {
    // serverActions are enabled by default in Next.js 15
  },
  // Environment variables that should be available on the client
  env: {
    // Add any public env vars here
  },
};

export default nextConfig;

