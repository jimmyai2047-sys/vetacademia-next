import Link from "next/link";
import { notFound } from "next/navigation";
import { getDownloadUrl } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BookOpen,
  FlaskConical,
  Layers,
} from "lucide-react";
import ChapterContentManager from "@/components/admin/chapter-content-manager";
import ChapterTextEditor from "@/components/admin/chapter-text-editor";

export const dynamic = "force-dynamic";

export default async function SubjectContentPage({
  params,
}: {
  params: Promise<{ programme: string; subject: string }>;
}) {
  await requireAdmin();
  const { programme: slug, subject: subjectId } = await params;

  const subject = await prisma.subject.findFirst({
    where: { id: subjectId },
    include: {
      programme: { select: { name: true, fullName: true } },
      chapters: {
        orderBy: { unitNumber: "asc" },
        include: { chapterContents: { orderBy: { createdAt: "desc" } } },
      },
    },
  });

  if (!subject) notFound();

  const hasCourses = subject.chapters.some((c) => c.courseCode);

  const theoryChapters = subject.chapters.filter((c) => c.type !== "PRACTICAL");
  const practicalChapters = subject.chapters.filter((c) => c.type === "PRACTICAL");

  const toItems = (
    contents: (typeof subject.chapters)[number]["chapterContents"]
  ) => contents.map((c) => ({ ...c, downloadUrl: getDownloadUrl(c.url) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/content/${slug}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{subject.name}</h1>
          <p className="text-muted-foreground">
            {subject.programme.name} &middot; Manage chapter files
          </p>
        </div>
      </div>

      {hasCourses ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> Courses (
            {subject.chapters.length})
          </h2>
          {subject.chapters.map((course) => (
            <div key={course.id}>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="font-mono">
                  {course.courseCode}
                </Badge>
                <span className="text-sm font-medium">{course.title}</span>
              </div>
              <ChapterTextEditor
                chapterId={course.id}
                initialText={course.content}
              />
              <ChapterContentManager
                chapterId={course.id}
                chapterTitle={course.title}
                initialContents={toItems(course.chapterContents)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <BookOpen className="h-5 w-5 text-blue-600" /> Theory (
              {theoryChapters.length})
            </h2>
            <div className="space-y-3">
              {theoryChapters.map((ch) => (<>

                <ChapterTextEditor
                  key={`txt-${ch.id}`}
                  chapterId={ch.id}
                  initialText={ch.content}
                />
                <ChapterContentManager
                  key={ch.id}
                  chapterId={ch.id}
                  chapterTitle={`${ch.unitNumber ? `Unit ${ch.unitNumber}: ` : ""}${ch.title}`}
                  initialContents={toItems(ch.chapterContents)}
                />
              </>))}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <FlaskConical className="h-5 w-5 text-emerald-600" /> Practical (
              {practicalChapters.length})
            </h2>
            <div className="space-y-3">
              {practicalChapters.map((ch) => (<>

                <ChapterTextEditor
                  key={`txt-${ch.id}`}
                  chapterId={ch.id}
                  initialText={ch.content}
                />
                <ChapterContentManager
                  key={ch.id}
                  chapterId={ch.id}
                  chapterTitle={`${ch.unitNumber ? `Unit ${ch.unitNumber}: ` : ""}${ch.title}`}
                  initialContents={toItems(ch.chapterContents)}
                />
              </>))}
            </div>
          </div>
        </div>
      )}

      {subject.chapters.length === 0 && (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          No chapters found for this subject.
        </div>
      )}
    </div>
  );
}
