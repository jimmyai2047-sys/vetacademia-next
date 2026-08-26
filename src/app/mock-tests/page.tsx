export const metadata = {
  title: "VetAcademia | Mock Tests",
  description: "Practice mock tests with performance analytics on VetAcademia.",
};

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSignedUrl } from "@/lib/blob";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Clock, FileText, Download, Sparkles, Trophy } from "lucide-react";
import BookmarkButton from "@/components/bookmark-button";
import { DecorativePageHeader } from "@/components/decorative/page-header";

export const dynamic = "force-dynamic";

export default async function MockTestsPage() {
  const tests = await prisma.mockTest.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true } } },
  });

  const testsWithLinks = await Promise.all(
    tests.map(async (t) => ({
      ...t,
      signedUrl: await getSignedUrl(t.fileUrl),
    }))
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <DecorativePageHeader
        badge="Mock Tests"
        title="Mock"
        titleHighlight="Tests"
        description="Practice with online mock tests, adaptive quizzes and track your progress — decorative analytics, real exam simulation."
        variant="primary"
      />

      {tests.length === 0 ? (
        <div className="mt-8 va-card-hover rounded-[1.5rem] border border-primary/5 bg-white shadow-sm p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-3">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground">
            No mock tests available yet. Add them from the admin panel.
          </p>
          <div className="va-divider-dots my-4 mx-auto max-w-[120px]"><span /></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {testsWithLinks.map((test) => (
            <Card key={test.id} className="va-card-hover group relative flex flex-col overflow-hidden rounded-[1.5rem] border-primary/5 shadow-sm hover:shadow-xl bg-white">
              <div className="h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center shrink-0 border border-primary/5 group-hover:scale-105 transition-transform">
                      <Trophy className="h-5 w-5 text-primary" />
                    </span>
                    <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">{test.title}</CardTitle>
                  </div>
                  <BookmarkButton
                    type="mocktest"
                    refId={test.id}
                    title={test.title}
                    url={`/mock-tests/${test.id}`}
                    variant="icon"
                  />
                </div>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <Sparkles className="h-3 w-3 text-[#d4a843]" /> {test.description || "Mock test"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 mt-auto">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 border border-primary/5">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-medium">{test.duration} min</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 border border-primary/5">
                    <Brain className="h-4 w-4 text-primary" />
                    <span className="font-medium">{test._count.questions} Qs</span>
                  </div>
                </div>

                {test.signedUrl && (
                  <a
                    href={test.signedUrl}
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
                  <Button className="w-full rounded-xl bg-gradient-to-r from-primary to-[#005f48] shadow-sm hover:shadow-md" disabled={test._count.questions === 0}>
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
