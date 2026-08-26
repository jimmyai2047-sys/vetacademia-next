export const metadata = {
  title: "VetAcademia | Admission Enquiries",
};

import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, Sparkles, GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdmissionsAdminPage() {
  const enquiries = await prisma.enquiry.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      {/* Royal Header */}
      <div className="relative overflow-hidden rounded-[1.25rem] border border-primary/10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#003d2e] via-primary to-[#005f48]" />
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
                <Sparkles className="h-3.5 w-3.5 text-[#d4a843]" /> {enquiries.length} recent submission{enquiries.length === 1 ? "" : "s"} • Live inbox
              </p>
            </div>
          </div>
          <Badge className="rounded-full bg-white text-primary hover:bg-white/90 px-3 py-1 text-sm font-bold shadow-md">
            {enquiries.filter((e) => e.status === "NEW").length} New
          </Badge>
        </div>
      </div>

      <Card className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Programme</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Received</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No enquiries yet.
                  </td>
                </tr>
              )}
              {enquiries.map((e) => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-primary/[0.04] transition-colors">
                  <td className="px-4 py-3 align-top">
                    <div className="font-semibold">{e.fullName}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.fatherName ? `F: ${e.fatherName}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div>{e.email}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.studentMobile || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div>{e.programme || "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.yearOrSemester || ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div>{e.category || "—"}</div>
                    <div className="text-xs text-muted-foreground">{e.tsp || ""}</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Badge
                      variant={e.status === "NEW" ? "default" : "secondary"}
                      className={`text-xs rounded-full ${e.status === "NEW" ? "bg-gradient-to-br from-primary to-[#005f48] text-white border-0 shadow-sm" : ""}`}
                    >
                      {e.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(e.createdAt).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
