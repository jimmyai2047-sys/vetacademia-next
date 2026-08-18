export const metadata = {
  title: "VetAcademia | Subject Syllabus",
  description: "Chapters, notes, and resources for this veterinary subject on VetAcademia.",
};

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, BookOpen, FileText, Clock, Hash, Timer, FlaskConical, BookMarked } from "lucide-react";
import ChapterResources from "@/components/chapter-resources";
import ProtectedHtml from "@/components/protected-html";
import { isHtmlContent } from "@/lib/content";
import { prepareChapterHtml } from "@/lib/chapter-images";
import { getSignedUrl } from "@/lib/blob";
import { getAccess } from "@/lib/access";
import EnrollCta from "@/components/enroll-cta";



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
      chapters: {
        orderBy: { unitNumber: "asc" },
        include: { chapterContents: { orderBy: { createdAt: "desc" } } },
      },
    },
  });

  if (!subject) notFound();

  const access = await getAccess();
  const programmeOwned = access.programmeSlugs.has(progSlug);
  const yearOwned =
    (progSlug === "bvsc" || progSlug === "ahdp") && subject.year
      ? access.ownedYearScopes.has(`${progSlug}:${subject.year}`)
      : false;
  const subjectOwned = access.ownedSubjectIds.has(subject.id);
  const hasAccess = programmeOwned || yearOwned || subjectOwned;

  // Resolve the plan to purchase when locked.
  let purchasePlanSlug: string = progSlug;
  let purchaseViaCheckout = false;
  if (!hasAccess) {
    if (progSlug === "bvsc" || progSlug === "ahdp") {
      if (subject.year) {
        const plan = await prisma.plan.findFirst({
          where: { programmeSlug: progSlug, year: subject.year },
        });
        if (plan) {
          purchasePlanSlug = plan.slug;
          purchaseViaCheckout = true;
        }
      }
    } else if (progSlug === "mvsc" || progSlug === "phd") {
      const plan = await prisma.plan.findFirst({
        where: { subjectId: subject.id },
      });
      if (plan) {
        purchasePlanSlug = plan.slug;
        purchaseViaCheckout = true;
      }
    }
  }

  const hasCourses = subject.chapters.some((ch) => ch.courseCode);

  const groupByUnit = (chapters: typeof subject.chapters) =>
    chapters.reduce(
      (acc, chapter) => {
        const key = `Unit ${chapter.unitNumber}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(chapter);
        return acc;
      },
      {} as Record<string, typeof subject.chapters>
    );

  const theoryChapters = subject.chapters.filter((c) => c.type !== "PRACTICAL");
  const practicalChapters = subject.chapters.filter((c) => c.type === "PRACTICAL");

  // Pre-sign + sanitize chapter HTML (handles Blob-hosted images).
  const htmlMap = new Map<string, string>();
  await Promise.all(
    subject.chapters.map(async (ch) => {
      htmlMap.set(ch.id, await prepareChapterHtml(ch.content));
    })
  );

  const theoryGrouped = groupByUnit(theoryChapters);
  const practicalGrouped = groupByUnit(practicalChapters);

  const signedContents = new Map<string, (typeof subject.chapters)[number]["chapterContents"]>();
  await Promise.all(
    subject.chapters.map(async (ch) => {
      signedContents.set(
        ch.id,
        await Promise.all(
          ch.chapterContents.map(async (c) => ({
            ...c,
            url: await getSignedUrl(c.url),
          }))
        )
      );
    })
  );

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
              : `${theoryChapters.length} Theory + ${practicalChapters.length} Practical`
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
          {hasAccess ? (
            <>
              {hasCourses ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subject.chapters.map((course, index) => (
                <Link key={course.id} href={`/syllabus/${progSlug}/${subject.id}/${course.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer">
                    <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary/80 to-primary/60">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Hash className="h-10 w-10 text-white/30" />
                      </div>
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/20 text-white border-white/30 text-xs font-mono">
                          {course.courseCode}
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <Badge className="bg-white/20 text-white border-white/30 text-xs">
                          {course.creditHours} Credits
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <CardTitle className="text-sm group-hover:text-primary transition-colors leading-tight mb-2">
                        {course.title}
                      </CardTitle>
                      {course.content && !course.content.startsWith("Credit Hours:") && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {course.content}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {course.creditHours && course.creditHours.includes("+") && parseInt(course.creditHours.split("+")[0], 10) > 0 && (
                          <Badge variant="outline" className="text-[10px] gap-1 text-blue-600 border-blue-200">
                            <BookOpen className="h-3 w-3" /> Theory
                          </Badge>
                        )}
                        {course.creditHours && course.creditHours.includes("+") && parseInt(course.creditHours.split("+")[1], 10) > 0 && (
                          <Badge variant="outline" className="text-[10px] gap-1 text-emerald-600 border-emerald-200">
                            <FlaskConical className="h-3 w-3" /> Practical
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <>
              {/* Theory Section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold">Theory</h2>
                  <Badge variant="secondary">{theoryChapters.length}</Badge>
                </div>
                {Object.keys(theoryGrouped).length > 0 ? (
                  Object.entries(theoryGrouped).map(([unit, chapters]) => (
                    <div key={unit} className="border rounded-lg overflow-hidden mb-4">
                      <div className="bg-muted/50 px-6 py-3 border-b">
                        <h3 className="text-base font-semibold flex items-center gap-2">
                          <Badge variant="outline">{unit}</Badge>
                        </h3>
                      </div>
                      <Accordion className="px-6">
                        {chapters.map((chapter, index) => (
                          <AccordionItem key={chapter.id} value={chapter.id}>
                            <AccordionTrigger className="py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                  {index + 1}
                                </div>
                                <span className="text-left">{chapter.title}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-4">
                              {isHtmlContent(chapter.content) ? (
                                <div className="pl-10">
                                  <ProtectedHtml
                                    html={htmlMap.get(chapter.id) || ""}
                                  />
                                </div>
                              ) : chapter.content ? (
                                <div className="pl-10 text-muted-foreground whitespace-pre-wrap">
                                  {chapter.content}
                                </div>
                              ) : (
                                <div className="pl-10 text-muted-foreground italic">
                                  Content coming soon...
                                </div>
                              )}
                              <ChapterResources contents={signedContents.get(chapter.id) ?? []} />
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    Theory units coming soon
                  </div>
                )}
              </div>

              {/* Practical Section */}
              {practicalChapters.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <FlaskConical className="h-4 w-4 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold">Practical</h2>
                    <Badge variant="secondary">{practicalChapters.length}</Badge>
                  </div>
                  {Object.keys(practicalGrouped).length > 0 ? (
                    Object.entries(practicalGrouped).map(([unit, chapters]) => (
                      <div key={unit} className="border rounded-lg overflow-hidden mb-4">
                        <div className="bg-muted/50 px-6 py-3 border-b">
                          <h3 className="text-base font-semibold flex items-center gap-2">
                            <Badge variant="outline">{unit}</Badge>
                          </h3>
                        </div>
                        <Accordion className="px-6">
                          {chapters.map((chapter, index) => (
                            <AccordionItem key={chapter.id} value={chapter.id}>
                              <AccordionTrigger className="py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                    {index + 1}
                                  </div>
                                  <span className="text-left">{chapter.title}</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pb-4">
                                {isHtmlContent(chapter.content) ? (
                                  <div className="pl-10">
                                    <ProtectedHtml
                                      html={htmlMap.get(chapter.id) || ""}
                                    />
                                  </div>
                                ) : chapter.content ? (
                                  <div className="pl-10 text-muted-foreground whitespace-pre-wrap">
                                    {chapter.content}
                                  </div>
                                ) : (
                                  <div className="pl-10 text-muted-foreground italic">
                                    Content coming soon...
                                  </div>
                                )}
                                <ChapterResources contents={signedContents.get(chapter.id) ?? []} />
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                      Practical units coming soon
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {subject.chapters.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No courses available yet</p>
            </div>
          )}
          </>
          ) : (
            <EnrollCta
              planSlug={purchasePlanSlug}
              title={purchaseViaCheckout ? "Unlock this content" : "Enroll to access syllabus"}
              message={
                purchaseViaCheckout
                  ? `Buy ${
                      progSlug === "bvsc" || progSlug === "ahdp"
                        ? `${subject.programme.name} ${subject.year}`
                        : subject.name
                    } to unlock chapters, notes and study material.`
                  : `Enroll in ${subject.programme.name} to unlock chapters, notes and study material.`
              }
              to={purchaseViaCheckout ? "checkout" : "pricing"}
            />
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
