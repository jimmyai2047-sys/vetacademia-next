import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

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
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await prisma.setting.findMany();
    const settings: Record<string, string> = { ...DEFAULTS };
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const entries = Object.entries(body) as [string, string][];

    if (entries.length === 0) {
      return NextResponse.json({ error: "No settings provided" }, { status: 400 });
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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Settings save error:", error);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
