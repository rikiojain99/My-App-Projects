import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow production builds to succeed even if there are ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
