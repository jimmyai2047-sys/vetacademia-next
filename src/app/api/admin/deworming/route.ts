import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const items = await prisma.dewormingSchedule.findMany({
      orderBy: [{ order: "asc" }, { animal: "asc" }],
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Deworming list error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { animal, firstDose, frequency, bestTime, products, order } = body as {
      animal?: string;
      firstDose?: string;
      frequency?: string;
      bestTime?: string;
      products?: string;
      order?: number;
    };

    if (!animal || !products) {
      return NextResponse.json(
        { error: "Animal and products are required" },
        { status: 400 }
      );
    }

    const item = await prisma.dewormingSchedule.create({
      data: {
        animal: animal.trim(),
        firstDose: firstDose?.trim() || "",
        frequency: frequency?.trim() || "",
        bestTime: bestTime?.trim() || "",
        products: products.trim(),
        order: order ?? 0,
      },
    });
    logAudit({
      action: "deworming.create",
      actor: session.user.email,
      target: item.id,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Deworming create error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
