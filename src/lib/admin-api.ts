import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { adminRateLimit, strictRateLimit } from "@/lib/rate-limit";

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export async function requireAdminApi(
  req: Request,
  opts?: { strict?: boolean; method?: string }
) {
  const session = await getAdminSession();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const ip = getClientIp(req);
  const path = new URL(req.url).pathname;
  const limiter = opts?.strict ? strictRateLimit : adminRateLimit;
  const { allowed } = limiter(ip, path);
  if (!allowed) {
    return {
      error: NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      ),
    };
  }

  const method = opts?.method || req.method;
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host) {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return {
          error: NextResponse.json(
            { error: "CSRF validation failed" },
            { status: 403 }
          ),
        };
      }
    }
    const contentType = req.headers.get("content-type");
    if (
      method !== "DELETE" &&
      contentType &&
      contentType.includes("application/json")
    ) {
      const csrfHeader = req.headers.get("x-requested-with");
      if (!csrfHeader || csrfHeader !== "XMLHttpRequest") {
        const referer = req.headers.get("referer");
        if (!referer) {
          return {
            error: NextResponse.json(
              { error: "CSRF validation failed" },
              { status: 403 }
            ),
          };
        }
      }
    }
  }

  return { session };
}

export const ALLOWED_SETTING_KEYS = new Set([
  "siteName",
  "siteUrl",
  "siteDescription",
  "contactEmail",
  "contactPhone",
  "currency",
  "taxRate",
  "notifyNewUser",
  "notifyPayment",
  "notifyBooking",
  "maintenanceMode",
]);

export function validateSettingKey(key: string): boolean {
  return ALLOWED_SETTING_KEYS.has(key);
}

export function validateSettingValue(key: string, value: string): boolean {
  if (typeof value !== "string") return false;
  if (value.length > 2000) return false;
  if (key === "taxRate") {
    const n = Number(value);
    if (isNaN(n) || n < 0 || n > 100) return false;
  }
  if (key === "siteUrl" || key === "contactEmail") {
    try {
      if (key === "siteUrl") new URL(value);
    } catch {
      return false;
    }
  }
  return true;
}
