import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { isRazorpayLive } from "@/lib/razorpay-config";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

export async function POST(req: Request) {
  try {
    const rl = rateLimit(`pay-order:${clientIp(req)}`, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isRazorpayLive()) {
      return NextResponse.json(
        { error: "Online payments are not configured" },
        { status: 400 }
      );
    }

    const { planSlug } = await req.json();
    if (!planSlug) {
      return NextResponse.json({ error: "planSlug required" }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Reuse an existing pending payment for this user+plan if one exists.
    let payment = await prisma.payment.findFirst({
      where: { userId: session.user.id, planSlug, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          userId: session.user.id,
          amount: plan.price,
          currency: "INR",
          status: "PENDING",
          planSlug,
          method: "RAZORPAY",
        },
      });
    }

    const razorpay = new Razorpay({ key_id: keyId!, key_secret: keySecret! });
    const order = await razorpay.orders.create({
      amount: payment.amount * 100,
      currency: payment.currency,
      receipt: payment.id,
      notes: { planSlug, paymentId: payment.id },
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { orderId: order.id },
    });

    return NextResponse.json({
      paymentId: payment.id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (error) {
    console.error("Razorpay order error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
