export const metadata = {
  title: "VetAcademia | Admission Enquiries",
};

import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, Sparkles, GraduationCap } from "lucide-react";
import EnquiryManager from "@/components/admin/enquiry-manager";

export const dynamic = "force-dynamic";

export default async function AdmissionsAdminPage() {
  const [total, newCount, openCount, overdueCount] = await Promise.all([
    prisma.enquiry.count(),
    prisma.enquiry.count({ where: { status: "NEW" } }),
    prisma.enquiry.count({
      where: { status: { in: ["NEW", "CONTACTED", "FOLLOW_UP"] } },
    }),
    prisma.enquiry.count({
      where: {
        nextActionAt: { lt: new Date() },
        status: { in: ["NEW", "CONTACTED", "FOLLOW_UP"] },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Royal Header */}
      <div className="relative overflow-hidden rounded-[1.25rem] border border-primary/10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c4a6e] via-primary to-[#0284c7]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#d4a843]/15 blur-3xl" />
        <div className="relative px-6 py-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="rounded-xl bg-white/15 backdrop-blur border border-white/20 text-white hover:bg-white/25 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur border border-white/20 shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase">
                <Crown className="h-3 w-3 text-[#d4a843]" /> Royal Admissions
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Admission Enquiries</h1>
              <p className="text-white/70 text-sm flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#d4a843]" /> {total} submission{total === 1 ? "" : "s"} • {openCount} open{overdueCount > 0 ? ` • ${overdueCount} overdue` : ""} • Live inbox
              </p>
            </div>
          </div>
          <Badge className="rounded-full bg-white text-primary hover:bg-white/90 px-3 py-1 text-sm font-bold shadow-md">
            {newCount} New
          </Badge>
        </div>
      </div>

      <EnquiryManager />
    </div>
  );
}
