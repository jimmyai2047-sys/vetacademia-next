export const metadata = {
  title: "VetAcademia | Admin Dashboard",
};

import { prisma } from "@/lib/prisma";
import { roleColor } from "@/lib/role-color";
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
  Settings,
  ArrowRight,
  Activity,
  GraduationCap,
  Sparkles,
  Crown,
  Shield,
} from "lucide-react";



export const dynamic = "force-dynamic";

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default async function AdminDashboard() {
  const [totalUsers, totalProgrammes, totalSubjects, totalMockTests, recentUsers, recentAttempts] =
    await Promise.all([
      prisma.user.count(),
      prisma.programme.count(),
      prisma.subject.count(),
      prisma.mockTest.count(),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          programme: true,
          createdAt: true,
        },
      }),
      prisma.mockTestAttempt.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          user: { select: { name: true } },
          mockTest: { select: { title: true } },
        },
      }),
    ]);

  const statCards = [
    { title: "Total Users", value: totalUsers.toLocaleString(), icon: Users, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
    { title: "Programmes", value: totalProgrammes.toString(), icon: GraduationCap, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
    { title: "Subjects", value: totalSubjects.toString(), icon: BookOpen, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
    { title: "Mock Tests", value: totalMockTests.toString(), icon: Brain, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30" },
  ];

  return (
    <div className="space-y-6">
      {/* Royal Header */}
      <div className="relative overflow-hidden rounded-[1.5rem] border border-primary/10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#003d2e] via-primary to-[#005f48]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-[#d4a843]/15 blur-3xl" />
        <div className="relative px-6 py-7 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1 text-xs font-bold tracking-widest uppercase">
              <Crown className="h-3.5 w-3.5 text-[#d4a843]" /> Royal Admin Dashboard
            </div>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="mt-1 text-white/70 flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#d4a843]" /> Secure • Overview of your platform • Live
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2 text-center">
              <p className="text-xs text-white/60 uppercase tracking-widest">Total Users</p>
              <p className="text-xl font-bold">{totalUsers.toLocaleString()}</p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a843] text-[#003d2e] shadow-lg">
              <Sparkles className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Royal */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="va-card-hover group relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white p-0 shadow-sm hover:shadow-lg">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground/70">{stat.title}</p>
                  <p className="mt-1 text-2xl font-extrabold tracking-tight">{stat.value}</p>
                  <div className="mt-2 h-1 w-8 rounded-full bg-primary/20 group-hover:w-12 group-hover:bg-primary transition-all" />
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl border shadow-sm ${stat.bg} group-hover:scale-105 transition-transform`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users - Royal */}
        <Card className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-primary to-emerald-500" />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
                  <Users className="h-4 w-4" />
                </span>
                <div>
                  <CardTitle className="text-base">Recent Users</CardTitle>
                  <CardDescription className="text-xs">Latest registrations • Live</CardDescription>
                </div>
              </div>
              <Link href="/admin/users">
                <Button variant="outline" size="sm" className="rounded-full border-primary/10 hover:bg-primary hover:text-white hover:border-primary gap-1">
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {recentUsers.length === 0 ? (
                <div className="text-center py-10 rounded-xl border border-dashed border-primary/10 bg-muted/20">
                  <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No users yet</p>
                </div>
              ) : (
                recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="group flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-primary/10 hover:bg-gradient-to-r hover:from-primary/[0.04] hover:to-blue-50/30 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#005f48] text-white font-bold text-sm shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                        <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm group-hover:text-primary transition-colors">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`${roleColor(user.role)} shadow-sm`}>{user.role}</Badge>
                      <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-end gap-1">
                        <span className="h-1 w-1 rounded-full bg-emerald-500" /> {timeAgo(user.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity - Royal */}
        <Card className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-primary to-amber-500" />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 text-white shadow-md">
                  <Activity className="h-4 w-4" />
                </span>
                <div>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                  <CardDescription className="text-xs">Latest mock test attempts</CardDescription>
                </div>
              </div>
              <Link href="/admin/analytics">
                <Button variant="outline" size="sm" className="rounded-full border-primary/10 hover:bg-primary hover:text-white hover:border-primary gap-1">
                  Analytics <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {recentAttempts.length === 0 ? (
                <div className="text-center py-10 rounded-xl border border-dashed border-primary/10 bg-muted/20">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No activity yet</p>
                </div>
              ) : (
                recentAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="group flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-primary/10 hover:bg-gradient-to-r hover:from-purple-50/40 hover:to-blue-50/20 hover:shadow-sm transition-all"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/10 text-primary group-hover:from-primary group-hover:to-[#005f48] group-hover:text-white transition-all">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{attempt.mockTest.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {attempt.user.name}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge className={attempt.score >= attempt.totalMarks * 0.7 ? "bg-emerald-500 hover:bg-emerald-600 shadow-sm" : "bg-amber-500 hover:bg-amber-600 shadow-sm"}>
                        {attempt.totalMarks ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0}%
                      </Badge>
                      <p className="text-[11px] text-muted-foreground mt-1">{timeAgo(attempt.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Royal */}
      <Card className="relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-gradient-to-br from-white via-primary/[0.02] to-blue-50/20 shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a843] to-amber-600 text-white shadow-md">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <CardDescription className="text-xs">Royal admin shortcuts • One click</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { href: "/admin/users", label: "Manage Users", icon: Users, grad: "from-blue-600 to-indigo-600", bg: "from-blue-50 to-indigo-50" },
              { href: "/admin/content", label: "Manage Content", icon: BookOpen, grad: "from-emerald-600 to-teal-600", bg: "from-emerald-50 to-teal-50" },
              { href: "/admin/analytics", label: "View Analytics", icon: TrendingUp, grad: "from-purple-600 to-violet-600", bg: "from-purple-50 to-violet-50" },
              { href: "/admin/settings", label: "Settings", icon: Settings, grad: "from-amber-600 to-orange-600", bg: "from-amber-50 to-orange-50" },
            ].map((a) => (
              <Link key={a.href} href={a.href} className="group">
                <div className={`relative overflow-hidden p-5 rounded-xl border border-primary/5 bg-gradient-to-br ${a.bg} hover:border-primary/15 hover:shadow-md transition-all text-center`}>
                  <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${a.grad} text-white shadow-md group-hover:scale-105 transition-transform`}>
                    <a.icon className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-bold group-hover:text-primary transition-colors">{a.label}</p>
                  <div className="mx-auto mt-2 h-1 w-6 rounded-full bg-primary/20 group-hover:w-10 group-hover:bg-primary transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
