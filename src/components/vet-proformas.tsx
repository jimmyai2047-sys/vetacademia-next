import { prisma } from "@/lib/prisma";
import { getSignedUrl } from "@/lib/blob";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, File, Download, Award } from "lucide-react";
import Link from "next/link";

export default async function VetProformas() {
  const items = await prisma.vetProforma.findMany({ where: { published: true }, orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
  if (items.length === 0) {
    return (
      <Card className="rounded-[1.5rem] border-dashed">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Proformas will appear here — Post Mortem and Health Certificate for Export (Word + PDF). Admin can upload via /admin/vet-proformas.
        </CardContent>
      </Card>
    );
  }
  const withUrls = await Promise.all(items.map(async (p) => ({
    ...p,
    wordSigned: p.wordUrl ? await getSignedUrl(p.wordUrl) : null,
    pdfSigned: p.pdfUrl ? await getSignedUrl(p.pdfUrl) : null,
  })));
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {withUrls.map((p) => (
        <Card key={p.id} className="va-card-hover rounded-[1.5rem] border-primary/10 bg-white overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-600 via-primary to-[#d4a843]" />
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><Award className="h-4 w-4" /></span>
              <CardTitle className="text-base">{p.title}</CardTitle>
              <Badge variant="outline" className="rounded-full text-xs ml-auto">{p.type === "POST_MORTEM" ? "Post Mortem" : p.type === "HEALTH_CERTIFICATE" ? "Health Certificate" : p.type}</Badge>
            </div>
            {p.description && <p className="text-xs text-muted-foreground mt-1">{p.description}</p>}
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            {p.wordSigned ? <a href={p.wordSigned} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm" className="rounded-full gap-1"><FileText className="h-3.5 w-3.5"/> Word <Download className="h-3 w-3"/></Button></a> : <span className="text-xs text-muted-foreground">Word — —</span>}
            {p.pdfSigned ? <a href={p.pdfSigned} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm" className="rounded-full gap-1"><File className="h-3.5 w-3.5"/> PDF <Download className="h-3 w-3"/></Button></a> : <span className="text-xs text-muted-foreground">PDF — —</span>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
