import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Razorpay webhook. Configure this URL in the Razorpay dashboard and set
 * RAZORPAY_WEBHOOK_SECRET (a DIFFERENT secret from RAZORPAY_KEY_SECRET).
 * Razorpay signs the raw request body with an HMAC-SHA256 of the webhook
 * secret; we verify it before trusting the event. This lets payments that
 * were captured (or failed) server-side be reconciled even if the client
 * never calls /api/payments/verify.
 */
export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] RAZORPAY_WEBHOOK_SECRET not set - refusing to process");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  const expected = crypto
    .createHmac("sha256", secret)
    .update(raw)
    .digest("hex");
  const provided = Buffer.from(signature, "hex");
  const valid =
    expected.length === provided.length &&
    crypto.timingSafeEqual(Buffer.from(expected, "hex"), provided);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const entity = event?.payload?.payment?.entity || event?.payload?.order?.entity;
    const eventName: string = event?.event || "";
    if (!entity || !entity.order_id) {
      return NextResponse.json({ received: true });
    }

    const orderId: string = entity.order_id;
    const payment = await prisma.payment.findFirst({ where: { orderId } });
    if (!payment) return NextResponse.json({ received: true });

    if (eventName === "payment.captured" || eventName === "order.paid") {
      if (payment.status !== "PAID") {
        const amountPaise = entity.amount;
        if (
          typeof amountPaise === "number" &&
          amountPaise !== payment.amount * 100
        ) {
          console.error("[webhook] amount mismatch", {
            orderId,
            amountPaise,
            expected: payment.amount * 100,
          });
          return NextResponse.json({ received: true });
        }
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "PAID",
            method: "RAZORPAY",
            paymentId: entity.id ?? payment.paymentId,
          },
        });
      }
    } else if (eventName === "payment.failed") {
      if (payment.status === "PENDING") {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        });
      }
    }
  } catch (err) {
    console.error("[webhook] processing error:", err);
  }

  // Razorpay expects a 2xx to stop retrying.
  return NextResponse.json({ received: true });
}
