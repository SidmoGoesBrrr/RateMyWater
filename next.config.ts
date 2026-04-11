import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["voyageai"],
  turbopack: {
    root: path.resolve(__dirname),
  },
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
