import crypto from "crypto";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { isRazorpayLive } from "@/lib/razorpay-config";
import { computeExpiresAt } from "@/lib/plan-validity";
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
    const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
    if (!plan) throw new PaymentsServiceError(404, "Plan not found");
    if (forbidUnlisted && plan.isListed === false) {
      throw new PaymentsServiceError(410, "This plan is no longer on sale");
    }
    amount = plan.price;
    payment =
      (await prisma.payment.findFirst({
        where: { userId, planSlug, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      })) ??
      (await prisma.payment.create({
        data: {
          userId,
          amount,
          currency: "INR",
          status: "PENDING",
          planSlug,
          method: "RAZORPAY",
        },
      }));
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
