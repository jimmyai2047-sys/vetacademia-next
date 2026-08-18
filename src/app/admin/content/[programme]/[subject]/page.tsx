import Link from "next/link";
import { notFound } from "next/navigation";
import { getSignedUrl } from "@/lib/blob";
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
import ChapterRichEditor from "@/components/admin/chapter-rich-editor";
import ChapterBulkImporter from "@/components/admin/chapter-bulk-importer";
import ChapterTitleEditor from "@/components/admin/chapter-title-editor";
import AddChapterButton from "@/components/admin/add-chapter-button";

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

  const signedMap = new Map<string, (typeof subject.chapters)[number]["chapterContents"] & { downloadUrl?: string }[]>();
  await Promise.all(
    subject.chapters.map(async (ch) => {
      signedMap.set(
        ch.id,
        await Promise.all(
          ch.chapterContents.map(async (c) => ({
            ...c,
            downloadUrl: await getSignedUrl(c.url),
          }))
        )
      );
    })
  );

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

      <div className="flex items-center gap-3">
        <ChapterBulkImporter subjectId={subject.id} />
        <AddChapterButton subjectId={subject.id} />
      </div>

      {hasCourses ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> Courses (
            {subject.chapters.length})
          </h2>
          {subject.chapters.map((course) => (
            <div key={course.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono">
                  {course.courseCode}
                </Badge>
                <ChapterTitleEditor
                  chapterId={course.id}
                  initialTitle={course.title}
                />
              </div>
              <ChapterRichEditor
                chapterId={course.id}
                initialContent={course.content}
              />
              <ChapterContentManager
                chapterId={course.id}
                chapterTitle={course.title}
                  initialContents={signedMap.get(course.id) ?? []}
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
                <div key={`title-${ch.id}`} className="rounded-lg border p-4 space-y-3">
                  <ChapterTitleEditor
                    chapterId={ch.id}
                    initialTitle={ch.title}
                    unitNumber={ch.unitNumber}
                  />
                <ChapterRichEditor
                  chapterId={ch.id}
                  initialContent={ch.content}
                />
                <ChapterContentManager
                  chapterId={ch.id}
                  chapterTitle={`${ch.unitNumber ? `Unit ${ch.unitNumber}: ` : ""}${ch.title}`}
                  initialContents={signedMap.get(ch.id) ?? []}
                />
                </div>
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
                <div key={`title-${ch.id}`} className="rounded-lg border p-4 space-y-3">
                  <ChapterTitleEditor
                    chapterId={ch.id}
                    initialTitle={ch.title}
                    unitNumber={ch.unitNumber}
                  />
                <ChapterRichEditor
                  chapterId={ch.id}
                  initialContent={ch.content}
                />
                <ChapterContentManager
                  chapterId={ch.id}
                  chapterTitle={`${ch.unitNumber ? `Unit ${ch.unitNumber}: ` : ""}${ch.title}`}
                  initialContents={signedMap.get(ch.id) ?? []}
                />
                </div>
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
