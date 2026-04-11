import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack doesn't walk up and pick
  // /Users/akeen/package-lock.json as the root. Without this, error
  // traces show as ./RateMyWater/src/... and module resolution breaks.
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
