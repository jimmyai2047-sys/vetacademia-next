import { NextResponse, NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { validateCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { parseValidityDays } from "@/lib/plan-validity";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const { slug } = await params;
    const body = await req.json().catch(() => ({}));
    const price = body?.price;
    const description = body?.description;
    const validityDays = body?.validityDays;

    if (typeof price !== "number" || price < 0) {
      return NextResponse.json(
        { error: "Valid price (number >= 0) is required" },
        { status: 400 }
      );
    }

    let validity: number | null | undefined;
    if (validityDays !== undefined) {
      const parsed = parseValidityDays(validityDays);
      if (parsed.error) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      validity = parsed.value;
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
        ...(validity !== undefined ? { validityDays: validity } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Plan update error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
