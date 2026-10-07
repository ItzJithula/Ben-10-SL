import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native module — keep it external to the server bundle.
  serverExternalPackages: ["better-sqlite3"],
  // Allow the hosted dev preview / LAN devices to load dev assets.
  allowedDevOrigins: [
    "*.e2b.app",
    "*.e2b.dev",
    "*.vercel.app",
    "localhost",
    "127.0.0.1",
    ...(process.env.ALLOWED_DEV_ORIGINS?.split(",").map((origin) => origin.trim()) ?? []),
  ],
  images: {
    // Covers, posters and the site logo are stored as remote URLs (e.g. ibb.co / catbox).
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
