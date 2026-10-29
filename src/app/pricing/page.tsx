export const metadata = {
  title: "VetAcademia | Pricing",
  description: "Affordable subscription plans for veterinary students, farmers, and exam aspirants on VetAcademia.",
  alternates: { canonical: "https://www.vetacademia.in/pricing" },
};

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccess } from "@/lib/access";
import { reconcilePendingPayments } from "@/lib/payments-service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Wallet, ShieldCheck, ListFilter } from "lucide-react";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import PricingExplorer from "./pricing-explorer";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; success?: string }>;
}) {
  const { plan: highlight, success } = await searchParams;

  // Post-payment landing (/pricing?success=1): reconcile any order Razorpay
  // captured but the webhook missed BEFORE access is computed, so a stuck
  // PENDING flips to PAID and the page shows the enrolment immediately.
  if (success === "1") {
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) await reconcilePendingPayments(session.user.id);
    } catch {
      // best-effort: never block the success page on a reconcile failure
    }
  }

  let plans: {
    slug: string;
    name: string;
    type: string;
    description: string | null;
    price: number;
    validityDays: number | null;
    programmeSlug: string | null;
    examSlug: string | null;
    year: string | null;
    subjectId: string | null;
    sortOrder: number;
  }[] = [];
  let access: Awaited<ReturnType<typeof getAccess>> = {
    userId: null,
    isAuthed: false,
    isAdmin: false,
    planSlugs: new Set<string>(),
    programmeSlugs: new Set<string>(),
    examKeys: new Set<string>(),
    examPlanOwned: false,
    ownedYearScopes: new Set<string>(),
    ownedSubjectIds: new Set<string>(),
  };
  let subjects: { id: string; name: string }[] = [];
  try {
    [plans, access, subjects] = await Promise.all([
      prisma.plan.findMany({
        orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
        where: { isListed: true },
        select: {
          slug: true,
          name: true,
          type: true,
          description: true,
          price: true,
          validityDays: true,
          programmeSlug: true,
          examSlug: true,
          year: true,
          subjectId: true,
          sortOrder: true,
        },
      }),
      getAccess(),
      prisma.subject.findMany({ select: { id: true, name: true } }),
    ]);
  } catch {
    plans = [];
    subjects = [];
  }

  // SEO/payload: cards visually line-clamp descriptions to 2 lines, so ship
  // only a snippet — full rich text × hundreds of subject plans bloats HTML.
  plans = plans.map((p) => ({
    ...p,
    description: p.description ? p.description.slice(0, 160) : p.description,
  }));

  const subjectNames: Record<string, string> = Object.fromEntries(
    subjects.map((s) => [s.id, s.name])
  );

  return (
    <div className="flex flex-col">
      <Breadcrumb />
      {/* Decorative Header */}
      <div className="container mx-auto px-4 pt-8 md:pt-12">
        <DecorativePageHeader
          badge="Affordable • One-Time • Lifetime Access"
          title="Plans &"
          titleHighlight="Pricing"
          description="Pick your programme, then the year, subject and validity you actually need — we show only the plans that apply. Clear pricing, serious value."
          variant="primary"
          actions={
            <>
              <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5 px-3 py-1.5">
                <Wallet className="h-3.5 w-3.5" /> One-time payment
              </Badge>
              <Badge className="rounded-full bg-white text-primary border-0 px-3 py-1.5 gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Secure checkout
              </Badge>
            </>
          }
        />
      </div>

      {success === "1" && (
        <div className="container mx-auto px-4 mt-6">
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
            <Check className="h-5 w-5 mt-0.5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold">Payment successful — you&rsquo;re enrolled!</p>
              <p className="text-emerald-700">
                Your content is unlocked on your account right away. Head to your
                dashboard to start studying.
              </p>
              <Link
                href="/dashboard"
                className="mt-2 inline-flex items-center gap-1 font-medium text-emerald-700 underline underline-offset-2"
              >
                Go to dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 mt-6">
        <div className="va-divider-dots"><span /></div>
      </div>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-primary/[0.02] to-white pointer-events-none" />
        <div className="absolute inset-0 va-pattern-grid opacity-[0.02] pointer-events-none" />
        <div className="container relative mx-auto px-4 py-8">
          <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-primary/10 bg-white px-4 py-3 shadow-sm max-w-3xl">
            <ListFilter className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Three steps:</span>{" "}
              choose your programme, choose the year or subject, then the validity.
              Only the matching plans are listed — no endless wall of options.
            </p>
          </div>

          {plans.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No plans available yet. Please check back soon.
              </CardContent>
            </Card>
          ) : (
            <PricingExplorer
              plans={plans}
              subjectNames={subjectNames}
              enrolled={[...access.planSlugs]}
              ownedProgrammes={[...access.programmeSlugs]}
              ownedYears={[...access.ownedYearScopes]}
              ownedSubjects={[...access.ownedSubjectIds]}
              ownedExamKeys={[...access.examKeys]}
              highlight={highlight ?? null}
            />
          )}

          <div className="mt-12 flex flex-col items-center gap-3">
            <div className="va-divider-dots w-full max-w-[200px]"><span /></div>
            <div className="flex items-start gap-2 justify-center text-sm text-muted-foreground bg-white border border-primary/10 rounded-2xl px-5 py-3 shadow-sm max-w-2xl">
              <Check className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" />
              <p className="text-center">
                Secure one-time payment. After enrollment the content is unlocked on your account immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
