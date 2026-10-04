import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";
import { verifyRazorpayPayment, PaymentsServiceError } from "@/lib/payments-service";

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    const rl = await rateLimit(`pay-verify:${clientIp(req)}`, 20, 60_000);
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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await req.json();

    const result = await verifyRazorpayPayment(session.user.id, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      auditActor: session.user.email ?? undefined,
    });

    if (result.alreadyPaid) {
      return NextResponse.json({ success: true, alreadyPaid: true });
    }
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
