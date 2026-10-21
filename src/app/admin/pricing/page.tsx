export const metadata = {
  title: "VetAcademia | Plans & Pricing",
};

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import PlanFamilyTable from "@/components/admin/plan-family-table";
import PlanCreateForm from "@/components/admin/plan-create-form";
import PlanFamilyGenerator from "@/components/admin/plan-family-generator";
import { Crown, Shield, CreditCard, Table2 } from "lucide-react";



export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  const [plans, subjects] = await Promise.all([
    prisma.plan.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.subject.findMany({ select: { id: true, name: true } }),
  ]);
  const subjectNames: Record<string, string> = Object.fromEntries(
    subjects.map((s) => [s.id, s.name])
  );

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
                <Shield className="h-3.5 w-3.5 text-[#d4a843] shrink-0" /> Compare each plan family&apos;s duration variants in one row. Price, validity and listing changes apply to NEW purchases only and are written to the audit log.
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

        {/* Compact family view: one row per scope, duration variants side by side */}
        <section className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm p-5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60" />
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="h-6 w-1 rounded-full bg-gradient-to-b from-primary to-[#d4a843]" />
            <Table2 className="h-4 w-4 text-primary" />
            All plan families
          </h2>
          <PlanFamilyTable plans={plans} subjectNames={subjectNames} />
        </section>

        <PlanCreateForm subjects={subjects} />

        <PlanFamilyGenerator subjects={subjects} />


    </div>
  );
}
