export const metadata = {
  title: "VetAcademia | Plans & Pricing",
};

import { prisma } from "@/lib/prisma";
import PlanEditor from "@/components/admin/plan-editor";
import ReportPriceEditor from "@/components/admin/report-price-editor";
import PlanCreateForm from "@/components/admin/plan-create-form";
import { Crown, Sparkles, Shield, CreditCard } from "lucide-react";



export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });

  const fullCourses = plans.filter(
    (p) => p.type === "COURSE" && !p.year && !p.subjectId
  );
  const yearPlans = plans.filter((p) => p.type === "COURSE" && !!p.year);
  const subjectPlans = plans.filter((p) => p.type === "COURSE" && !!p.subjectId);
  const exams = plans.filter((p) => p.type === "EXAM");

  const reports = await prisma.projectReport.findMany({
    orderBy: [{ farmType: "asc" }, { order: "asc" }, { createdAt: "desc" }],
  });

  return (
      <div className="space-y-8">
        {/* Royal Gradient Header */}
        <div className="relative overflow-hidden rounded-[1.25rem] border border-primary/10 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#003d2e] via-primary to-[#005f48]" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-[#d4a843]/15 blur-3xl" />
          <div className="relative px-6 py-7 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1 text-xs font-bold tracking-widest uppercase">
                <Crown className="h-3.5 w-3.5 text-[#d4a843]" /> Royal Pricing
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Pricing</h1>
              <p className="mt-1 text-white/70 flex items-center gap-2 text-sm max-w-2xl">
                <Shield className="h-3.5 w-3.5 text-[#d4a843] shrink-0" /> Set the one-time price and description for each programme, exam preparation plan, and granular year/subject plan. Changes apply immediately on the public pricing page.
              </p>
            </div>
            <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a843] text-[#003d2e] shadow-lg shrink-0">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>
        </div>

        <PlanCreateForm />

        <section className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm p-5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60" />
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="h-6 w-1 rounded-full bg-gradient-to-b from-primary to-[#d4a843]" />
            Programmes (Full)
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {fullCourses.map((p) => (
              <PlanEditor
                key={p.slug}
                plan={{
                  slug: p.slug,
                  name: p.name,
                  type: p.type,
                  description: p.description,
                  price: p.price,
                }}
              />
            ))}
          </div>
        </section>

      <section className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm p-5">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-primary to-emerald-500" />
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="h-6 w-1 rounded-full bg-gradient-to-b from-blue-600 to-primary" />
          Year Plans (BVSc / AHDP)
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {yearPlans.map((p) => (
            <PlanEditor
              key={p.slug}
              plan={{
                slug: p.slug,
                name: p.name,
                type: p.type,
                description: p.description,
                price: p.price,
              }}
            />
          ))}
        </div>
      </section>

      <section className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm p-5">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-primary to-amber-500" />
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="h-6 w-1 rounded-full bg-gradient-to-b from-purple-600 to-amber-500" />
          Subject Plans (M.V.Sc / Ph.D)
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjectPlans.map((p) => (
            <PlanEditor
              key={p.slug}
              plan={{
                slug: p.slug,
                name: p.name,
                type: p.type,
                description: p.description,
                price: p.price,
              }}
            />
          ))}
        </div>
      </section>

      <section className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm p-5">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-[#d4a843] to-primary" />
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="h-6 w-1 rounded-full bg-gradient-to-b from-amber-500 to-primary" />
          Exam Preparation
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((p) => (
            <PlanEditor
              key={p.slug}
              plan={{
                slug: p.slug,
                name: p.name,
                type: p.type,
                description: p.description,
                price: p.price,
              }}
            />
          ))}
        </div>
      </section>

      <section className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm p-5">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#d4a843] via-primary to-[#003d2e]" />
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#d4a843]/15 border border-[#d4a843]/20">
            <Sparkles className="h-4 w-4 text-[#9a7b2e]" />
          </span>
          Animal Owner Project Reports
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          Set the unlock price (INR) for each project report shown on the Animal
          Owner page. Saving updates the price immediately.
        </p>
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-primary/10 bg-muted/20 px-4 py-6 text-center">
            No project reports yet. Add them from the Animal Owner Content page.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((r) => (
              <ReportPriceEditor
                key={r.id}
                report={{
                  id: r.id,
                  title: r.title,
                  farmType: r.farmType,
                  price: r.price,
                  published: r.published,
                  order: r.order,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
