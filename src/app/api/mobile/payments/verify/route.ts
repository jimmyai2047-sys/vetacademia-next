import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/mobileAuth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { verifyRazorpayPayment, PaymentsServiceError } from "@/lib/payments-service";

export async function POST(req: Request) {
  try {
    const userId = verifyToken(req);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const rl = await rateLimit(`mobile-pay:${clientIp(req)}`, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await req.json();

    const result = await verifyRazorpayPayment(userId, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (result.alreadyPaid)
      return NextResponse.json({ success: true, alreadyPaid: true });

    return NextResponse.json({ success: true, status: result.status });
  } catch (error) {
    if (error instanceof PaymentsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
