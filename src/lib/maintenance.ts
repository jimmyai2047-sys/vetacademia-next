import { Redis } from "@upstash/redis";
import { env } from "./env";

// Fleet-wide maintenance kill-switch backed by shared Redis (works across
// serverless instances, unlike the old in-memory flag). Reads are cached
// 10s per instance so the hot path costs at most one Redis GET per 10s.
// Edge-safe: no Node APIs, no Prisma (proxy.ts runs on the Edge).
const KEY = "va:maintenance";
const CACHE_TTL_MS = 10_000;

let cachedValue = false;
let cachedAt = 0;

function client(): Redis | null {
  if (!env.REDIS_URL || !env.REDIS_TOKEN) return null;
  return new Redis({ url: env.REDIS_URL, token: env.REDIS_TOKEN });
}

export async function isMaintenanceOn(): Promise<boolean> {
  if (Date.now() - cachedAt < CACHE_TTL_MS) return cachedValue;
  try {
    const redis = client();
    if (!redis) {
      cachedValue = false;
      cachedAt = Date.now();
      return false;
    }
    const v = await redis.get(KEY);
    cachedValue = v === "1" || v === 1 || v === true;
    cachedAt = Date.now();
    return cachedValue;
  } catch (err) {
    console.error("[maintenance] read error, staying live:", err);
    cachedValue = false;
    cachedAt = Date.now();
    return false;
  }
}

export async function setMaintenanceMode(value: boolean): Promise<void> {
  cachedValue = value;
  cachedAt = Date.now();
  try {
    const redis = client();
    if (redis) await redis.set(KEY, value ? "1" : "0");
  } catch (err) {
    console.error("[maintenance] write error:", err);
  }
}
