import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep tracing rooted on this repo (avoids picking a parent package-lock.json).
  outputFileTracingRoot: path.join(__dirname),
  transpilePackages: ["lucide-react"],
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
