export const metadata = {
  title: "VetAcademia | Farmers Content",
};

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, Sparkles, Tractor } from "lucide-react";
import FarmersAdminClient, { type FarmItem } from "@/components/admin/farmers-admin-client";

export const dynamic = "force-dynamic";

export default async function AdminFarmersPage() {
  const [guides, vaccination, deworming, reports] = await Promise.all([
    prisma.farmGuide.findMany({
      orderBy: [{ category: "asc" }, { order: "asc" }, { createdAt: "desc" }],
    }),
    prisma.vaccinationSchedule.findMany({
      orderBy: [{ order: "asc" }, { disease: "asc" }],
    }),
    prisma.dewormingSchedule.findMany({
      orderBy: [{ order: "asc" }, { animal: "asc" }],
    }),
    prisma.projectReport.findMany({
      orderBy: [{ farmType: "asc" }, { order: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Royal Header */}
      <div className="relative overflow-hidden rounded-[1.25rem] border border-primary/10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#003d2e] via-primary to-[#005f48]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#d4a843]/15 blur-3xl" />
        <div className="relative px-6 py-6 text-white flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="rounded-xl bg-white/15 backdrop-blur border border-white/20 text-white hover:bg-white/25 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur border border-white/20 shadow-sm">
            <Tractor className="h-5 w-5" />
          </span>
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase">
              <Crown className="h-3 w-3 text-[#d4a843]" /> Royal Farm Desk
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Animal Owner Content</h1>
            <p className="text-white/70 text-sm flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#d4a843]" /> Manage farm guides, vaccination & deworming schedules, and paid project reports
            </p>
          </div>
        </div>
      </div>

      <FarmersAdminClient
        guides={guides as unknown as FarmItem[]}
        vaccination={vaccination as unknown as FarmItem[]}
        deworming={deworming as unknown as FarmItem[]}
        reports={reports as unknown as FarmItem[]}
      />
    </div>
  );
}
