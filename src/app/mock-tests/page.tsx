import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDownloadUrl } from "@vercel/blob";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Clock, FileText, Download } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MockTestsPage() {
  const tests = await prisma.mockTest.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true } } },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mock Tests</h1>
        <p className="text-muted-foreground">
          Practice with online mock tests and track your progress
        </p>
      </div>

      {tests.length === 0 ? (
        <p className="text-muted-foreground">
          No mock tests available yet. Add them from the admin panel.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <Card key={test.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{test.title}</CardTitle>
                <CardDescription>{test.description || "Mock test"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{test.duration} min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-muted-foreground" />
                    <span>{test._count.questions} Qs</span>
                  </div>
                </div>

                {test.fileUrl && (
                  <a
                    href={getDownloadUrl(test.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-primary hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    {test.fileName || "Practice set"}
                    <Download className="h-3 w-3" />
                  </a>
                )}

                <Link href={`/mock-tests/${test.id}`} className="w-full block">
                  <Button className="w-full" disabled={test._count.questions === 0}>
                    {test._count.questions === 0 ? "No Questions" : "Start Test"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
