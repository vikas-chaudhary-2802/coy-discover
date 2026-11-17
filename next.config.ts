import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // PGlite ships WASM + data files that must be loaded from node_modules at runtime.
  serverExternalPackages: ["@electric-sql/pglite"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  // The assignment names the endpoints /feed, /swipe and /matches.
  // They live under /api, and these aliases make the short paths work too.
  async rewrites() {
    return [
      { source: "/feed", destination: "/api/feed" },
      { source: "/swipe", destination: "/api/swipe" },
      { source: "/matches", destination: "/api/matches" },
    ];
  },
};

export default nextConfig;
