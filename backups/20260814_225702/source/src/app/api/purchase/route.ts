import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const slug = body?.planSlug;
    if (!slug) {
      return NextResponse.json({ error: "planSlug required" }, { status: 400 });
    }

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

    return NextResponse.json(
      { id: payment.id, amount: payment.amount },
      { status: 201 }
    );
  } catch (error) {
    console.error("Purchase create error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
