import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment || payment.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (payment.status === "PAID") {
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }

    // TEST MODE: mark the payment as paid directly.
    // When Razorpay goes live, replace this block with signature verification
    // of the Razorpay payment (razorpay_order_id / razorpay_payment_id /
    // razorpay_signature) and set orderId + paymentId accordingly.
    const updated = await prisma.payment.update({
      where: { id },
      data: {
        status: "PAID",
        method: "TEST",
        paymentId: `test_${Date.now()}`,
      },
    });

    return NextResponse.json({ ok: true, status: updated.status });
  } catch (error) {
    console.error("Purchase pay error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
