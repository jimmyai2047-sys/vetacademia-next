import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
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

    const item = await prisma.dewormingSchedule.update({
      where: { id },
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
      action: "deworming.update",
      actor: session.user.email,
      target: id,
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Deworming update error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    await prisma.dewormingSchedule.delete({ where: { id } });
    logAudit({
      action: "deworming.delete",
      actor: session.user.email,
      target: id,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Deworming delete error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
