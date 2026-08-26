export const metadata = {
  title: "VetAcademia | Analytics",
};

import { prisma } from "@/lib/prisma";
import { EXPERT_ROLES } from "@/lib/roles";
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
import {
  Users,
  BookOpen,
  Brain,
  TrendingUp,
  ArrowLeft,
  GraduationCap,
  Crown,
  Sparkles,
  BarChart3,
  Activity,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [
    roleGroups,
    totalSubjects,
    totalMockTests,
    totalAttempts,
    programmeStats,
    subjectStats,
  ] = await Promise.all([
    prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true },
    }),
    prisma.subject.count(),
    prisma.mockTest.count(),
    prisma.mockTestAttempt.count(),
    prisma.programme.findMany({
      include: {
        _count: { select: { subjects: true } },
      },
    }),
    prisma.subject.findMany({
      include: {
        programme: { select: { name: true } },
        _count: { select: { chapters: true, mockTests: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const roleCount: Record<string, number> = {};
  for (const g of roleGroups) roleCount[String(g.role)] = g._count._all;
  const totalUsers = Object.values(roleCount).reduce((a, b) => a + b, 0);
  const totalStudents = roleCount["STUDENT"] || 0;
  const totalExperts = [...EXPERT_ROLES].reduce(
    (a, r) => a + (roleCount[String(r)] || 0),
    0
  );
  const totalAdmins = roleCount["ADMIN"] || 0;
  const totalAnimalOwners = roleCount["ANIMAL_OWNER"] || 0;
  const totalGuests = roleCount["GUEST"] || 0;

  const scoreAgg = await prisma.mockTestAttempt.aggregate({
    _sum: { score: true, totalMarks: true },
  });

  const calculatedAvg =
    scoreAgg._sum.totalMarks
      ? Math.round((scoreAgg._sum.score || 0) / scoreAgg._sum.totalMarks * 100)
      : 0;

  const [mockTestBySubject, subjectProgramme] = await Promise.all([
    prisma.mockTest.groupBy({
      by: ["subjectId"],
      _count: { _all: true },
    }),
    prisma.subject.findMany({
      select: { id: true, programmeId: true },
    }),
  ]);

  const subjToProg: Record<string, string> = {};
  for (const s of subjectProgramme) {
    if (s.programmeId) subjToProg[s.id] = s.programmeId;
  }

  const attemptsByProgramme: Record<string, number> = {};
  for (const g of mockTestBySubject) {
    const prog = g.subjectId ? subjToProg[g.subjectId] : null;
    if (prog) {
      attemptsByProgramme[prog] = (attemptsByProgramme[prog] || 0) + g._count._all;
    }
  }

  const programmeDistribution = programmeStats.map((prog) => ({
    name: prog.name,
    fullName: prog.fullName,
    subjects: prog._count.subjects,
    tests: attemptsByProgramme[prog.id] || 0,
    percentage:
      totalMockTests > 0
        ? Math.round(((attemptsByProgramme[prog.id] || 0) / totalMockTests) * 100)
        : 0,
  }));

  const metrics = [
    { title: "Total Users", value: totalUsers.toLocaleString(), icon: Users, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
    { title: "Active Students", value: totalStudents.toLocaleString(), icon: GraduationCap, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
    { title: "Tests Available", value: totalMockTests.toLocaleString(), icon: Brain, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
    { title: "Avg. Score", value: `${calculatedAvg}%`, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30" },
  ];

  return (
    <div className="space-y-6">
      {/* Royal Header */}
      <div className="relative overflow-hidden rounded-[1.25rem] border border-primary/10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#003d2e] via-primary to-[#005f48]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#d4a843]/15 blur-3xl" />
        <div className="relative px-6 py-6 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon" aria-label="Back to dashboard" className="rounded-xl bg-white/15 backdrop-blur border border-white/20 text-white hover:bg-white/25 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="hidden sm:flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur border border-white/20 shadow-sm">
              <BarChart3 className="h-5 w-5" />
            </span>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase">
                <Crown className="h-3 w-3 text-[#d4a843]" /> Royal Insights
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">Analytics</h1>
              <p className="text-white/70 text-sm flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#d4a843]" /> Platform performance metrics • Live
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2 text-center">
              <p className="text-[10px] text-white/60 uppercase tracking-widest font-bold">Total Users</p>
              <p className="text-lg font-bold">{totalUsers.toLocaleString()}</p>
            </div>
            <div className="hidden sm:flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4a843] text-[#003d2e] shadow-lg">
              <Activity className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Metrics - Royal */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="va-card-hover group relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm hover:shadow-md">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground/70">{metric.title}</p>
                  <p className="mt-1 text-2xl font-extrabold tracking-tight">{metric.value}</p>
                  <div className="mt-2 h-1 w-8 rounded-full bg-primary/20 group-hover:w-12 group-hover:bg-primary transition-all" />
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl border shadow-sm ${metric.bg} group-hover:scale-105 transition-transform`}>
                  <metric.icon className={`h-5 w-5 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Programme Distribution */}
        <Card className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-primary to-teal-500" />
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md">
                <BookOpen className="h-4 w-4" />
              </span>
              <div>
                <CardTitle className="text-base">Programme Distribution</CardTitle>
                <CardDescription className="text-xs">Content by programme</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {programmeDistribution.length === 0 ? (
                <div className="text-center py-10 rounded-xl border border-dashed border-primary/10 bg-muted/20">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No data yet</p>
                </div>
              ) : (
                programmeDistribution.map((prog, index) => (
                  <div key={index} className="space-y-2 group/prog">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-sm">{prog.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {prog.subjects} subjects &middot; {prog.tests} tests
                        </span>
                      </div>
                      <span className="text-sm font-bold text-primary">{prog.percentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary to-[#005f48] h-2 rounded-full transition-all"
                        style={{ width: `${prog.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Role Distribution */}
        <Card className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-primary to-indigo-500" />
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
                <Users className="h-4 w-4" />
              </span>
              <div>
                <CardTitle className="text-base">User Distribution</CardTitle>
                <CardDescription className="text-xs">Platform user roles</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {[
                { role: "Students", count: totalStudents, color: "bg-blue-500" },
                { role: "Animal Owners", count: totalAnimalOwners, color: "bg-amber-500" },
                { role: "Experts", count: totalExperts, color: "bg-green-500" },
                { role: "Guests", count: totalGuests, color: "bg-gray-500" },
                { role: "Admins", count: totalAdmins, color: "bg-red-500" },
              ].map((item) => (
                <div key={item.role} className="text-center space-y-2 p-3 rounded-xl border border-transparent hover:border-primary/10 hover:bg-primary/[0.03] transition-colors">
                  <div className="text-2xl font-extrabold tracking-tight">{item.count}</div>
                  <div className="text-xs font-bold tracking-widest uppercase text-muted-foreground/70">{item.role}</div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`${item.color} h-2 rounded-full`}
                      style={{
                        width: `${totalUsers > 0 ? (item.count / totalUsers) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Breakdown */}
      <Card className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 text-white shadow-md">
              <BookOpen className="h-4 w-4" />
            </span>
            <div>
              <CardTitle className="text-base">Subject Breakdown</CardTitle>
              <CardDescription className="text-xs">All subjects across programmes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectStats.length === 0 ? (
              <div className="col-span-full text-center py-10 rounded-xl border border-dashed border-primary/10 bg-muted/20">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No subjects yet</p>
              </div>
            ) : (
              subjectStats.map((subject) => (
                <div key={subject.id} className="group p-4 rounded-xl border border-primary/5 bg-gradient-to-br from-white to-primary/[0.02] hover:border-primary/15 hover:shadow-md transition-all space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">{subject.name}</h4>
                    <Badge variant="outline" className="text-xs rounded-full border-primary/10 bg-primary/5 shrink-0">{subject.programme.name}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" />{subject._count.chapters} chapters</span>
                    <span className="h-1 w-1 rounded-full bg-primary/30" />
                    <span className="inline-flex items-center gap-1"><Brain className="h-3 w-3" />{subject._count.mockTests} tests</span>
                  </div>
                  <div className="h-1 w-6 rounded-full bg-primary/20 group-hover:w-10 group-hover:bg-primary transition-all" />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
