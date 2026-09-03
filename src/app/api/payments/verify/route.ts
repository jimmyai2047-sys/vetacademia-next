import { NextResponse, NextRequest } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";
import { logAudit } from "@/lib/audit";
import { isRazorpayLive } from "@/lib/razorpay-config";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    const rl = rateLimit(`pay-verify:${clientIp(req)}`, 20, 60_000);
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
    if (!keySecret) {
      return NextResponse.json(
        { error: "Payments are not configured" },
        { status: 400 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment details" },
        { status: 400 }
      );
    }

    // Verify the Razorpay signature (timing-safe, hex-encoded).
    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest();
    const provided = Buffer.from(razorpay_signature, "hex");
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
      where: { orderId: razorpay_order_id, userId: session.user.id },
    });
    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Idempotent: already marked paid -> succeed without double-processing.
    if (payment.status === "PAID") {
      logAudit({
        action: "payment.verified",
        actor: session.user.email,
        target: payment.id,
        meta: { planSlug: payment.planSlug, alreadyPaid: true },
      });
      return NextResponse.json({ success: true, alreadyPaid: true });
    }

    // Confirm the captured amount matches our stored amount.
    if (isRazorpayLive()) {
      const razorpay = new Razorpay({ key_id: keyId!, key_secret: keySecret });
      const order = await razorpay.orders.fetch(razorpay_order_id);
      if (Number(order.amount) !== payment.amount * 100) {
        return NextResponse.json(
          { error: "Amount mismatch" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        method: "RAZORPAY",
        paymentId: razorpay_payment_id,
      },
    });

    logAudit({
      action: "payment.verified",
      actor: session.user.email,
      target: payment.id,
      meta: { planSlug: payment.planSlug, method: "RAZORPAY" },
    });

    return NextResponse.json({ success: true, status: updated.status });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
