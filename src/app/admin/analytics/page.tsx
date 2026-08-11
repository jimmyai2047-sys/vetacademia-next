"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  Brain,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const metrics = [
  { title: "Total Users", value: "12,345", change: "+12%", trend: "up", icon: Users, color: "text-blue-600" },
  { title: "Active Students", value: "8,901", change: "+8%", trend: "up", icon: Users, color: "text-green-600" },
  { title: "Tests Completed", value: "45,678", change: "+23%", trend: "up", icon: Brain, color: "text-purple-600" },
  { title: "Avg. Score", value: "72%", change: "+5%", trend: "up", icon: TrendingUp, color: "text-orange-600" },
];

const popularSubjects = [
  { name: "Veterinary Anatomy", students: 2345, trend: "+15%" },
  { name: "Veterinary Physiology", students: 1987, trend: "+12%" },
  { name: "Veterinary Pharmacology", students: 1654, trend: "+8%" },
  { name: "Veterinary Pathology", students: 1432, trend: "+10%" },
  { name: "Veterinary Medicine", students: 1298, trend: "+6%" },
];

const programmeStats = [
  { name: "AHDP", students: 3456, percentage: 28 },
  { name: "B.V.Sc & A.H.", students: 4567, percentage: 37 },
  { name: "M.V.Sc", students: 2345, percentage: 19 },
  { name: "Ph.D", students: 1977, percentage: 16 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Platform performance metrics</p>
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
                  <div className="flex items-center gap-1 mt-1">
                    {metric.trend === "up" ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-xs ${metric.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                      {metric.change}
                    </span>
                    <span className="text-xs text-muted-foreground">vs last month</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <metric.icon className={`h-5 w-5 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Popular Subjects */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Subjects</CardTitle>
            <CardDescription>Most enrolled subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularSubjects.map((subject, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{subject.name}</p>
                      <p className="text-xs text-muted-foreground">{subject.students.toLocaleString()} students</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-green-600">
                    {subject.trend}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Programme Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Programme Distribution</CardTitle>
            <CardDescription>Students by programme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {programmeStats.map((prog, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{prog.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {prog.students.toLocaleString()} ({prog.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${prog.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>Monthly revenue trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Revenue chart coming soon</p>
              <p className="text-sm">Integrate with Chart.js for visual analytics</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
