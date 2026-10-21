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
  CalendarRange,
  CreditCard,
  UserPlus,
  ShoppingCart,
  BadgeCheck,
  PlayCircle,
  Repeat,
  Eye,
} from "lucide-react";

export const dynamic = "force-dynamic";

// Finding 16: metrics must state population, window and exclusions. The whole
// page runs inside an explicit date window (default: last 30 days) and every
// production figure excludes TEST payments.
const LIVE_CLAUSE = { OR: [{ method: null }, { method: { not: "TEST" } }] };

function parseDateParam(v: string | undefined, endOfDay: boolean): Date | null {
  if (!v) return null;
  const d = new Date(`${v}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dateInputValue(d: Date): string {
  return new Intl.DateTimeFormat("en-CA").format(d);
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const windowEnd = parseDateParam(params.to, true) ?? new Date();
  const windowStart =
    parseDateParam(params.from, false) ??
    new Date(windowEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
  const inWindow = { gte: windowStart, lte: windowEnd };
  const windowLabel = `${dateInputValue(windowStart)} → ${dateInputValue(windowEnd)}`;

  const [
    roleGroups,
    totalSubjects,
    totalMockTests,
    totalAttempts,
    programmeStats,
    subjectStats,
    scoreAgg,
    expertProfileCount,
    visitorsInWindow,
    newAccountsInWindow,
    newStudentsInWindow,
    checkoutsInWindow,
    paidOrdersInWindow,
    activePaidUserGroups,
    activeLearnerGroups,
    repeatLearnerGroups,
    progressUpdatesInWindow,
    mockTestBySubject,
    subjectProgramme,
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
    // Windowed score aggregate (population: attempts started in the window).
    prisma.mockTestAttempt.aggregate({
      where: { createdAt: inWindow },
      _sum: { score: true, totalMarks: true },
    }),
    // Definition split (finding 14): profile rows vs role-based accounts.
    prisma.expert.count(),
    // Funnel stage 1 — cookie-based unique visitors seen in the window.
    prisma.siteVisit.count({ where: { lastSeen: inWindow } }),
    // Funnel stage 2 — registrations in the window (guests are ephemeral
    // anonymous sessions, not learners, so they are excluded).
    prisma.user.count({
      where: { createdAt: inWindow, role: { not: "GUEST" } },
    }),
    prisma.user.count({
      where: { createdAt: inWindow, role: "STUDENT" },
    }),
    // Funnel stage 3 — checkout started (TEST orders kept out of production).
    prisma.payment.count({ where: { createdAt: inWindow, ...LIVE_CLAUSE } }),
    // Funnel stage 4 — verified payment (orders placed in window, now PAID).
    prisma.payment.count({
      where: { createdAt: inWindow, status: "PAID", ...LIVE_CLAUSE },
    }),
    // Paid learners with active access (all-time, unexpired, non-TEST).
    prisma.payment.groupBy({
      by: ["userId"],
      where: {
        status: "PAID",
        ...LIVE_CLAUSE,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    }),
    // Recently active learners — distinct users with ≥1 attempt in window.
    prisma.mockTestAttempt.groupBy({
      by: ["userId"],
      where: { createdAt: inWindow },
    }),
    // Repeat practice — users with ≥2 attempts in window.
    prisma.mockTestAttempt.groupBy({
      by: ["userId"],
      where: { createdAt: inWindow },
      having: { id: { _count: { gte: 2 } } },
    }),
    // Progress records touched in the window.
    prisma.userProgress.count({ where: { lastAccessed: inWindow } }),
    prisma.mockTest.groupBy({
      by: ["subjectId"],
      _count: { _all: true },
    }),
    prisma.subject.findMany({
      select: { id: true, programmeId: true },
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

  const calculatedAvg =
    scoreAgg._sum.totalMarks
      ? Math.round((scoreAgg._sum.score || 0) / scoreAgg._sum.totalMarks * 100)
      : 0;

  const subjToProg: Record<string, string> = {};
  for (const s of subjectProgramme) {
    if (s.programmeId) subjToProg[s.id] = s.programmeId;
  }

  const testsByProgramme: Record<string, number> = {};
  for (const g of mockTestBySubject) {
    const prog = g.subjectId ? subjToProg[g.subjectId] : null;
    if (prog) {
      testsByProgramme[prog] = (testsByProgramme[prog] || 0) + g._count._all;
    }
  }

  const programmeDistribution = programmeStats.map((prog) => ({
    name: prog.name,
    fullName: prog.fullName,
    subjects: prog._count.subjects,
    tests: testsByProgramme[prog.id] || 0,
    percentage:
      totalMockTests > 0
        ? Math.round(((testsByProgramme[prog.id] || 0) / totalMockTests) * 100)
        : 0,
  }));

  const funnel = (() => {
    const stages = [
      {
        key: "demo",
        label: "Demo visits",
        value: visitorsInWindow,
        icon: Eye,
        def: "cookie-based visitors with activity in window",
        href: null,
      },
      {
        key: "register",
        label: "Registrations",
        value: newAccountsInWindow,
        icon: UserPlus,
        def: "non-guest accounts created in window",
        href: "/admin/users",
      },
      {
        key: "checkout",
        label: "Checkout started",
        value: checkoutsInWindow,
        icon: ShoppingCart,
        def: "payment orders created in window, non-TEST",
        href: `/admin/payments?from=${dateInputValue(windowStart)}&to=${dateInputValue(windowEnd)}`,
      },
      {
        key: "paid",
        label: "Verified payment",
        value: paidOrdersInWindow,
        icon: BadgeCheck,
        def: "orders from window now PAID, non-TEST",
        href: `/admin/payments?from=${dateInputValue(windowStart)}&to=${dateInputValue(windowEnd)}`,
      },
      {
        key: "lesson",
        label: "First lesson",
        value: activeLearnerGroups.length,
        icon: PlayCircle,
        def: "distinct learners with ≥1 test attempt in window",
        href: "/admin",
      },
    ];
    return stages.map((s, i) => ({
      ...s,
      conversion:
        i === 0 || stages[i - 1].value === 0
          ? null
          : Math.round((s.value / stages[i - 1].value) * 100),
    }));
  })();

  const metrics = [
    {
      title: "Total accounts",
      value: totalUsers.toLocaleString(),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      def: `all registered accounts, all-time · includes guests (${totalGuests}) and admins (${totalAdmins})`,
      href: "/admin/users",
    },
    {
      title: "Registered students",
      value: totalStudents.toLocaleString(),
      icon: GraduationCap,
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/30",
      def: `role = STUDENT, all-time · guests excluded · ${newStudentsInWindow} joined in window`,
      href: "/admin/users",
    },
    {
      title: "Paid learners (active)",
      value: activePaidUserGroups.length.toLocaleString(),
      icon: CreditCard,
      color: "text-emerald-600",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      def: "distinct users with an unexpired non-TEST PAID order · all-time · TEST orders excluded",
      href: "/admin/payments",
    },
    {
      title: "Recently active",
      value: activeLearnerGroups.length.toLocaleString(),
      icon: Activity,
      color: "text-orange-600",
      bg: "bg-orange-100 dark:bg-orange-900/30",
      def: `distinct students attempting ≥1 test in ${windowLabel} · guests excluded`,
      href: "/admin",
    },
    {
      title: "Avg. score (window)",
      value: `${calculatedAvg}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/30",
      def: `Σscore ÷ Σmarks over attempts started in ${windowLabel} · all-time attempts: ${totalAttempts.toLocaleString()}`,
      href: "/admin",
    },
    {
      title: "Tests available",
      value: totalMockTests.toLocaleString(),
      icon: Brain,
      color: "text-indigo-600",
      bg: "bg-indigo-100 dark:bg-indigo-900/30",
      def: `published mock tests, all-time · inventory (not windowed) · ${totalSubjects} subjects`,
      href: "/admin/mock-tests",
    },
    {
      title: "Repeat practice",
      value: repeatLearnerGroups.length.toLocaleString(),
      icon: Repeat,
      color: "text-pink-600",
      bg: "bg-pink-100 dark:bg-pink-900/30",
      def: `learners with ≥2 attempts in window · progress records touched: ${progressUpdatesInWindow.toLocaleString()}`,
      href: "/admin",
    },
    {
      title: "Expert profiles",
      value: `${expertProfileCount} / ${totalExperts}`,
      icon: Crown,
      color: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-900/30",
      def: "published profiles vs expert-role accounts — different definitions, shown together on purpose",
      href: "/admin/experts",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Royal Header */}
      <div className="relative overflow-hidden rounded-[1.25rem] border border-primary/10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c4a6e] via-primary to-[#0284c7]" />
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
                <Sparkles className="h-3.5 w-3.5 text-[#d4a843]" /> Platform performance metrics • Windowed figures state their population, range and exclusions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2 text-center">
              <p className="text-[10px] text-white/60 uppercase tracking-widest font-bold">Accounts (all-time)</p>
              <p className="text-lg font-bold">{totalUsers.toLocaleString()}</p>
            </div>
            <div className="hidden sm:flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4a843] text-[#0c4a6e] shadow-lg">
              <Activity className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Reporting window — every windowed metric below states this range */}
      <Card className="rounded-[1.25rem] border border-primary/10 bg-white shadow-sm">
        <CardContent className="p-4 flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2 text-sm font-bold mr-1">
            <CalendarRange className="h-4 w-4 text-primary" />
            Reporting window
          </div>
          <form method="get" className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
              From
              <input
                type="date"
                name="from"
                defaultValue={dateInputValue(windowStart)}
                className="h-9 rounded-lg border border-primary/15 bg-white px-2 text-sm font-medium text-foreground"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
              To
              <input
                type="date"
                name="to"
                defaultValue={dateInputValue(windowEnd)}
                className="h-9 rounded-lg border border-primary/15 bg-white px-2 text-sm font-medium text-foreground"
              />
            </label>
            <Button type="submit" size="sm" className="h-9 rounded-lg bg-gradient-to-r from-[#0c4a6e] to-primary text-white">
              Apply
            </Button>
            <Link
              href="/admin/analytics"
              className="h-9 inline-flex items-center rounded-lg border border-primary/15 px-3 text-xs font-semibold text-muted-foreground hover:bg-primary/5"
            >
              Reset (last 30 days)
            </Link>
          </form>
          <p className="w-full text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{windowLabel}</span> (server-local dates).
            Windowed metrics use this range; all-time metrics are labeled as such. Production figures exclude
            TEST payments.
          </p>
        </CardContent>
      </Card>

      {/* Funnel — demo → registration → checkout → verified payment → first lesson (finding 16) */}
      <Card className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0c4a6e] via-[#d4a843] to-primary" />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0c4a6e] to-primary text-white shadow-md">
              <TrendingUp className="h-4 w-4" />
            </span>
            <div>
              <CardTitle className="text-base">Learner funnel</CardTitle>
              <CardDescription className="text-xs">
                Each stage states its population and exclusions · window {windowLabel} ·
                payments exclude TEST orders · guests excluded from registrations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {funnel.map((stage) => (
              <li key={stage.key} className="relative rounded-xl border border-primary/10 bg-gradient-to-br from-white to-primary/[0.03] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/10 bg-white shadow-sm text-primary">
                    <stage.icon className="h-4 w-4" />
                  </span>
                  <span className="text-xl font-extrabold tracking-tight">{stage.value.toLocaleString()}</span>
                </div>
                <p className="mt-2 text-xs font-bold">{stage.label}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{stage.def}</p>
                {stage.conversion !== null && (
                  <p className="mt-1.5 text-[10px] font-bold text-primary">
                    {stage.conversion}% of previous stage
                  </p>
                )}
                {stage.href && (
                  <Link
                    href={stage.href}
                    className="mt-1.5 inline-block text-[10px] font-semibold text-primary hover:underline"
                  >
                    View records →
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

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
              <p className="mt-3 text-[10px] leading-snug text-muted-foreground">{metric.def}</p>
              {metric.href && (
                <Link
                  href={metric.href}
                  className="mt-1 inline-block text-[10px] font-semibold text-primary hover:underline"
                >
                  Reconcile with records →
                </Link>
              )}
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
                <CardTitle className="text-base">Mock tests by programme</CardTitle>
                <CardDescription className="text-xs">
                  Published test inventory — % = share of all {totalMockTests} tests (not attempts)
                </CardDescription>
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
                        className="bg-gradient-to-r from-primary to-[#0284c7] h-2 rounded-full transition-all"
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
                <CardDescription className="text-xs">
                  Accounts by role (all-time) · expert roles are accounts, not published profiles ({expertProfileCount} published)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {[
                { role: "Students", count: totalStudents, color: "bg-blue-500" },
                { role: "Animal Owners", count: totalAnimalOwners, color: "bg-amber-500" },
                { role: "Expert accounts", count: totalExperts, color: "bg-green-500" },
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
