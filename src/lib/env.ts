/**
 * Central environment reader for server code (edge-safe: no Node APIs).
 *
 * Semantics mirror the previous per-module `process.env` reads exactly —
 * optional secrets stay `string | undefined` and each caller keeps its own
 * fail-closed logic (throw / fallback / refuse). Nothing here throws, so
 * importing this module never breaks builds or cold starts; misconfiguration
 * surfaces at the same place it always did: the feature that needs the key.
 */
function v(name: string): string | undefined {
  const val = process.env[name];
  return val === "" ? undefined : val;
}

export const env = {
  get NODE_ENV(): string {
    return process.env.NODE_ENV ?? "development";
  },
  get isProd(): boolean {
    return (process.env.NODE_ENV ?? "development") === "production";
  },
  /** Postgres connection string (Neon). Required at query time by prisma.ts. */
  DATABASE_URL: v("DATABASE_URL"),
  /** Session/OTP signing secret. auth.ts throws without it; otp/reset-token refuse. */
  NEXTAUTH_SECRET: v("NEXTAUTH_SECRET"),
  /** Mobile vJWT HMAC secret. mobileAuth.ts throws in production without it. */
  MOBILE_JWT_SECRET: v("MOBILE_JWT_SECRET"),
  /** Vercel Blob read-write token for private uploads/signing. */
  BLOB_READ_WRITE_TOKEN: v("BLOB_READ_WRITE_TOKEN"),
  RAZORPAY_KEY_ID: v("RAZORPAY_KEY_ID"),
  RAZORPAY_KEY_SECRET: v("RAZORPAY_KEY_SECRET"),
  RAZORPAY_WEBHOOK_SECRET: v("RAZORPAY_WEBHOOK_SECRET"),
  RESEND_API_KEY: v("RESEND_API_KEY"),
  EMAIL_FROM: v("EMAIL_FROM"),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  /** Upstash Redis (Marketplace) with legacy Vercel-KV names as fallback. */
  REDIS_URL: v("UPSTASH_REDIS_REST_URL") || v("KV_REST_API_URL") || "",
  REDIS_TOKEN: v("UPSTASH_REDIS_REST_TOKEN") || v("KV_REST_API_TOKEN") || "",
} as const;
