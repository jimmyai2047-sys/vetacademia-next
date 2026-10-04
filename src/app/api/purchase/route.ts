import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateCsrf } from "@/lib/csrf";
import {
  createPurchaseOrder,
  PaymentsServiceError,
} from "@/lib/payments-service";

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const slug = body?.planSlug;

    // --- Plan purchase (legacy ProjectReport removed; new GeneratedReport uses /api/payments/create-order + /api/reports/* ) ---
    // Thin adapter: plan lookup / PAID reuse / PENDING reuse / TEST create +
    // audit live in createPurchaseOrder. Shapes + status codes below are
    // unchanged (verified against checkout-button.tsx: data.id, data.amount).
    const result = await createPurchaseOrder(session.user.id, {
      planSlug: slug,
      auditActor: session.user.email ?? null,
    });

    if (result.alreadyPaid) {
      return NextResponse.json({ id: result.id, alreadyPaid: true });
    }

    return NextResponse.json(
      { id: result.id, amount: result.amount },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof PaymentsServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Purchase create error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
