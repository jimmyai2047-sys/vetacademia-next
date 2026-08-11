"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Brain,
  Clock,
  TrendingUp,
  Target,
  Award,
  ArrowRight,
} from "lucide-react";

const recentActivity: Array<{ type: string; title: string; score?: number; progress?: number; date: string }> = [
  { type: "test", title: "Veterinary Anatomy - Basic", score: 85, date: "2 hours ago" },
  { type: "study", title: "Cardiovascular System", progress: 75, date: "5 hours ago" },
  { type: "test", title: "Veterinary Physiology - Basic", score: 72, date: "1 day ago" },
  { type: "study", title: "Digestive System", progress: 100, date: "2 days ago" },
];

const recommendedTests = [
  { id: "anatomy-advanced", title: "Veterinary Anatomy - Advanced", difficulty: "Medium" },
  { id: "pharmacology-basic", title: "Veterinary Pharmacology - Basic", difficulty: "Medium" },
  { id: "pathology-basic", title: "Veterinary Pathology - Basic", difficulty: "Medium" },
];

const enrolledProgrammes = [
  { name: "B.V.Sc & A.H.", progress: 45, subjects: 12 },
];

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, Student!</h1>
        <p className="text-muted-foreground">
          Track your progress and continue learning
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">12</div>
                <div className="text-xs text-muted-foreground">Subjects</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Brain className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">8</div>
                <div className="text-xs text-muted-foreground">Tests Taken</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">72%</div>
                <div className="text-xs text-muted-foreground">Avg Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Award className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">3</div>
                <div className="text-xs text-muted-foreground">Badges</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">My Progress</TabsTrigger>
          <TabsTrigger value="tests">Test History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Enrolled Programmes */}
            <Card>
              <CardHeader>
                <CardTitle>My Programmes</CardTitle>
                <CardDescription>Your enrolled programmes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {enrolledProgrammes.map((prog) => (
                  <div key={prog.name} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{prog.name}</h4>
                      <Badge variant="secondary">{prog.subjects} Subjects</Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${prog.progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {prog.progress}% Complete
                    </p>
                  </div>
                ))}
                <Link href="/syllabus">
                  <Button variant="outline" className="w-full">
                    Browse All Programmes
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recommended Tests */}
            <Card>
              <CardHeader>
                <CardTitle>Recommended Tests</CardTitle>
                <CardDescription>Based on your progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendedTests.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div>
                      <h4 className="font-medium text-sm">{test.title}</h4>
                      <Badge variant="outline" className="mt-1">
                        {test.difficulty}
                      </Badge>
                    </div>
                    <Link href={`/mock-tests/${test.id}`}>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
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
              <CardDescription>Your learning journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        activity.type === "test"
                          ? "bg-purple-100 dark:bg-purple-900/30"
                          : "bg-blue-100 dark:bg-blue-900/30"
                      }`}
                    >
                      {activity.type === "test" ? (
                        <Brain
                          className={`h-5 w-5 ${
                            activity.type === "test"
                              ? "text-purple-600 dark:text-purple-400"
                              : "text-blue-600 dark:text-blue-400"
                          }`}
                        />
                      ) : (
                        <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{activity.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {activity.date}
                      </p>
                    </div>
                    <div className="text-right">
                      {activity.type === "test" ? (
                        <Badge variant={(activity.score ?? 0) >= 70 ? "default" : "destructive"}>
                          {activity.score ?? 0}%
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {activity.progress}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Subject Progress</CardTitle>
              <CardDescription>Your progress across all subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Detailed progress tracking coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <CardTitle>Test History</CardTitle>
              <CardDescription>All your previous test attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Test history will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
