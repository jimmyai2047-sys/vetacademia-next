import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdminApi,
  validateSettingKey,
  validateSettingValue,
} from "@/lib/admin-api";
import { setMaintenanceMode } from "@/proxy";

const DEFAULTS: Record<string, string> = {
  siteName: "VetAcademia",
  siteUrl: "https://vetacademia.com",
  siteDescription: "India's comprehensive veterinary education platform",
  contactEmail: "contact@vetacademia.com",
  contactPhone: "+91 89499 29291",
  currency: "INR",
  taxRate: "18",
  notifyNewUser: "true",
  notifyPayment: "true",
  notifyBooking: "true",
  maintenanceMode: "false",
};

export async function GET() {
  try {
    const rows = await prisma.setting.findMany();
    const settings: Record<string, string> = { ...DEFAULTS };
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    if (settings.maintenanceMode === "true") {
      setMaintenanceMode(true);
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
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

    await Promise.all(
      entries.map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );

    const maintenanceEntry = entries.find(([key]) => key === "maintenanceMode");
    if (maintenanceEntry) {
      setMaintenanceMode(maintenanceEntry[1] === "true");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Settings save error:", error);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
