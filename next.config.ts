import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't use standalone output on Vercel — Vercel handles deployment natively.
  // Standalone is only needed for self-hosted Docker/Node deployments.
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
};

export default nextConfig;
