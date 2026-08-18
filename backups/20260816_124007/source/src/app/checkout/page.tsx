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

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; report?: string }>;
}) {
  const { plan: slug, report: reportId } = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(
      `/login?redirect=${encodeURIComponent(
        slug
          ? `/checkout?plan=${slug}`
          : reportId
          ? `/checkout?report=${reportId}`
          : "/checkout"
      )}`
    );
  }
  if (!slug && !reportId) notFound();

  // --- Project report checkout ---
  if (reportId) {
    const report = await prisma.projectReport.findUnique({
      where: { id: reportId },
    });
    if (!report || !report.published) notFound();

    const existing = await prisma.payment.findFirst({
      where: {
        userId: session.user.id,
        projectReportId: reportId,
        status: "PAID",
      },
    });

    return (
      <div className="container mx-auto px-4 py-10 max-w-lg">
        <Link
          href="/farmers"
          className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-6"
        >
          &larr; Back to Farmers
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Unlock Project Report</CardTitle>
            <CardDescription>
              You are purchasing the report below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/40">
              <div>
                <div className="font-semibold">{report.title}</div>
                <div className="text-sm text-muted-foreground">
                  Project Report
                </div>
              </div>
              <Badge variant="secondary">
                Rs.{report.price.toLocaleString("en-IN")}
              </Badge>
            </div>

            {existing ? (
              <p className="text-sm text-emerald-600 font-medium text-center">
                You have already unlocked this report.
              </p>
            ) : (
              <CheckoutButton
                reportId={report.id}
                amount={report.price}
                alreadyUnlocked={false}
              />
            )}

            <p className="text-xs text-muted-foreground text-center">
              By purchasing you agree to the terms of use. The full report
              unlocks on your account immediately.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Plan checkout ---
  const plan = await prisma.plan.findUnique({ where: { slug } });
  if (!plan) notFound();

  const existing = await prisma.payment.findFirst({
    where: { userId: session.user.id, planSlug: slug, status: "PAID" },
  });

  return (
    <div className="container mx-auto px-4 py-10 max-w-lg">
      <Link
        href="/pricing"
        className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-6"
      >
        &larr; Back to Plans
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Complete Enrollment</CardTitle>
          <CardDescription>
            You are enrolling in the plan below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/40">
            <div>
              <div className="font-semibold">{plan.name}</div>
              <div className="text-sm text-muted-foreground">
                {plan.type === "COURSE" ? "Programme" : "Exam Preparation"}
              </div>
            </div>
            <Badge variant="secondary">
              Rs.{plan.price.toLocaleString("en-IN")}
            </Badge>
          </div>

          {existing ? (
            <p className="text-sm text-emerald-600 font-medium text-center">
              You are already enrolled in this plan.
            </p>
          ) : (
            <CheckoutButton
              planSlug={plan.slug}
              amount={plan.price}
              alreadyEnrolled={false}
            />
          )}

          <p className="text-xs text-muted-foreground text-center">
            By enrolling you agree to the terms of use. Enrollment is per account
            and grants full access to the plan&apos;s content.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
