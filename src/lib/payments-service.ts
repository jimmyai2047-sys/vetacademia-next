import crypto from "crypto";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { isRazorpayLive } from "@/lib/razorpay-config";
import { computeExpiresAt, activeAccessFilter } from "@/lib/plan-validity";
import { logAudit } from "@/lib/audit";

/**
 * Shared payments logic for the web + mobile Razorpay flows.
 * Routes stay thin auth+shape adapters: every response shape and status code
 * they return today is preserved exactly — only the internals moved here.
 */
export class PaymentsServiceError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function razorpayClient(): { keyId: string; keySecret: string } {
  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || !isRazorpayLive()) {
    throw new PaymentsServiceError(400, "Online payments are not configured");
  }
  return { keyId, keySecret };
}

// Shared plan lookup previously duplicated between createPlanOrder and
// src/app/api/purchase/route.ts: find by slug -> 404, unlisted -> 410.
async function getPlanOrThrow(planSlug: string, forbidUnlisted?: boolean) {
  const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
  if (!plan) throw new PaymentsServiceError(404, "Plan not found");
  if (forbidUnlisted && plan.isListed === false) {
    throw new PaymentsServiceError(410, "This plan is no longer on sale");
  }
  return plan;
}

// Shared pending-reuse previously duplicated between createPlanOrder
// (method RAZORPAY) and src/app/api/purchase/route.ts (method TEST):
// reuse the newest PENDING payment for user+plan, else create one at
// plan.price. `created` lets the purchase route preserve its audit-on-create-only
// behaviour and its exact 200-vs-201 shapes.
async function reusePendingPlanPaymentOrCreate(
  userId: string,
  planSlug: string,
  amount: number,
  method: string
) {
  const pending = await prisma.payment.findFirst({
    where: { userId, planSlug, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  if (pending) return { payment: pending, created: false as const };
  const payment = await prisma.payment.create({
    data: {
      userId,
      amount,
      currency: "INR",
      status: "PENDING",
      planSlug,
      method,
    },
  });
  return { payment, created: true as const };
}

export interface PurchaseOrderResult {
  id: string;
  amount: number;
  alreadyPaid: boolean;
}

// Test-mode purchase flow (src/app/api/purchase + checkout-button.tsx):
// plan lookup (always forbids unlisted) -> active PAID reuse -> PENDING reuse
// -> TEST PENDING create + purchase.create audit on create only.
// Distinct from createPlanOrder (RAZORPAY + Razorpay order, no PAID check,
// no audit) — only the plan-lookup/pending-reuse/price internals are shared
// via the helpers above; behaviour is unchanged.
export async function createPurchaseOrder(
  userId: string,
  input: { planSlug?: string; auditActor?: string | null }
): Promise<PurchaseOrderResult> {
  const { planSlug, auditActor } = input;
  if (!planSlug) {
    throw new PaymentsServiceError(400, "planSlug required");
  }
  const plan = await getPlanOrThrow(planSlug, true);

  const existing = await prisma.payment.findFirst({
    where: { userId, planSlug, status: "PAID", ...activeAccessFilter() },
  });
  if (existing) {
    return { id: existing.id, amount: existing.amount, alreadyPaid: true };
  }

  const { payment, created } = await reusePendingPlanPaymentOrCreate(
    userId,
    planSlug,
    plan.price,
    "TEST"
  );
  if (created) {
    logAudit({
      action: "purchase.create",
      actor: auditActor ?? null,
      target: payment.id,
      meta: { planSlug, amount: payment.amount },
    });
  }
  return { id: payment.id, amount: payment.amount, alreadyPaid: false };
}

export interface PlanOrderResult {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export async function createPlanOrder(
  userId: string,
  input: {
    planSlug?: string;
    generatedReportId?: string;
    forbidUnlisted?: boolean;
    planRequiredMessage?: string;
  }
): Promise<PlanOrderResult> {
  const {
    planSlug,
    generatedReportId,
    forbidUnlisted,
    planRequiredMessage = "planSlug or generatedReportId required",
  } = input;
  if (!planSlug && !generatedReportId) {
    throw new PaymentsServiceError(400, planRequiredMessage);
  }
  const { keyId, keySecret } = razorpayClient();

  let amount: number;
  let payment: Awaited<ReturnType<typeof prisma.payment.create>>;

  if (generatedReportId) {
    const gen = await prisma.generatedReport.findFirst({
      where: { id: generatedReportId, userId },
    });
    if (!gen) throw new PaymentsServiceError(404, "Report not found");
    if (gen.status === "PAID") {
      throw new PaymentsServiceError(400, "Report already paid");
    }
    amount = gen.amount;
    payment =
      (await prisma.payment.findFirst({
        where: {
          userId,
          status: "PENDING",
          metadata: { contains: generatedReportId },
        },
        orderBy: { createdAt: "desc" },
      })) ??
      (await prisma.payment.create({
        data: {
          userId,
          amount,
          currency: "INR",
          status: "PENDING",
          method: "RAZORPAY",
          metadata: JSON.stringify({ generatedReportId }),
        },
      }));
  } else {
    const plan = await getPlanOrThrow(planSlug as string, forbidUnlisted);
    amount = plan.price;
    ({ payment } = await reusePendingPlanPaymentOrCreate(
      userId,
      planSlug as string,
      amount,
      "RAZORPAY"
    ));
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  const order = await razorpay.orders.create({
    amount: payment.amount * 100,
    currency: payment.currency,
    receipt: payment.id,
    notes: {
      paymentId: payment.id,
      ...(planSlug ? { planSlug } : {}),
      ...(generatedReportId ? { generatedReportId } : {}),
    },
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { orderId: order.id },
  });

  return {
    paymentId: payment.id,
    orderId: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    keyId,
  };
}

export interface VerifyResult {
  alreadyPaid: boolean;
  status: string;
}

export async function verifyRazorpayPayment(
  userId: string,
  input: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    auditActor?: string;
  }
): Promise<VerifyResult> {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, auditActor } = input;
  const keySecret = env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new PaymentsServiceError(400, "Payments are not configured");
  }
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new PaymentsServiceError(400, "Missing payment details");
  }

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest();
  const provided = Buffer.from(razorpay_signature, "hex");
  const signatureValid =
    expected.length === provided.length &&
    crypto.timingSafeEqual(expected, provided);
  if (!signatureValid) {
    throw new PaymentsServiceError(400, "Invalid payment signature");
  }

  const payment = await prisma.payment.findFirst({
    where: { orderId: razorpay_order_id, userId },
  });
  if (!payment) throw new PaymentsServiceError(404, "Payment not found");

  if (payment.status === "PAID") {
    if (auditActor) {
      logAudit({
        action: "payment.verified",
        actor: auditActor,
        target: payment.id,
        meta: { planSlug: payment.planSlug, alreadyPaid: true },
      });
    }
    return { alreadyPaid: true, status: "PAID" };
  }

  if (isRazorpayLive()) {
    const razorpay = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID!,
      key_secret: keySecret,
    });
    const order = await razorpay.orders.fetch(razorpay_order_id);
    if (Number(order.amount) !== payment.amount * 100) {
      throw new PaymentsServiceError(400, "Amount mismatch");
    }
  }

  const plan = payment.planSlug
    ? await prisma.plan.findUnique({
        where: { slug: payment.planSlug },
        select: { validityDays: true },
      })
    : null;

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "PAID",
      method: "RAZORPAY",
      paymentId: razorpay_payment_id,
      expiresAt: computeExpiresAt(payment.createdAt, plan?.validityDays ?? null),
    },
  });

  if (auditActor) {
    logAudit({
      action: "payment.verified",
      actor: auditActor,
      target: payment.id,
      meta: { planSlug: payment.planSlug, method: "RAZORPAY" },
    });
  }

  return { alreadyPaid: false, status: updated.status };
}
