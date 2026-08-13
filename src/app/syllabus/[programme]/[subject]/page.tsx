import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, BookOpen, FileText, Clock, Hash, Timer } from "lucide-react";

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ programme: string; subject: string }>;
}) {
  const { programme: progSlug, subject: subjectId } = await params;

  const subject = await prisma.subject.findFirst({
    where: { id: subjectId },
    include: {
      programme: { select: { name: true, fullName: true } },
      chapters: { orderBy: { unitNumber: "asc" } },
    },
  });

  if (!subject) notFound();

  const groupedChapters = subject.chapters.reduce(
    (acc, chapter) => {
      const key = chapter.courseCode ? "Courses" : `Unit ${chapter.unitNumber}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(chapter);
      return acc;
    },
    {} as Record<string, typeof subject.chapters>
  );

  const unitCount = Object.keys(groupedChapters).length;
  const hasCourses = subject.chapters.some((ch) => ch.courseCode);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/syllabus" className="hover:text-primary">Syllabus</Link>
        <span>/</span>
        <Link href={`/syllabus/${progSlug}`} className="hover:text-primary">
          {subject.programme.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">{subject.name}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/syllabus/${progSlug}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {subject.programme.name}
        </Link>
        <h1 className="text-3xl font-bold mb-2">{subject.name}</h1>
        {subject.description && (
          <p className="text-muted-foreground max-w-3xl">{subject.description}</p>
        )}
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          {subject.code && (
            <Badge variant="secondary" className="gap-1">
              <BookOpen className="h-3 w-3" />
              {subject.code}
            </Badge>
          )}
          {subject.year && <Badge variant="secondary">{subject.year}</Badge>}
          {subject.semester && <Badge variant="outline">{subject.semester}</Badge>}
          {subject.paper && <Badge variant="outline">{subject.paper}</Badge>}
          <Badge variant="secondary" className="gap-1">
            <FileText className="h-3 w-3" />
            {hasCourses
              ? `${subject.chapters.length} ${subject.chapters.length === 1 ? "Course" : "Courses"}`
              : `${unitCount} ${unitCount === 1 ? "Unit" : "Units"}`
            }
          </Badge>
          {!hasCourses && (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              {subject.chapters.length} {subject.chapters.length === 1 ? "Chapter" : "Chapters"}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue="syllabus" className="space-y-6">
        <TabsList>
          <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
          <TabsTrigger value="materials">Study Materials</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="videos">Video Lessons</TabsTrigger>
        </TabsList>

        <TabsContent value="syllabus" className="space-y-6">
          {Object.entries(groupedChapters).map(([unit, chapters]) => (
            <div key={unit} className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-6 py-3 border-b">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Badge variant="outline">{unit}</Badge>
                </h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                {chapters.map((chapter, index) => (
                  <div key={chapter.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    {/* Course Name */}
                    <div className="font-semibold text-base mb-2">{chapter.title}</div>
                    {/* Course Code + Credit Hours */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {chapter.courseCode && (
                        <div className="flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5" />
                          <span>Course Code: <span className="font-medium text-foreground">{chapter.courseCode}</span></span>
                        </div>
                      )}
                      {chapter.creditHours && (
                        <div className="flex items-center gap-1.5">
                          <Timer className="h-3.5 w-3.5" />
                          <span>Credit Hours: <span className="font-medium text-foreground">{chapter.creditHours}</span></span>
                        </div>
                      )}
                    </div>
                    {/* Content if available */}
                    {chapter.content && !chapter.content.startsWith("Credit Hours:") && (
                      <div className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap border-t pt-3">
                        {chapter.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {subject.chapters.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No chapters available yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="materials">
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Study materials will be available soon</p>
          </div>
        </TabsContent>

        <TabsContent value="notes">
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Notes will be available soon</p>
          </div>
        </TabsContent>

        <TabsContent value="videos">
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Video lessons will be available soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
