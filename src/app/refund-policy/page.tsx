import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import { ReceiptText, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "VetAcademia refund and cancellation policy for course enrollments, failed payments, and technical issues.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="va-card-hover group relative overflow-hidden rounded-[1.5rem] border border-primary/5 bg-white shadow-sm hover:shadow-lg mb-4">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-1 tracking-tight">{title}</h2>
        <div className="h-0.5 w-10 rounded-full bg-gradient-to-r from-primary to-[#d4a843] mb-3" />
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
      </div>
    </section>
  );
}

export default function RefundPolicyPage() {
  return (
    <div className="flex flex-col">
      <div className="container mx-auto px-4 pt-8 md:pt-12 max-w-3xl">
        <DecorativePageHeader
          badge="Legal • Refunds & Cancellations"
          title="Refund &"
          titleHighlight="Cancellation Policy"
          description="Fair rules for course enrollments, failed payments, and technical issues."
          variant="primary"
          actions={
            <>
              <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5 px-3 py-1.5">
                <ReceiptText className="h-3.5 w-3.5" /> Last updated: 21 September 2026
              </Badge>
              <Badge className="rounded-full bg-white text-primary border-0 px-3 py-1.5 gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Fair & transparent
              </Badge>
            </>
          }
        />
      </div>

      <div className="container mx-auto px-4 max-w-3xl">
        <div className="va-divider-dots my-6"><span /></div>
      </div>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-primary/[0.015] to-white pointer-events-none" />
        <div className="absolute inset-0 va-pattern-grid opacity-[0.02] pointer-events-none" />
        <div className="container relative mx-auto px-4 pb-12 max-w-3xl">

      <Section title="1. Digital courses — 7-day review window">
        <p>
          All VetAcademia plans are digital products with instant access. Enrollments are
          non-refundable once activated, except as described below. If you face a genuine
          technical issue (content not unlocking, payment captured but no access), contact
          us within <strong>7 days of payment</strong> from the{" "}
          <Link href="/contact" className="underline">Contact page</Link> with your payment
          ID — we will fix access on priority, or refund if the issue is on our side.
        </p>
      </Section>

      <Section title="2. Failed payments auto-refund">
        <p>
          If money was deducted but the payment failed (no enrollment unlocked), you do not
          need to ask — banks and UPI apps return such amounts automatically, usually within{" "}
          <strong>5–7 working days</strong> to the source account. If it takes longer, send us
          the UTR/transaction reference from the{" "}
          <Link href="/contact" className="underline">Contact page</Link> and we will help
          trace it with Razorpay.
        </p>
      </Section>

      <Section title="3. Duplicate or accidental payments">
        <p>
          Paid twice by mistake, or enrolled in the wrong plan? Write to us within{" "}
          <strong>7 days</strong> with both payment IDs. Confirmed duplicate charges are
          refunded in full to the source account. Wrong-plan cases are resolved by moving
          your enrollment to the correct plan, or a refund of the difference.
        </p>
      </Section>

      <Section title="4. How to request a review">
        <p>
          Send: (1) your registered email/phone, (2) payment ID (starts with{" "}
          <code>pay_</code>), (3) plan name, (4) what went wrong. We respond within{" "}
          <strong>2 working days</strong>. Eligible refunds are processed to the original
          payment method within 5–7 working days of approval.
        </p>
      </Section>

      <Section title="5. Chargebacks — talk to us first">
        <p>
          Please contact us before raising a bank chargeback or dispute — most cases are
          resolved faster (and with less paperwork for you) through support. Chargebacks
          raised without contacting us may lead to temporary suspension of the account
          while the bank investigates, as required by payment-network rules.
        </p>
      </Section>

      <Section title="6. Jurisdiction">
        <p>
          This policy is governed by the laws of India. Disputes are subject to the
          jurisdiction of the courts at the location of VetAcademia&apos;s registered
          business, after good-faith resolution attempts through support.
        </p>
      </Section>

        </div>
      </div>
    </div>
  );
}
