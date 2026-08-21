export const metadata = {
  title: "VetAcademia | Admission Enquiries",
};

import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdmissionsAdminPage() {
  const enquiries = await prisma.enquiry.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admission Enquiries</h1>
          <p className="text-sm text-muted-foreground">
            {enquiries.length} recent submission{enquiries.length === 1 ? "" : "s"}
          </p>
        </div>
        <Badge variant="secondary">{enquiries.filter((e) => e.status === "NEW").length} New</Badge>
      </div>

      <Card>
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
                <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium">{e.fullName}</div>
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
                      className="text-xs"
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
