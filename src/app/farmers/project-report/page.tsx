import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ReportBuilder from "./builder";
import { DecorativePageHeader } from "@/components/decorative/page-header";

export const metadata = {
  title: "VetAcademia | Project Report Builder",
  description: "Build a bank-format livestock project report with auto calculations and download the final PDF after payment.",
};

export const dynamic = "force-dynamic";

export default async function ProjectReportPage() {
  const session = await getServerSession(authOptions);
  let initialSaved: Array<{
    id: string;
    animalType: string;
    title: string;
    language: string;
    amount: number;
    status: string;
    createdAt: string;
    downloadUrl: string | null;
  }> = [];
  if (session?.user?.id) {
    const rows = await prisma.generatedReport.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, animalType: true, title: true, language: true, amount: true, status: true, createdAt: true },
    });
    initialSaved = rows.map((r) => ({
      id: r.id,
      animalType: r.animalType,
      title: r.title,
      language: r.language,
      amount: r.amount,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      downloadUrl: null,
    }));
  }
  return (
    <div className="container mx-auto px-4 py-6 pb-16">
      <DecorativePageHeader
        badge="Bank Format • NLM-EDP • Auto Calculations"
        title="Project Report"
        titleHighlight="Builder"
        description="Build a bank-format livestock project report with auto calculations and download the final PDF after payment."
        variant="emerald"
      />
      <div className="va-divider-dots my-6"><span /></div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <ReportBuilder initialSaved={initialSaved} />
      </Suspense>
    </div>
  );
}
