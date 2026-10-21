import { NextResponse, NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { validateCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const items = await prisma.testimonial.findMany({
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Testimonials list error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const exam = typeof body.exam === "string" ? body.exam.trim() : "";
    const quote = typeof body.quote === "string" ? body.quote.trim() : "";
    if (!name || !exam || !quote) {
      return NextResponse.json({ error: "Name, exam and quote are required" }, { status: 400 });
    }
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
    const rating =
      typeof body.rating === "number" && body.rating >= 0 && body.rating <= 5 ? body.rating : 5.0;
    const reviewedBy = str(body.reviewedBy);
    const item = await prisma.testimonial.create({
      data: {
        name,
        exam,
        quote,
        programme: str(body.programme),
        rating,
        intakeYear:
          typeof body.intakeYear === "number" && body.intakeYear > 1900 ? Math.floor(body.intakeYear) : null,
        isApproved: body.isApproved !== false,
        owner: str(body.owner),
        reviewedBy,
        reviewedAt: reviewedBy ? new Date() : null,
        sourceUrl: str(body.sourceUrl),
      },
    });
    logAudit({
      action: "testimonial.create",
      actor: session.user.id,
      target: item.id,
      meta: { name, exam, approved: item.isApproved },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Testimonial create error:", error);
    return NextResponse.json({ error: "Failed to create testimonial" }, { status: 500 });
  }
}
