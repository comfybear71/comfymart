import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next.js bundles these into the serverless function by default, which
  // strips internals of `ws` (buffer-util.mask) and breaks the Neon
  // WebSocket driver used by Drizzle + Auth.js on the OAuth callback.
  // Marking them external keeps `require()` at runtime against node_modules.
  serverExternalPackages: ["ws", "@neondatabase/serverless"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
