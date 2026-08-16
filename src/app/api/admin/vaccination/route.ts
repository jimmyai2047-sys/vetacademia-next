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
    const items = await prisma.vaccinationSchedule.findMany({
      orderBy: [{ order: "asc" }, { disease: "asc" }],
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Vaccination list error:", error);
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

    const item = await prisma.vaccinationSchedule.create({
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
      action: "vaccination.create",
      actor: session.user.email,
      target: item.id,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Vaccination create error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
