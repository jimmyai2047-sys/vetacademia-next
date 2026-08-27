import type { NextConfig } from "next";

// NOTE: The Content-Security-Policy is now generated per-request in `src/proxy.ts`
// with a fresh nonce on `script-src`. It is intentionally NOT set here to avoid
// clobbering the nonce'd header. The remaining headers are static.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "@prisma/adapter-pg", "pg"],
  experimental: {
    // Disable Turbopack's persistent filesystem cache for builds. The cache
    // uses RocksDB SST files which fail to write under paths containing
    // parentheses (e.g. "VetAcademia (VA)") on Windows ("os error 3").
    turbopackFileSystemCacheForBuild: false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Allow Vercel Blob (expert photos, blog covers, study-material images)
    // to be served through the Next.js image optimizer.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "*.private.blob.vercel-storage.com",
      },
    ],
    // The /api/blob proxy serves remote blob images through a local path with a
    // `?url=...` query string, so it must be allowed as a local pattern.
    // Static assets under /images and /logos also need to be allowed locally.
    localPatterns: [
      { pathname: "/images/**" },
      { pathname: "/logos/**" },
      { pathname: "/api/blob**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
