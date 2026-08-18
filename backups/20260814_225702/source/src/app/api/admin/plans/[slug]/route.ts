import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await req.json().catch(() => ({}));
    const price = body?.price;
    const description = body?.description;

    if (typeof price !== "number" || price < 0) {
      return NextResponse.json(
        { error: "Valid price (number >= 0) is required" },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.findUnique({ where: { slug } });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const updated = await prisma.plan.update({
      where: { slug },
      data: {
        price,
        description:
          typeof description === "string" ? description : plan.description,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Plan update error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
