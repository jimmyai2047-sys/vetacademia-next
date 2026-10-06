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
  // PDF report routes read fonts/logo/sketches from disk at runtime.
  // The loaders in src/lib/pdf-static-assets.ts use only static literal
  // paths (Vercel-safe), and these includes guarantee the files are
  // packaged with the serverless functions.
  outputFileTracingIncludes: {
    "/api/reports/preview": [
      "./public/fonts/NotoSansDevanagari-Regular.ttf",
      "./public/fonts/NotoSansDevanagari-Bold.ttf",
      "./public/logo-vetacademia.png",
      "./assets/sketches/*.png",
    ],
    "/api/reports/finalize": [
      "./public/fonts/NotoSansDevanagari-Regular.ttf",
      "./public/fonts/NotoSansDevanagari-Bold.ttf",
      "./public/logo-vetacademia.png",
      "./assets/sketches/*.png",
    ],
  },
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
      { pathname: "/logo-vetacademia.webp" },
      { pathname: "/logo-vetacademia.png" },
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
  async redirects() {
    return [
      // Expert Advisory merged into the Animal Owner Corner.
      { source: "/advisory", destination: "/farmers", permanent: true },
      // Canonical host: always serve the apex domain. www -> apex 301 so
      // search engines see a single origin and the canonical tag matches.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.vetacademia.in" }],
        destination: "https://vetacademia.in/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
