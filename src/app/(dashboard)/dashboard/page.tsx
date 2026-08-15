import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
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
  BookOpen,
  Brain,
  Target,
  ArrowRight,
  GraduationCap,
  FileText,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      programme: true,
      year: true,
      role: true,
      createdAt: true,
    },
  });

  if (!currentUser) {
    redirect("/login");
  }

  const [testAttempts, subjectCount, recentAttempts, allTests] = await Promise.all([
    prisma.mockTestAttempt.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        mockTest: { select: { title: true, totalMarks: true, subject: { select: { name: true } } } },
      },
    }),
    prisma.subject.count({
      where: { programme: { name: currentUser.programme || undefined } },
    }),
    prisma.mockTestAttempt.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        mockTest: {
          select: {
            title: true,
            totalMarks: true,
            subject: { select: { name: true } },
          },
        },
      },
    }),
    prisma.mockTest.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        subject: { select: { name: true, programme: { select: { name: true } } } },
      },
    }),
  ]);

  const testsTaken = testAttempts.length;
  const avgScore =
    testsTaken > 0
      ? Math.round(
          testAttempts.reduce((sum, a) => sum + (a.score / a.totalMarks) * 100, 0) / testsTaken
        )
      : 0;

  const stats = [
    {
      label: "Programme",
      value: currentUser.programme || "N/A",
      icon: GraduationCap,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Subjects",
      value: subjectCount.toString(),
      icon: BookOpen,
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
    {
      label: "Tests Taken",
      value: testsTaken.toString(),
      icon: Brain,
      color: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      label: "Avg Score",
      value: `${avgScore}%`,
      icon: Target,
      color: "text-orange-600",
      bg: "bg-orange-100 dark:bg-orange-900/30",
    },
  ];

  function timeAgo(date: Date) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {currentUser.name}!</h1>
        <p className="text-muted-foreground">
          {currentUser.programme
            ? `Continue your journey in ${currentUser.programme}`
            : "Track your progress and continue learning"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Jump to key sections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/syllabus">
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Browse Syllabus</p>
                    <p className="text-xs text-muted-foreground">View all subjects and chapters</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/mock-tests">
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Brain className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Mock Tests</p>
                    <p className="text-xs text-muted-foreground">Practice with mock exams</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/study-materials">
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Study Materials</p>
                    <p className="text-xs text-muted-foreground">Notes, flashcards, and more</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Recommended Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended Tests</CardTitle>
            <CardDescription>Available mock tests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {allTests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No tests available yet</p>
            ) : (
              allTests.map((test) => (
                <Link key={test.id} href={`/mock-tests/${test.id}`}>
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div>
                      <h4 className="font-medium text-sm">{test.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {test.subject?.name || "General"} &middot; {test.duration}min &middot; {test.totalMarks} marks
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              ))
            )}
            <Link href="/mock-tests">
              <Button variant="outline" className="w-full">
                View All Tests
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest test attempts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAttempts.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No test attempts yet. Start practicing!</p>
                <Link href="/mock-tests">
                  <Button className="mt-4" size="sm">
                    Browse Mock Tests
                  </Button>
                </Link>
              </div>
            ) : (
              recentAttempts.map((attempt) => {
                const percentage = Math.round((attempt.score / attempt.totalMarks) * 100);
                return (
                  <div
                    key={attempt.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50"
                  >
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{attempt.mockTest.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {attempt.mockTest.subject?.name || "General"} &middot; {timeAgo(attempt.createdAt)}
                      </p>
                    </div>
                    <Badge variant={percentage >= 70 ? "default" : percentage >= 50 ? "secondary" : "destructive"}>
                      {percentage}%
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
