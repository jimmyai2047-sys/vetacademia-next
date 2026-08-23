import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { verifyToken } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";
import { isRazorpayLive } from "@/lib/razorpay-config";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

export async function POST(req: Request) {
  try {
    const userId = verifyToken(req);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!keySecret)
      return NextResponse.json(
        { error: "Payments are not configured" },
        { status: 400 }
      );

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment details" },
        { status: 400 }
      );
    }

    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest();
    const provided = Buffer.from(razorpay_signature);
    const signatureValid =
      expected.length === provided.length &&
      crypto.timingSafeEqual(expected, provided);

    if (!signatureValid) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findFirst({
      where: { orderId: razorpay_order_id, userId },
    });
    if (!payment)
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );

    if (payment.status === "PAID")
      return NextResponse.json({ success: true, alreadyPaid: true });

    if (isRazorpayLive()) {
      const razorpay = new Razorpay({ key_id: keyId!, key_secret: keySecret });
      const order = await razorpay.orders.fetch(razorpay_order_id);
      if (Number(order.amount) !== payment.amount * 100)
        return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", method: "RAZORPAY", paymentId: razorpay_payment_id },
    });

    return NextResponse.json({ success: true, status: "PAID" });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
