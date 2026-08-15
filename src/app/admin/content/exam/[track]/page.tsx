import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { getSignedUrl } from "@/lib/blob";
import { getExamTrack } from "@/lib/exam-tracks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Brain, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExamContentPage({
  params,
}: {
  params: Promise<{ track: string }>;
}) {
  await requireAdmin();
  const { track } = await params;
  const trackInfo = getExamTrack(track);
  if (!trackInfo) notFound();

  const posts = await prisma.post.findMany({
    where: { category: "PREVIOUS_YEAR", exam: { in: trackInfo.examKeys } },
    orderBy: { createdAt: "desc" },
  });
  const postsWithLinks = await Promise.all(
    posts.map(async (p) => ({
      ...p,
      signedUrl: await getSignedUrl(p.fileUrl),
    }))
  );

  const mockTests = await prisma.mockTest.findMany({
    where: { exam: { in: trackInfo.examKeys } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/content">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{trackInfo.label}</h1>
          <p className="text-muted-foreground">
            Manage Previous Year Papers and Mock / Adaptive Tests for this exam
            track.
          </p>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Previous Year Papers
          </h2>
          <Link href="/admin/posts">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Paper
            </Button>
          </Link>
        </div>
        {postsWithLinks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No previous year papers yet. Use &quot;Add Paper&quot; (choose
            category &quot;Previous Year Papers&quot; and the matching exam).
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {postsWithLinks.map((p) => (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{p.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge variant="outline">{p.exam || "—"}</Badge>
                  {p.signedUrl && (
                    <a
                      href={p.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Download
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" /> Mock / Adaptive Tests
          </h2>
          <Link href="/admin/mock-tests">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Test
            </Button>
          </Link>
        </div>
        {mockTests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tests yet. Use &quot;Add Test&quot; and set the Exam field to this
            track&apos;s exam.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {mockTests.map((t) => (
              <Card key={t.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge variant="outline">
                    {t._count.questions} Qs
                  </Badge>
                  <Link
                    href={`/admin/mock-tests/${t.id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Edit
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
