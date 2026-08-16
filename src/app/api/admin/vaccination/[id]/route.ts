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
    const { disease, animals, firstDose, booster, annual, vaccine, order } =
      body as {
        disease?: string;
        animals?: string;
        firstDose?: string;
        booster?: string;
        annual?: string;
        vaccine?: string;
        order?: number;
      };

    if (!disease || !vaccine) {
      return NextResponse.json(
        { error: "Disease and vaccine are required" },
        { status: 400 }
      );
    }

    const item = await prisma.vaccinationSchedule.update({
      where: { id },
      data: {
        disease: disease.trim(),
        animals: animals?.trim() || "",
        firstDose: firstDose?.trim() || "",
        booster: booster?.trim() || "",
        annual: annual?.trim() || "",
        vaccine: vaccine.trim(),
        order: order ?? 0,
      },
    });
    logAudit({
      action: "vaccination.update",
      actor: session.user.email,
      target: id,
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Vaccination update error:", error);
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
    await prisma.vaccinationSchedule.delete({ where: { id } });
    logAudit({
      action: "vaccination.delete",
      actor: session.user.email,
      target: id,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Vaccination delete error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
