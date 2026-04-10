import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Allow external image URLs if needed in future
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Allow local uploads served from /public
    unoptimized: false,
  },
};

export default nextConfig;
