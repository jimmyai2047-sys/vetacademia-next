import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CheckoutButton from "@/components/checkout-button";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import { activeAccessFilter, formatValidity } from "@/lib/plan-validity";
import { ArrowLeft, ShieldCheck, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan: slug } = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(
      `/login?redirect=${encodeURIComponent(
        slug ? `/checkout?plan=${slug}` : "/checkout"
      )}`
    );
  }
  if (!slug) notFound();

  // Legacy static ProjectReport checkout removed — new GeneratedReport lives at /farmers/project-report

  // --- Plan checkout ---
  const plan = await prisma.plan.findUnique({ where: { slug } });
  if (!plan || plan.isListed === false) notFound();

  const existing = await prisma.payment.findFirst({
    where: { userId: session.user.id, planSlug: slug, status: "PAID", ...activeAccessFilter() },
  });

  return (
    <div className="flex flex-col">
      <div className="container mx-auto px-4 pt-8 md:pt-12 max-w-lg">
        <DecorativePageHeader
          badge="Secure Checkout"
          title="Complete"
          titleHighlight="Enrollment"
          description="You are enrolling in the plan below — one-time payment, instant unlock."
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

      <div className="container mx-auto px-4 max-w-lg">
        <div className="va-divider-dots my-6"><span /></div>
      </div>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-primary/[0.015] to-white pointer-events-none" />
        <div className="container relative mx-auto px-4 pb-10 max-w-lg">
      <Link
        href="/pricing"
        className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Plans
      </Link>

      <Card className="va-card-hover relative overflow-hidden rounded-[1.5rem] border border-primary/10 bg-white shadow-xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-70" />
        <CardHeader className="relative">
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
          <CardTitle className="tracking-tight">Complete Enrollment</CardTitle>
          <CardDescription>
            You are enrolling in the plan below.
          </CardDescription>
          <div className="mt-2 h-0.5 w-10 rounded-full bg-gradient-to-r from-primary to-[#d4a843]" />
        </CardHeader>
        <CardContent className="space-y-6 relative">
          <div className="flex items-center justify-between p-4 rounded-[1.25rem] border border-primary/10 bg-gradient-to-br from-primary/[0.04] via-white to-blue-50/30">
            <div>
              <div className="font-semibold">{plan.name}</div>
              <div className="text-sm text-muted-foreground">
                {plan.type === "COURSE" ? "Programme" : "Exam Preparation"}
                {" • "}
                {formatValidity(plan.validityDays)}
              </div>
            </div>
            <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-primary/15">
              Rs.{plan.price.toLocaleString("en-IN")}
            </Badge>
          </div>

          {existing ? (
            <p className="text-sm text-emerald-600 font-medium text-center rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
              You are already enrolled in this plan.
            </p>
          ) : (
            <CheckoutButton
              planSlug={plan.slug}
              amount={plan.price}
              alreadyEnrolled={false}
            />
          )}

          <div className="h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
          <p className="text-xs text-muted-foreground text-center">
            By enrolling you agree to the{" "}
            <Link href="/terms" className="underline hover:text-primary">terms of use</Link>
            {" "}and{" "}
            <Link href="/refund-policy" className="underline hover:text-primary">refund policy</Link>.
            Enrollment is per account and grants full access to the plan&apos;s content.
          </p>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
}
