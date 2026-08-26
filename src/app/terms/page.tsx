import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The rules for using VetAcademia, including accounts, content usage, paid services, and disclaimers.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: 18 August 2026</p>

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

      <p className="text-sm text-muted-foreground mt-10">
        Return to the <Link href="/" className="text-primary hover:underline">homepage</Link>.
      </p>
    </div>
  );
}
