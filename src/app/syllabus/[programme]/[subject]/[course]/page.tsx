import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, FlaskConical, Clock } from "lucide-react";
import ChapterResources from "@/components/chapter-resources";
import ProtectedHtml from "@/components/protected-html";
import { isHtmlContent, sanitizeChapterContent } from "@/lib/content";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ programme: string; subject: string; course: string }>;
}) {
  const { programme: progSlug, subject: subjectId, course: courseId } = await params;

  const course = await prisma.chapter.findFirst({
    where: { id: courseId },
    include: {
      subject: {
        select: {
          name: true,
          programme: { select: { name: true } },
        },
      },
      chapterContents: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!course) notFound();

  // Parse creditHours "X+Y" into Theory + Practical
  let theoryCredits = 0;
  let practicalCredits = 0;
  if (course.creditHours && course.creditHours.includes("+")) {
    const parts = course.creditHours.split("+");
    theoryCredits = parseInt(parts[0], 10) || 0;
    practicalCredits = parseInt(parts[1], 10) || 0;
  } else if (course.creditHours) {
    theoryCredits = parseInt(course.creditHours, 10) || 0;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/syllabus" className="hover:text-primary">Syllabus</Link>
        <span>/</span>
        <Link href={`/syllabus/${progSlug}`} className="hover:text-primary">
          {course.subject.programme.name}
        </Link>
        <span>/</span>
        <Link href={`/syllabus/${progSlug}/${subjectId}`} className="hover:text-primary">
          {course.subject.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">{course.courseCode}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/syllabus/${progSlug}/${subjectId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {course.subject.name}
        </Link>
        <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          {course.courseCode && (
            <Badge variant="secondary" className="font-mono">{course.courseCode}</Badge>
          )}
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            {course.creditHours} Credits
          </Badge>
        </div>
      </div>

      {/* Theory / Practical split */}
      <div className="grid md:grid-cols-2 gap-6">
        {theoryCredits > 0 && (
          <Card className="border-blue-200">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Theory</CardTitle>
                <p className="text-sm text-muted-foreground">{theoryCredits} Credits</p>
              </div>
            </CardHeader>
            <CardContent>
              {course.content && !course.content.startsWith("Credit Hours:") ? (
                isHtmlContent(course.content) ? (
                  <ProtectedHtml html={sanitizeChapterContent(course.content)} />
                ) : (
                  <p className="text-sm text-muted-foreground">{course.content}</p>
                )
              ) : (
                <p className="text-sm text-muted-foreground italic">Theory content coming soon...</p>
              )}
              <ChapterResources contents={course.chapterContents} />
            </CardContent>
          </Card>
        )}

        {practicalCredits > 0 && (
          <Card className="border-emerald-200">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <FlaskConical className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Practical</CardTitle>
                <p className="text-sm text-muted-foreground">{practicalCredits} Credits</p>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground italic">Practical content coming soon...</p>
              <ChapterResources contents={course.chapterContents} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
