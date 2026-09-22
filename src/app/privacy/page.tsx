import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import { Lock, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How VetAcademia collects, uses, protects, and shares your information, and your rights over your data.",
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

export default function PrivacyPage() {
  return (
    <div className="flex flex-col">
      <div className="container mx-auto px-4 pt-8 max-w-3xl">
        <DecorativePageHeader
          badge="Legal • Privacy Policy"
          title="Privacy"
          titleHighlight="Policy"
          description="How VetAcademia collects, uses, protects, and shares your information, and your rights over your data."
          variant="primary"
          actions={
            <>
              <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5 px-3 py-1.5">
                <Lock className="h-3.5 w-3.5" /> Last updated: 18 August 2026
              </Badge>
              <Badge className="rounded-full bg-white text-primary border-0 px-3 py-1.5 gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Your data stays yours
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

      <Section title="1. Information We Collect">
        <p>
          When you create an account or use VetAcademia, we collect the following:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Account information:</strong> name, email address, phone number, and role (student, professional, or admin).</li>
          <li><strong>Learning activity:</strong> test scores, progress, bookmarks, and the chapters or materials you access.</li>
          <li><strong>Content you provide:</strong> notes, posts, questions, and files you upload to the platform.</li>
          <li><strong>Payment information:</strong> handled by our payment partner Razorpay. We do not store your card or bank details.</li>
          <li><strong>Device & usage data:</strong> browser type, device, pages visited, and basic analytics cookies.</li>
        </ul>
      </Section>

      <Section title="2. How We Use Your Information">
        <ul className="list-disc pl-5 space-y-1">
          <li>To provide and personalise your learning experience (e.g., progress tracking and recommendations).</li>
          <li>To process subscriptions and confirm access to paid content.</li>
          <li>To communicate with you about your account, updates, and support.</li>
          <li>To improve our content, features, and platform security.</li>
        </ul>
      </Section>

      <Section title="3. Payments">
        <p>
          All payments are processed securely by <strong>Razorpay</strong>. VetAcademia never
          receives or stores your full card or banking details. Razorpay&apos;s own privacy policy
          governs payment data. Until Razorpay KYC is completed, the platform operates in test mode
          and paid orders are marked as paid for demonstration purposes only.
        </p>
      </Section>

      <Section title="4. Cookies & Tracking">
        <p>
          We use essential cookies to keep you signed in and analytics cookies to understand how the
          site is used. You can disable non-essential cookies in your browser; some features may not
          work as expected.
        </p>
      </Section>

      <Section title="5. Data Sharing">
        <p>
          We do <strong>not sell</strong> your personal data. We share it only with trusted service
          providers necessary to run the platform, including our database host (Neon), hosting
          (Vercel), file storage (Vercel Blob), and payment processor (Razorpay). We may disclose
          data if required by Indian law or to protect the safety and rights of our users.
        </p>
      </Section>

      <Section title="6. Data Security">
        <p>
          We use standard security measures including encryption in transit (HTTPS). No online service
          can be guaranteed 100% secure, but we work to protect your information and review our
          practices regularly.
        </p>
      </Section>

      <Section title="7. Your Rights">
        <p>
          You may request access to, correction of, or deletion of your personal data at any time by
          emailing us. You can also delete your account from your profile settings.
        </p>
      </Section>

      <Section title="8. Children">
        <p>
          VetAcademia is intended for users aged 13 and above. We do not knowingly collect data from
          children under 13.
        </p>
      </Section>

      <Section title="9. Changes to This Policy">
        <p>
          We may update this policy from time to time. Material changes will be announced on the
          site. Continued use after changes means you accept the updated policy.
        </p>
      </Section>

      <Section title="10. Contact">
        <p>
          Questions about this policy? Email us at{" "}
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
