import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Layers, Crown, Sparkles, Shield, Eye, ExternalLink, Info } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProgrammeContentPage({
  params,
}: {
  params: Promise<{ programme: string }>;
}) {
  const { programme: slug } = await params;

  const programme = await prisma.programme.findFirst({
    where: { name: slug.toUpperCase() },
    include: {
      subjects: {
        orderBy: { name: "asc" },
        include: { _count: { select: { chapters: true } } },
      },
      departments: {
        orderBy: { name: "asc" },
        include: { _count: { select: { subjects: true } } },
      },
    },
  });

  if (!programme) notFound();

  return (
    <div className="space-y-6">
      {/* Royal Gradient Header */}
      <div className="relative overflow-hidden rounded-[1.25rem] border border-primary/10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#003d2e] via-primary to-[#005f48]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-[#d4a843]/15 blur-3xl" />
        <div className="relative px-6 py-7 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-4">
            <Link href="/admin/content">
              <Button variant="ghost" size="icon" className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1 text-xs font-bold tracking-widest uppercase">
                <Crown className="h-3.5 w-3.5 text-[#d4a843]" /> Programme · {programme.name}
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">{programme.name}</h1>
              <p className="mt-1 text-white/70 flex items-center gap-2 text-sm">
                <Shield className="h-3.5 w-3.5 text-[#d4a843]" /> {programme.fullName}
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Link href={`/syllabus/${slug}`} target="_blank" rel="noopener noreferrer">
              <Button className="rounded-xl bg-white text-[#003d2e] hover:bg-white/90 font-semibold shadow-lg gap-2">
                <Eye className="h-4 w-4" /> Preview as Student
                <ExternalLink className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </Link>
            <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2 text-center">
              <p className="text-xs text-white/60 uppercase tracking-widest">Subjects</p>
              <p className="text-xl font-bold">{programme.subjects.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a843] text-[#003d2e] shadow-lg">
              <Sparkles className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Structure Info */}
      <div className="relative overflow-hidden rounded-[1.25rem] border border-amber-200/60 bg-gradient-to-br from-amber-50 via-white to-orange-50/50 shadow-sm p-5">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-[#d4a843] to-orange-500" />
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm shrink-0">
            <Info className="h-4 w-4" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-amber-900">Student View — Programme Structure</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Student ko <code className="px-1 py-0.5 bg-white border rounded text-[11px]">/syllabus/{slug}</code> pe yehi {programme.subjects.length} subjects dikhenge — card grid (image + badge + chapter count). Click → <code className="px-1 py-0.5 bg-white border rounded text-[11px]">/syllabus/{slug}/[subjectId]</code> pe Theory/Practical accordion structure. MVSc/PhD me Course grid, BVSc/AHDP me Unit-wise list. Order = DB me <code>name ASC</code> (programme page), <code>unitNumber ASC</code> (subject page).
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="h-6 w-1 rounded-full bg-gradient-to-b from-primary to-[#d4a843]" />
          Subjects ({programme.subjects.length})
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programme.subjects.map((subject) => (
              <Card key={subject.id} className="va-card-hover group relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm hover:shadow-lg transition-all">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 border border-primary/10">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </span>
                    {subject.name}
                  </CardTitle>
                  {subject.code && (
                    <p className="text-xs font-mono text-muted-foreground">
                      {subject.code}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Badge variant="secondary" className="rounded-full">
                      {subject._count.chapters} Chapters
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      <Link href={`/admin/content/${slug}/${subject.id}`}>
                        <Button variant="outline" size="sm" className="rounded-full border-primary/10 h-7 text-xs">Manage</Button>
                      </Link>
                      <Link href={`/syllabus/${slug}/${subject.id}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="rounded-full h-7 text-xs gap-1 text-primary hover:bg-primary hover:text-white">
                          <Eye className="h-3 w-3" /> Preview
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">Position: <code className="px-1 py-0.5 bg-muted rounded">/syllabus/{slug}/{subject.id}</code></p>
                </CardContent>
              </Card>
          ))}
        </div>
      </div>

      {programme.departments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="h-6 w-1 rounded-full bg-gradient-to-b from-amber-500 to-[#d4a843]" />
            Departments ({programme.departments.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programme.departments.map((dept) => (
              <Card key={dept.id} className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-[#d4a843] to-primary opacity-60" />
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/10">
                      <Layers className="h-4 w-4 text-amber-600" />
                    </span>
                    {dept.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="rounded-full">
                    {dept._count.subjects} Subjects
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
