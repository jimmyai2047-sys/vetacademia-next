import { validateCsrf } from "@/lib/csrf";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdminApi,
  validateSettingKey,
  validateSettingValue,
} from "@/lib/admin-api";
import { setMaintenanceMode } from "@/lib/maintenance";
import { logAudit } from "@/lib/audit";

const DEFAULTS: Record<string, string> = {
  siteName: "VetAcademia",
  siteUrl: "https://vetacademia.in",
  siteDescription: "India's comprehensive veterinary education platform",
  contactEmail: "contact@vetacademia.in",
  contactPhone: "+91 89499 29291",
  currency: "INR",
  taxRate: "18",
  notifyNewUser: "true",
  notifyPayment: "true",
  notifyBooking: "true",
  maintenanceMode: "false",
};

export async function GET(req: Request) {
  const auth = await requireAdminApi(req as any);
  if ("error" in auth) return auth.error;
  try {
    const rows = await prisma.setting.findMany();
    const settings: Record<string, string> = { ...DEFAULTS };
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    if (settings.maintenanceMode === "true") {
      await setMaintenanceMode(true);
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!validateCsrf(req)) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  const auth = await requireAdminApi(req, { strict: true });
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const entries = Object.entries(body) as [string, string][];

    if (entries.length === 0) {
      return NextResponse.json({ error: "No settings provided" }, { status: 400 });
    }

    if (entries.length > 50) {
      return NextResponse.json({ error: "Too many settings" }, { status: 400 });
    }

    for (const [key, value] of entries) {
      if (!validateSettingKey(key)) {
        return NextResponse.json(
          { error: `Invalid setting key: ${key}` },
          { status: 400 }
        );
      }
      if (!validateSettingValue(key, String(value))) {
        return NextResponse.json(
          { error: `Invalid value for ${key}` },
          { status: 400 }
        );
      }
    }

    const keys = entries.map(([key]) => key);
    const before = await prisma.setting.findMany({
      where: { key: { in: keys } },
      select: { key: true, value: true },
    });
    const beforeMap = new Map(before.map((r) => [r.key, r.value]));

    await Promise.all(
      entries.map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );

    logAudit({
      action: "settings.update",
      actor: auth.session!.user.id,
      target: keys.join(","),
      meta: {
        keys,
        changes: entries.map(([key, value]) => ({
          key,
          from: beforeMap.get(key) ?? null,
          to: String(value),
        })),
      },
    });

    const maintenanceEntry = entries.find(([key]) => key === "maintenanceMode");
    if (maintenanceEntry) {
      await setMaintenanceMode(maintenanceEntry[1] === "true");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Settings save error:", error);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
