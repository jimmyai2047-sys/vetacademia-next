import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAccess } from "@/lib/access";
import { getExamKeysForPlan } from "@/lib/plans";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, GraduationCap, Award, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

function contentLinkForPlan(plan: {
  type: string;
  programmeSlug?: string | null;
  examSlug?: string | null;
}): string {
  if (plan.type === "COURSE" && plan.programmeSlug) {
    return `/syllabus/${plan.programmeSlug}`;
  }
  if (plan.type === "EXAM" && plan.examSlug) {
    const key = getExamKeysForPlan(plan.examSlug)[0];
    if (key) return `/examinations/${key}`;
  }
  return "/";
}

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan: highlight } = await searchParams;
  const [plans, access] = await Promise.all([
    prisma.plan.findMany({ orderBy: { sortOrder: "asc" } }),
    getAccess(),
  ]);

  const courses = plans.filter(
    (p) => p.type === "COURSE" && !p.year && !p.subjectId
  );
  const exams = plans.filter((p) => p.type === "EXAM");

  const renderPlan = (plan: (typeof plans)[number]) => {
    const enrolled = access.planSlugs.has(plan.slug);
    const isHighlight = highlight === plan.slug;
    return (
      <Card
        key={plan.slug}
        className={`flex flex-col ${isHighlight ? "ring-2 ring-primary" : ""}`}
      >
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg">{plan.name}</CardTitle>
            {enrolled && (
              <Badge className="bg-emerald-600 hover:bg-emerald-600">
                Enrolled
              </Badge>
            )}
          </div>
          <CardDescription>{plan.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 gap-4">
          <div className="text-3xl font-bold">
            Rs.{plan.price.toLocaleString("en-IN")}
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              / one-time
            </span>
          </div>
          {enrolled ? (
            <Link
              href={contentLinkForPlan(plan)}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              Go to Content <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href={`/checkout?plan=${encodeURIComponent(plan.slug)}`}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Enroll Now <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">Plans &amp; Pricing</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Choose a programme or exam preparation track and unlock the complete
          study material, previous year papers, mock tests and resources.
        </p>
      </div>

      <section className="mb-12">
        <div className="flex items-center gap-2 mb-5">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">Programmes</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {courses.map(renderPlan)}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-5">
          <Award className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">Exam Preparation</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams.map(renderPlan)}
        </div>
      </section>

      <div className="mt-12 flex items-start gap-2 justify-center text-sm text-muted-foreground">
        <Check className="h-4 w-4 mt-0.5 text-emerald-600" />
        <p>
          Secure one-time payment. After enrollment the content is unlocked on
          your account immediately. (Test payments are enabled until Razorpay goes
          live.)
        </p>
      </div>
    </div>
  );
}
