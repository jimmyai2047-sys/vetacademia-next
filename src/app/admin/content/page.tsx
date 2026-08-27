export const metadata = {
  title: "VetAcademia | Content Management",
};

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EXAM_CONTENT_TRACKS } from "@/lib/exam-tracks";
import {
  BookOpen,
  GraduationCap,
  FlaskConical,
  ArrowLeft,
  Layers,
  Award,
  Crown,
  Sparkles,
  Shield,
  Eye,
  ExternalLink,
  Info,
} from "lucide-react";



export const dynamic = "force-dynamic";

export default async function ContentPage() {
    const allProgrammes = (await prisma.programme.findMany({
      include: {
        _count: { select: { subjects: true, departments: true } },
      },
      orderBy: { name: "asc" },
    }));
  const byName = new Map<string, typeof allProgrammes[number]>();
  for (const p of allProgrammes) {
    const existing = byName.get(p.name);
    if (!existing || p._count.subjects > existing._count.subjects) {
      byName.set(p.name, p);
    }
  }
  const programmes = Array.from(byName.values());
  const [subjects, departments] = await Promise.all([
    prisma.subject.findMany({
      include: {
        programme: { select: { name: true } },
        department: { select: { name: true } },
        _count: { select: { chapters: true, mockTests: true } },
      },
      orderBy: { code: "asc" },
    }),
    prisma.department.findMany({
      include: {
        programme: { select: { name: true } },
        _count: { select: { subjects: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const programmeOrder: Record<string, number> = {
    AHDP: 0,
    BVSC: 1,
    MVSC: 2,
    PHD: 3,
  };
  subjects.sort((a, b) => {
    return (a.code || a.name).localeCompare(b.code || b.name);
  });

  const iconMap: Record<string, typeof BookOpen> = {
    AHDP: BookOpen,
    BVSC: GraduationCap,
    MVSC: FlaskConical,
    PHD: GraduationCap,
  };

  const colorMap: Record<string, string> = {
    AHDP: "text-green-600",
    BVSC: "text-blue-600",
    MVSC: "text-purple-600",
    PHD: "text-orange-600",
  };

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
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1 text-xs font-bold tracking-widest uppercase">
                <Crown className="h-3.5 w-3.5 text-[#d4a843]" /> Content Hub
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Content Management</h1>
              <p className="mt-1 text-white/70 flex items-center gap-2 text-sm">
                <Shield className="h-3.5 w-3.5 text-[#d4a843]" /> Upload &amp; manage chapter files — PDF / PPT / Video / Images
              </p>
            </div>
          </div>
          <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a843] text-[#003d2e] shadow-lg shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Structure Info */}
      <div className="relative overflow-hidden rounded-[1.25rem] border border-amber-200/60 bg-gradient-to-br from-amber-50 via-white to-orange-50/50 shadow-sm p-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-[#d4a843] to-orange-500" />
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm shrink-0">
            <Info className="h-4 w-4" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-amber-900">Preview + Structure Info</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              <strong>Programmes</strong> → <code className="px-1 py-0.5 bg-white border rounded text-[11px]">/syllabus/[programme]</code> (public syllabus) · <strong>Subjects</strong> → <code className="px-1 py-0.5 bg-white border rounded text-[11px]">/syllabus/[programme]/[subjectId]</code> (Theory/Practical accordion, order = <code>unitNumber ASC</code>) · <strong>Examinations</strong> → <code className="px-1 py-0.5 bg-white border rounded text-[11px]">/examinations/[exam]</code> (prev year papers + mock tests + study materials). Har card pe <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> Preview</span> se student view ek click me khulega (Admin ko full access hai — no purchase needed).
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="programmes">
        <TabsList className="rounded-full bg-muted p-1">
          <TabsTrigger value="programmes" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">Programmes ({programmes.length})</TabsTrigger>
          <TabsTrigger value="subjects" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">Subjects ({subjects.length})</TabsTrigger>
          <TabsTrigger value="departments" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">Departments ({departments.length})</TabsTrigger>
          <TabsTrigger value="examinations" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">Examinations ({EXAM_CONTENT_TRACKS.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="programmes" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {programmes.map((prog) => {
              const Icon = iconMap[prog.name] || BookOpen;
              const color = colorMap[prog.name] || "text-primary";
              const slug = prog.name.toLowerCase();
              return (
                  <Card key={prog.id} className="va-card-hover group relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm hover:shadow-lg transition-all">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 border border-primary/10">
                            <Icon className={`h-4 w-4 ${color}`} />
                          </span>
                          <CardTitle className="text-lg">{prog.name}</CardTitle>
                        </div>
                      </div>
                      <CardDescription className="text-xs">{prog.fullName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary" className="rounded-full">
                            {prog._count.subjects} Subjects
                          </Badge>
                          <Badge variant="outline" className="rounded-full">
                            {prog._count.departments} Depts
                          </Badge>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Link href={`/admin/content/${slug}`}>
                          <Button variant="outline" size="sm" className="rounded-full border-primary/10 h-7 text-xs">Manage</Button>
                        </Link>
                        <Link href={`/syllabus/${slug}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="rounded-full h-7 text-xs gap-1 text-primary hover:bg-primary hover:text-white">
                            <Eye className="h-3 w-3" /> Preview
                          </Button>
                        </Link>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2">Pos: <code className="px-1 py-0.5 bg-muted rounded">/syllabus/{slug}</code></p>
                    </CardContent>
                  </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="subjects" className="mt-4">
          <Card className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-primary to-emerald-500" />
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#005f48] text-white shadow-md">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <div>
                    <CardTitle>All Subjects</CardTitle>
                    <CardDescription>All subjects across programmes</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Programme</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Chapters</TableHead>
                    <TableHead>Tests</TableHead>
                    <TableHead>Preview</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No subjects found
                      </TableCell>
                    </TableRow>
                  ) : (
                    subjects.map((subject) => {
                      const progSlug = subject.programme.name.toLowerCase().includes("ahdp") ? "ahdp" : subject.programme.name.toLowerCase().includes("ph.d") ? "phd" : subject.programme.name.toLowerCase().includes("m.v") ? "mvsc" : "bvsc";
                      return (
                      <TableRow key={subject.id} className="hover:bg-primary/[0.04]">
                        <TableCell className="font-mono text-sm">{subject.code || "-"}</TableCell>
                        <TableCell className="font-medium">{subject.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-full">{subject.programme.name}</Badge>
                        </TableCell>
                        <TableCell>{subject.year || "-"}</TableCell>
                        <TableCell>{subject._count.chapters}</TableCell>
                        <TableCell>{subject._count.mockTests}</TableCell>
                        <TableCell>
                          <Link href={`/syllabus/${progSlug}/${subject.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            <Eye className="h-3 w-3" /> View
                          </Link>
                        </TableCell>
                      </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="mt-4">
          <Card className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-[#d4a843] to-primary" />
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
                    <Layers className="h-4 w-4" />
                  </span>
                  <div>
                    <CardTitle>Departments</CardTitle>
                    <CardDescription>All departments across programmes</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Programme</TableHead>
                    <TableHead>Subjects</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No departments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    departments.map((dept) => (
                      <TableRow key={dept.id} className="hover:bg-primary/[0.04]">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-muted-foreground" />
                            {dept.name}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{dept.code || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-full">{dept.programme.name}</Badge>
                        </TableCell>
                        <TableCell>{dept._count.subjects}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examinations" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {EXAM_CONTENT_TRACKS.map((track) => {
              const examMap: Record<string, string> = {
                "veterinary-officer": "psc",
                "livestock-assistant": "psc",
                "icar-jrf-srf": "icar-entrance",
                "icar-ars-net": "ars",
                "icar-net": "net",
              };
              const examSlug = examMap[track.key] || "other";
              return (
                <Card key={track.key} className="va-card-hover group relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm hover:shadow-lg transition-all">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#d4a843] via-primary to-[#003d2e] opacity-60 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#d4a843]/15 border border-[#d4a843]/20">
                        <Award className="h-4 w-4 text-[#9a7b2e]" />
                      </span>
                      <CardTitle className="text-lg leading-tight">{track.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link href={`/admin/content/exam/${track.key}`}>
                        <Button variant="outline" size="sm" className="rounded-full border-primary/10 h-7 text-xs">Manage</Button>
                      </Link>
                      <Link href={`/examinations/${examSlug}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="rounded-full h-7 text-xs gap-1 text-primary hover:bg-primary hover:text-white">
                          <Eye className="h-3 w-3" /> Preview
                        </Button>
                      </Link>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">Pos: <code className="px-1 py-0.5 bg-muted rounded">/examinations/{examSlug}</code></p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
