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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of your platform</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>Latest registrations</CardDescription>
              </div>
              <Link href="/admin/users">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No users yet</p>
              ) : (
                recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={roleColor(user.role)}>
                        {user.role}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {timeAgo(user.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest mock test attempts</CardDescription>
              </div>
              <Link href="/admin/analytics">
                <Button variant="ghost" size="sm">
                  Analytics <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAttempts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>
              ) : (
                recentAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attempt.mockTest.title}</p>
                      <p className="text-xs text-muted-foreground">{attempt.user.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant={attempt.score >= attempt.totalMarks * 0.7 ? "default" : "destructive"}>
                        {attempt.totalMarks
                          ? Math.round((attempt.score / attempt.totalMarks) * 100)
                          : 0}%
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {timeAgo(attempt.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <Link href="/admin/users">
              <div className="p-4 border rounded-lg hover:bg-muted/50 text-center transition-colors cursor-pointer">
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium">Manage Users</p>
              </div>
            </Link>
            <Link href="/admin/content">
              <div className="p-4 border rounded-lg hover:bg-muted/50 text-center transition-colors cursor-pointer">
                <BookOpen className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-sm font-medium">Manage Content</p>
              </div>
            </Link>
            <Link href="/admin/analytics">
              <div className="p-4 border rounded-lg hover:bg-muted/50 text-center transition-colors cursor-pointer">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <p className="text-sm font-medium">View Analytics</p>
              </div>
            </Link>
            <Link href="/admin/settings">
              <div className="p-4 border rounded-lg hover:bg-muted/50 text-center transition-colors cursor-pointer">
                <Settings className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <p className="text-sm font-medium">Settings</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
