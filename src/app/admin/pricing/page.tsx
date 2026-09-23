export const metadata = {
  title: "VetAcademia | Plans & Pricing",
};

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import PlanEditor from "@/components/admin/plan-editor";
import PlanCreateForm from "@/components/admin/plan-create-form";
import { Crown, Shield, CreditCard } from "lucide-react";



export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });

  const fullCourses = plans.filter(
    (p) => p.type === "COURSE" && !p.year && !p.subjectId
  );
  const yearPlans = plans.filter((p) => p.type === "COURSE" && !!p.year);
  const subjectPlans = plans.filter((p) => p.type === "COURSE" && !!p.subjectId);
  const exams = plans.filter((p) => p.type === "EXAM");

  // Generated Report price is currently REPORT_PRICE=2500 in src/lib/report-input.ts + Setting key `reportPrice` (if set)
  const reportPriceSetting = await prisma.setting.findUnique({ where: { key: "reportPrice" } }).catch(() => null);
  const reportPrice = reportPriceSetting?.value ?? "2500";

  return (
      <div className="space-y-8">
        {/* Royal Gradient Header */}
        <div className="relative overflow-hidden rounded-[1.25rem] border border-primary/10 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0c4a6e] via-primary to-[#0284c7]" />
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
            <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a843] text-[#0c4a6e] shadow-lg shrink-0">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Re-included for Project Report Development: Generated Report Price (replaces legacy per-farmType editor) */}
        <section className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-emerald-500/20 bg-white shadow-sm p-5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-[#d4a843] to-teal-600" />
          <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100"><CreditCard className="h-4 w-4 text-emerald-700" /></span>
            Bank-Format Project Reports (Generated Reports)
          </h2>
          <p className="text-sm text-muted-foreground mb-3">On-demand DPR builder — GOAT / SHEEP / PIG / POULTRY (Broiler/Layer) / DAIRY (Cattle/Buffalo). Preview DRAFT (watermark) → Razorpay → finalize private Blob.</p>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-emerald-50/60 px-4 py-3">
            <span className="text-sm font-medium">Current price:</span>
            <span className="text-lg font-bold text-emerald-700">Rs. {reportPrice}</span>
            <span className="text-xs text-muted-foreground">/ report ( infirmary 6-yr NPV/BCR/IRR/DSCR ). Change via <code className="bg-white px-1.5 py-0.5 rounded border">Setting</code> key <code className="bg-white px-1.5 py-0.5 rounded border">reportPrice</code> → <code className="bg-white px-1.5 py-0.5 rounded border">REPORT_PRICE</code> in <code className="bg-white px-1.5 py-0.5 rounded border">report-input.ts</code></span>
            <span className="ml-auto text-xs text-muted-foreground">Builder: <Link href="/farmers/project-report" className="underline">/farmers/project-report</Link> • Admin view: Animal Owner Content → Generated Reports tab</span>
          </div>
        </section>

        <PlanCreateForm />

        <section className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm p-5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60" />
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="h-6 w-1 rounded-full bg-gradient-to-b from-primary to-[#d4a843]" />
            Programmes (Full)
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {fullCourses.length === 0 ? <p>No plans yet</p> : fullCourses.map((p) => (
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
          {yearPlans.length === 0 ? <p>No plans yet</p> : yearPlans.map((p) => (
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
          {subjectPlans.length === 0 ? <p>No plans yet</p> : subjectPlans.map((p) => (
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
          {exams.length === 0 ? <p>No plans yet</p> : exams.map((p) => (
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


    </div>
  );
}
