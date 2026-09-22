import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import { ScrollText, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The rules for using VetAcademia, including accounts, content usage, paid services, and disclaimers.",
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

export default function TermsPage() {
  return (
    <div className="flex flex-col">
      <div className="container mx-auto px-4 pt-8 max-w-3xl">
        <DecorativePageHeader
          badge="Legal • Terms of Service"
          title="Terms of"
          titleHighlight="Service"
          description="The rules for using VetAcademia, including accounts, content usage, paid services, and disclaimers."
          variant="primary"
          actions={
            <>
              <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5 px-3 py-1.5">
                <ScrollText className="h-3.5 w-3.5" /> Last updated: 18 August 2026
              </Badge>
              <Badge className="rounded-full bg-white text-primary border-0 px-3 py-1.5 gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Fair use
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

      <Section title="1. Acceptance of Terms">
        <p>
          By accessing or using VetAcademia, you agree to these Terms. If you do not agree, please do
          not use the platform.
        </p>
      </Section>

      <Section title="2. Your Account">
        <p>
          You are responsible for keeping your login credentials confidential and for all activity
          under your account. Provide accurate information, and notify us of any unauthorised use.
        </p>
      </Section>

      <Section title="3. Use of Content">
        <p>
          Study materials, mock tests, and other content on VetAcademia are provided for your
          personal learning. You may not resell, redistribute, copy, or publicly share paid content
          without permission. All content remains the property of VetAcademia or its licensors.
        </p>
      </Section>

      <Section title="4. Paid Services & Subscriptions">
        <p>
          Some content and features require a paid subscription processed through Razorpay. Subscription
          details, pricing, and validity are shown on the{" "}
          <Link href="/pricing" className="text-primary hover:underline">Pricing</Link> page. Until
          Razorpay KYC is complete, payments run in test mode and orders are marked paid for
          demonstration only. Refund eligibility follows the policy stated at the time of purchase.
        </p>
      </Section>

      <Section title="5. Free Sample Content">
        <p>
          A limited portion of content (such as demo chapters and sample tests) is available free of
          charge as a preview. Full access requires an active subscription.
        </p>
      </Section>

      <Section title="6. Community & User Content">
        <p>
          If you post in community areas, you are responsible for your content. Do not post unlawful,
          offensive, or infringing material. We may remove content that violates these Terms.
        </p>
      </Section>

      <Section title="7. Prohibited Conduct">
        <ul className="list-disc pl-5 space-y-1">
          <li>Sharing account credentials or enabling unauthorized access.</li>
          <li>Attempting to disrupt, scrape, or reverse-engineer the platform.</li>
          <li>Using the service for any unlawful purpose.</li>
        </ul>
      </Section>

      <Section title="8. Educational Disclaimer">
        <p>
          VetAcademia provides educational material for veterinary and animal-husbandry study. It is
          not a substitute for professional veterinary, medical, or clinical advice. Always consult a
          qualified professional for diagnosis or treatment.
        </p>
      </Section>

      <Section title="9. Limitation of Liability">
        <p>
          VetAcademia is provided &ldquo;as is&rdquo; without warranties. To the fullest extent
          permitted by law, we are not liable for any indirect or consequential loss arising from use
          of the platform.
        </p>
      </Section>

      <Section title="10. Termination">
        <p>
          We may suspend or terminate accounts that violate these Terms. You may stop using the service
          at any time.
        </p>
      </Section>

      <Section title="11. Governing Law">
        <p>
          These Terms are governed by the laws of India. Any disputes are subject to the jurisdiction
          of the courts of India.
        </p>
      </Section>

      <Section title="12. Contact">
        <p>
          Questions about these Terms? Email{" "}
          <a href="mailto:contact@vetacademia.in" className="text-primary hover:underline">
            contact@vetacademia.in
          </a>
          .
        </p>
      </Section>

      <p className="text-sm text-muted-foreground mt-10 text-center">
        Return to the <Link href="/" className="text-primary hover:underline">homepage</Link>.
      </p>
        </div>
      </div>
    </div>
  );
}
