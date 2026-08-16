export const metadata = {
  title: "VetAcademia | Farmers Content",
};

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Animal Owner Content</h1>
            <p className="text-muted-foreground">
              Manage farm guides, vaccination &amp; deworming schedules, and paid
              project reports.
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
