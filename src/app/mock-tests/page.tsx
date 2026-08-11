import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Clock, Target, TrendingUp } from "lucide-react";

const mockTests = [
  {
    id: "anatomy-basic",
    title: "Veterinary Anatomy - Basic",
    subject: "Veterinary Anatomy",
    programme: "B.V.Sc & A.H.",
    duration: 30,
    totalQuestions: 50,
    totalMarks: 50,
    difficulty: "Easy",
    attempts: 1234,
    avgScore: 72,
  },
  {
    id: "physiology-basic",
    title: "Veterinary Physiology - Basic",
    subject: "Veterinary Physiology",
    programme: "B.V.Sc & A.H.",
    duration: 30,
    totalQuestions: 50,
    totalMarks: 50,
    difficulty: "Easy",
    attempts: 987,
    avgScore: 68,
  },
  {
    id: "anatomy-advanced",
    title: "Veterinary Anatomy - Advanced",
    subject: "Veterinary Anatomy",
    programme: "B.V.Sc & A.H.",
    duration: 60,
    totalQuestions: 100,
    totalMarks: 100,
    difficulty: "Medium",
    attempts: 654,
    avgScore: 65,
  },
  {
    id: "pharmacology-basic",
    title: "Veterinary Pharmacology - Basic",
    subject: "Veterinary Pharmacology",
    programme: "B.V.Sc & A.H.",
    duration: 45,
    totalQuestions: 75,
    totalMarks: 75,
    difficulty: "Medium",
    attempts: 543,
    avgScore: 62,
  },
  {
    id: "pathology-basic",
    title: "Veterinary Pathology - Basic",
    subject: "Veterinary Pathology",
    programme: "B.V.Sc & A.H.",
    duration: 45,
    totalQuestions: 75,
    totalMarks: 75,
    difficulty: "Medium",
    attempts: 432,
    avgScore: 60,
  },
  {
    id: "surgery-basic",
    title: "Veterinary Surgery - Basic",
    subject: "Veterinary Surgery",
    programme: "B.V.Sc & A.H.",
    duration: 60,
    totalQuestions: 100,
    totalMarks: 100,
    difficulty: "Hard",
    attempts: 321,
    avgScore: 55,
  },
];

const stats = [
  { icon: Brain, label: "Total Tests", value: "50+" },
  { icon: Target, label: "Questions", value: "5000+" },
  { icon: TrendingUp, label: "Avg Score", value: "65%" },
  { icon: Clock, label: "Practice Hours", value: "200+" },
];

export default function MockTestsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mock Tests</h1>
        <p className="text-muted-foreground">
          Practice with adaptive mock tests and track your progress
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-primary" />
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

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button variant="default" size="sm">All</Button>
        <Button variant="outline" size="sm">Anatomy</Button>
        <Button variant="outline" size="sm">Physiology</Button>
        <Button variant="outline" size="sm">Pharmacology</Button>
        <Button variant="outline" size="sm">Pathology</Button>
        <Button variant="outline" size="sm">Surgery</Button>
        <Button variant="outline" size="sm">Medicine</Button>
      </div>

      {/* Tests Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockTests.map((test) => (
          <Card key={test.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{test.title}</CardTitle>
                <Badge
                  variant={
                    test.difficulty === "Easy"
                      ? "default"
                      : test.difficulty === "Medium"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {test.difficulty}
                </Badge>
              </div>
              <CardDescription>{test.subject}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{test.duration} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span>{test.totalQuestions} Qs</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span>Avg: {test.avgScore}%</span>
                </div>
                <div className="text-muted-foreground">
                  {test.attempts.toLocaleString()} attempts
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`/mock-tests/${test.id}`} className="w-full">
                <Button className="w-full">Start Test</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 text-center">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-2">Want more practice?</h3>
            <p className="opacity-90 mb-4">
              Upgrade to Premium for unlimited access to all mock tests and detailed analytics
            </p>
            <Button variant="secondary" size="lg">
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
