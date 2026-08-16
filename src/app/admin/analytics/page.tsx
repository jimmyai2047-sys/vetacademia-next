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
} from "lucide-react";



export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [
    totalUsers,
    totalStudents,
    totalExperts,
    totalAdmins,
    totalAnimalOwners,
    totalGuests,
    totalSubjects,
    totalMockTests,
    totalAttempts,
    programmeStats,
    subjectStats,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: { in: [...EXPERT_ROLES] } } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "ANIMAL_OWNER" } }),
    prisma.user.count({ where: { role: "GUEST" } }),
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

  const scoreAgg = await prisma.mockTestAttempt.aggregate({
    _sum: { score: true, totalMarks: true },
  });

  const calculatedAvg =
    scoreAgg._sum.totalMarks
      ? Math.round((scoreAgg._sum.score || 0) / scoreAgg._sum.totalMarks * 100)
      : 0;

  const programmeAttempts = await prisma.mockTest.findMany({
    select: {
      subject: {
        select: { programmeId: true },
      },
    },
  });

  const attemptsByProgramme: Record<string, number> = {};
  programmeAttempts.forEach((t) => {
    if (t.subject?.programmeId) {
      attemptsByProgramme[t.subject.programmeId] =
        (attemptsByProgramme[t.subject.programmeId] || 0) + 1;
    }
  });

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Platform performance metrics</p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${metric.bg} flex items-center justify-center`}>
                  <metric.icon className={`h-5 w-5 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Programme Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Programme Distribution</CardTitle>
            <CardDescription>Content by programme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {programmeDistribution.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
              ) : (
                programmeDistribution.map((prog, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm">{prog.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {prog.subjects} subjects &middot; {prog.tests} tests
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">{prog.percentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
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
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Platform user roles</CardDescription>
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
                <div key={item.role} className="text-center space-y-2">
                  <div className="text-3xl font-bold">{item.count}</div>
                  <div className="text-sm text-muted-foreground">{item.role}</div>
                  <div className="w-full bg-muted rounded-full h-2">
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
      <Card>
        <CardHeader>
          <CardTitle>Subject Breakdown</CardTitle>
          <CardDescription>All subjects across programmes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 col-span-full">No subjects yet</p>
            ) : (
              subjectStats.map((subject) => (
                <div key={subject.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{subject.name}</h4>
                    <Badge variant="outline" className="text-xs">{subject.programme.name}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{subject._count.chapters} chapters</span>
                    <span>{subject._count.mockTests} tests</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
