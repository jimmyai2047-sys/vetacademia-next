import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Stethoscope } from "lucide-react";
import VetCaseActions from "@/components/admin/vet-case-actions";

export const dynamic = "force-dynamic";

export default async function VetCasesAdminPage() {
  const cases = await prisma.vetCase
    .findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        species: true,
        age: true,
        contact: true,
        history: true,
        photoUrls: true,
        status: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    })
    .catch(() => []);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[1.25rem] border border-primary/10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c4a6e] via-primary to-[#0284c7]" />
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#d4a843]/15 blur-3xl" />
        <div className="relative px-6 py-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-11 w-11" aria-label="Back to dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/70">Admin • Vet Cases</p>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Stethoscope className="h-6 w-6" /> Clinical Case Inbox
              </h1>
              <p className="text-sm text-white/70">Cases submitted from the Vets page for expert review.</p>
            </div>
          </div>
          <Badge className="rounded-full bg-white/15 border-white/20 text-white px-3 py-1.5">
            {cases.filter((c) => c.status === "OPEN").length} open
          </Badge>
        </div>
      </div>

      {cases.length === 0 ? (
        <Card className="rounded-[1.25rem]">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No cases submitted yet. New cases from the Vets page will appear here.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {cases.map((c) => (
            <Card key={c.id} className="rounded-[1.25rem] border-primary/10">
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="outline" className="rounded-full">{c.species}</Badge>
                  {c.age && <span className="text-muted-foreground">{c.age}</span>}
                  <span className="text-muted-foreground">•</span>
                  <span className="font-medium">{c.user?.name ?? "Unknown"}</span>
                  <span className="text-muted-foreground">{c.user?.email}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{c.contact}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{c.history}</p>
                {c.photoUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {c.photoUrls.map((u, i) => (
                      <a
                        key={i}
                        href={`/api/blob?url=${encodeURIComponent(u)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs underline text-primary"
                      >
                        Photo {i + 1}
                      </a>
                    ))}
                  </div>
                )}
                <VetCaseActions id={c.id} status={c.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
