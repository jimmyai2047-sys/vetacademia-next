export const metadata = {
  title: "VetAcademia | Pricing",
  description: "Affordable subscription plans for veterinary students, farmers, and exam aspirants on VetAcademia.",
};

import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getAccess } from "@/lib/access";
import { getExamKeysForPlan } from "@/lib/plans";
import { getProgrammeImage, getExamImage, getSubjectImage, getProgrammeYearImage } from "@/lib/subject-images";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, GraduationCap, Award, ArrowRight, Layers, Sparkles, Wallet, ShieldCheck } from "lucide-react";
import { DecorativePageHeader } from "@/components/decorative/page-header";

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
  const [plans, access, subjects] = await Promise.all([
    prisma.plan.findMany({ orderBy: { sortOrder: "asc" } }),
    getAccess(),
    prisma.subject.findMany({ select: { id: true, name: true } }),
  ]);

  const allSubjectNames = new Set(subjects.map((s) => s.name));

  function resolveSubjectImage(planName: string): string {
    if (allSubjectNames.has(planName)) return getSubjectImage(planName);
    for (const name of allSubjectNames) {
      if (planName.includes(name) || name.includes(planName)) return getSubjectImage(name);
    }
    return "";
  }

  const fullCoursePlans = plans.filter(
    (p) => p.type === "COURSE" && !p.subjectId && !p.year
  );
  const yearPlans = plans.filter((p) => p.type === "COURSE" && !!p.year && !p.subjectId);
  const subjectPlans = plans.filter((p) => p.type === "COURSE" && !!p.subjectId);
  const exams = plans.filter((p) => p.type === "EXAM");

  const PROG_LABEL: Record<string, string> = {
    ahdp: "AHDP",
    bvsc: "B.V.Sc & A.H.",
    mvsc: "M.V.Sc",
    phd: "PhD",
  };

  const subjectByProgramme = new Map<string, typeof plans>();
  for (const p of subjectPlans) {
    const key = p.programmeSlug || "other";
    if (!subjectByProgramme.has(key)) subjectByProgramme.set(key, []);
    subjectByProgramme.get(key)!.push(p);
  }

  const yearByProgramme = new Map<string, typeof plans>();
  for (const p of yearPlans) {
    const key = p.programmeSlug || "other";
    if (!yearByProgramme.has(key)) yearByProgramme.set(key, []);
    yearByProgramme.get(key)!.push(p);
  }

  const renderPlan = (plan: (typeof plans)[number]) => {
    const enrolled = access.planSlugs.has(plan.slug);
    const isHighlight = highlight === plan.slug;
    const planImage =
      plan.type === "EXAM" && plan.examSlug
        ? getExamImage(plan.examSlug)
        : plan.subjectId
        ? resolveSubjectImage(plan.name) || getProgrammeImage(plan.programmeSlug || "ahdp")
        : plan.year && plan.programmeSlug
        ? getProgrammeYearImage(plan.programmeSlug, plan.year)
        : plan.programmeSlug
        ? getProgrammeImage(plan.programmeSlug)
        : getProgrammeImage("ahdp");
    return (
      <Card
        key={plan.slug}
        className={`va-card-hover group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-primary/5 bg-white shadow-sm hover:shadow-xl hover:border-primary/10 ${isHighlight ? "ring-2 ring-primary ring-offset-2" : ""}`}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60 group-hover:opacity-100 transition-opacity z-10" />
        {isHighlight && <Badge className="absolute top-3 right-3 z-20 rounded-full bg-[#d4a843] text-white border-0 shadow-md animate-pulse">Featured</Badge>}
        <div className="relative h-36 w-full overflow-hidden">
          <Image
            src={planImage}
            alt={plan.name}
            fill
            sizes="(max-width: 768px) 100vw, 300px"
            className="object-cover group-hover:scale-[1.05] transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-3 left-3">
            <Badge className="rounded-full bg-white/90 backdrop-blur text-primary border-0 shadow-md text-xs">
              {plan.type === "EXAM" ? "Exam Prep" : plan.subjectId ? "Subject" : plan.year ? `Year ${plan.year}` : "Programme"}
            </Badge>
          </div>
        </div>
        <CardHeader className="pb-2 relative">
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
          <div className="flex items-center justify-between gap-2 mt-2">
            <CardTitle className="text-[17px] leading-tight group-hover:text-primary transition-colors">{plan.name}</CardTitle>
            {enrolled && (
              <Badge className="rounded-full bg-emerald-600 hover:bg-emerald-600 gap-1">
                <Check className="h-3 w-3" /> Enrolled
              </Badge>
            )}
          </div>
          <CardDescription className="line-clamp-2 text-sm">{plan.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 gap-4 pt-0">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">Rs.{plan.price.toLocaleString("en-IN")}</span>
            <span className="text-sm font-normal text-muted-foreground">/ one-time</span>
          </div>
          {enrolled ? (
            <Link
              href={contentLinkForPlan(plan)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors shadow-md"
            >
              Go to Content <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href={`/checkout?plan=${encodeURIComponent(plan.slug)}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[#005f48] px-4 py-2.5 text-sm font-medium text-white hover:shadow-lg transition-all shadow-md group-hover:shadow-primary/20"
            >
              Enroll Now <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col">
      {/* Decorative Header */}
      <div className="container mx-auto px-4 pt-8">
        <DecorativePageHeader
          badge="Affordable • One-Time • Lifetime Access"
          title="Plans &"
          titleHighlight="Pricing"
          description="Choose a programme or exam preparation track and unlock complete study material, previous year papers, mock tests and resources — decorative pricing, serious value."
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

      <div className="container mx-auto px-4 mt-6">
        <div className="va-divider-dots"><span /></div>
      </div>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-primary/[0.02] to-white pointer-events-none" />
        <div className="absolute inset-0 va-pattern-grid opacity-[0.02] pointer-events-none" />
        <div className="container relative mx-auto px-4 py-8">

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><GraduationCap className="h-5 w-5" /></div>
              <h2 className="text-2xl font-bold tracking-tight">Programmes</h2>
              <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-primary/15 ml-1">{fullCoursePlans.length}</Badge>
            </div>
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-primary to-[#d4a843] mb-1" />
            <p className="text-sm text-muted-foreground mb-5">Full-course access — one payment, complete syllabus.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {fullCoursePlans.map(renderPlan)}
            </div>
          </section>

          <div className="va-divider-dots my-8"><span /></div>

          {yearByProgramme.size > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><GraduationCap className="h-5 w-5" /></div>
                <h2 className="text-2xl font-bold tracking-tight">Year-wise Plans</h2>
                <Badge variant="secondary" className="rounded-full bg-blue-50 text-blue-700 border-blue-200">Flexible</Badge>
              </div>
              <div className="h-1 w-12 rounded-full bg-gradient-to-r from-blue-600 to-[#d4a843] mb-1" />
              <p className="text-muted-foreground mb-5 max-w-2xl text-sm">
                Buy individual year packages for AHDP &amp; B.V.Sc &amp; A.H. programmes.
              </p>
              {[...yearByProgramme.entries()].map(([prog, items]) => (
                <div key={prog} className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {PROG_LABEL[prog] || prog.toUpperCase()}
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {items.map(renderPlan)}
                  </div>
                </div>
              ))}
            </section>
          )}

          {subjectByProgramme.size > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-600"><Layers className="h-5 w-5" /></div>
                <h2 className="text-2xl font-bold tracking-tight">Subject-wise Plans</h2>
                <Badge variant="secondary" className="rounded-full bg-purple-50 text-purple-700 border-purple-200">Pay per subject</Badge>
              </div>
              <div className="h-1 w-12 rounded-full bg-gradient-to-r from-purple-600 to-[#d4a843] mb-1" />
              <p className="text-muted-foreground mb-5 max-w-2xl text-sm">
                Don&apos;t need the full course? Buy individual subjects — ideal for M.V.Sc &amp; PhD students who want to pay per subject.
              </p>
              {[...subjectByProgramme.entries()].map(([prog, items]) => (
                <div key={prog} className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                    {PROG_LABEL[prog] || prog.toUpperCase()}
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {items.map(renderPlan)}
                  </div>
                </div>
              ))}
            </section>
          )}

          <section>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><Award className="h-5 w-5" /></div>
              <h2 className="text-2xl font-bold tracking-tight">Exam Preparation</h2>
              <Badge variant="secondary" className="rounded-full bg-amber-50 text-amber-700 border-amber-200">{exams.length} tracks</Badge>
            </div>
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-amber-600 to-[#d4a843] mb-1" />
            <p className="text-sm text-muted-foreground mb-5">Targeted preparation for VO, ICAR, ARS and more.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {exams.map(renderPlan)}
            </div>
          </section>

          <div className="mt-12 flex flex-col items-center gap-3">
            <div className="va-divider-dots w-full max-w-[200px]"><span /></div>
            <div className="flex items-start gap-2 justify-center text-sm text-muted-foreground bg-white border border-primary/10 rounded-2xl px-5 py-3 shadow-sm max-w-2xl">
              <Check className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" />
              <p className="text-center">
                Secure one-time payment. After enrollment the content is unlocked on your account immediately. (Test payments are enabled until Razorpay goes live.)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
