import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const slug = body?.planSlug;
    const reportId = body?.projectReportId;

    if (!slug && !reportId) {
      return NextResponse.json(
        { error: "planSlug or projectReportId required" },
        { status: 400 }
      );
    }

    // --- Project report purchase ---
    if (reportId) {
      const report = await prisma.projectReport.findUnique({
        where: { id: reportId },
      });
      if (!report || !report.published) {
        return NextResponse.json(
          { error: "Project report not found" },
          { status: 404 }
        );
      }

      const existing = await prisma.payment.findFirst({
        where: {
          userId: session.user.id,
          projectReportId: reportId,
          status: "PAID",
        },
      });
      if (existing) {
        return NextResponse.json({ id: existing.id, alreadyPaid: true });
      }

      const pending = await prisma.payment.findFirst({
        where: {
          userId: session.user.id,
          projectReportId: reportId,
          status: "PENDING",
        },
        orderBy: { createdAt: "desc" },
      });
      if (pending) {
        return NextResponse.json(
          { id: pending.id, amount: pending.amount },
          { status: 201 }
        );
      }

      const payment = await prisma.payment.create({
        data: {
          userId: session.user.id,
          amount: report.price,
          currency: "INR",
          status: "PENDING",
          projectReportId: reportId,
          method: "TEST",
        },
      });

      logAudit({
        action: "purchase.create",
        actor: session.user.email,
        target: payment.id,
        meta: { projectReportId: reportId, amount: payment.amount },
      });

      return NextResponse.json(
        { id: payment.id, amount: payment.amount },
        { status: 201 }
      );
    }

    // --- Plan purchase ---
    const plan = await prisma.plan.findUnique({ where: { slug } });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const existing = await prisma.payment.findFirst({
      where: { userId: session.user.id, planSlug: slug, status: "PAID" },
    });
    if (existing) {
      return NextResponse.json({ id: existing.id, alreadyPaid: true });
    }

    // Reuse an existing pending payment for this user+plan instead of
    // creating duplicates (e.g. on double-clicks / abandoned attempts).
    const pending = await prisma.payment.findFirst({
      where: { userId: session.user.id, planSlug: slug, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
    if (pending) {
      return NextResponse.json(
        { id: pending.id, amount: pending.amount },
        { status: 201 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        amount: plan.price,
        currency: "INR",
        status: "PENDING",
        planSlug: slug,
        method: "TEST",
      },
    });

    logAudit({
      action: "purchase.create",
      actor: session.user.email,
      target: payment.id,
      meta: { planSlug: slug, amount: payment.amount },
    });

    return NextResponse.json(
      { id: payment.id, amount: payment.amount },
      { status: 201 }
    );
  } catch (error) {
    console.error("Purchase create error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
