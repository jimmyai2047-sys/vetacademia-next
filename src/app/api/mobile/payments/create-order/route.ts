import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/mobileAuth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { createPlanOrder, PaymentsServiceError } from "@/lib/payments-service";

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

    const { planSlug } = await req.json();
    const result = await createPlanOrder(userId, {
      planSlug,
      forbidUnlisted: true,
      planRequiredMessage: "planSlug required",
    });

    return NextResponse.json({
      paymentId: result.paymentId,
      orderId: result.orderId,
      amount: result.amount,
      currency: result.currency,
      keyId: result.keyId,
    });
  } catch (error) {
    if (error instanceof PaymentsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Razorpay order error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
