export const metadata = {
  title: "VetAcademia | Course Content",
  description: "Detailed course content, theory, and practicals on VetAcademia.",
};

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, ChevronRight, ClipboardList, Clock } from "lucide-react";
import ChapterResources from "@/components/chapter-resources";
import ProtectedHtml from "@/components/protected-html";
import { isHtmlContent } from "@/lib/content";
import { prepareChapterHtml } from "@/lib/chapter-images";
import { getSignedUrl } from "@/lib/blob";
import { getSubjectImage } from "@/lib/subject-images";
import { getCourseImage } from "@/lib/course-images";
import { getAccess } from "@/lib/access";
import { programmeNameToSlug } from "@/lib/programme";
import { chapterTitleWithoutNumber, matchChapterMockTests } from "@/lib/chapter-mock-tests";
import EnrollCta from "@/components/enroll-cta";
import CurriculumSidebar from "@/components/curriculum-sidebar";
import { getCurriculumSidebar } from "@/lib/curriculum-sidebar";



export default async function CoursePage({
  params,
}: {
  params: Promise<{ programme: string; subject: string; course: string }>;
}) {
  const { programme: progSlug, subject: subjectId, course: courseId } = await params;

  const course = await unstable_cache(
    () =>
      prisma.chapter.findFirst({
        where: { id: courseId },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              year: true,
              programme: { select: { id: true, name: true } },
            },
          },
          chapterContents: { orderBy: { createdAt: "desc" } },
          sections: { orderBy: { order: "asc" }, select: { id: true, title: true, order: true } },
        },
      }),
    ["syllabus-course", courseId],
    { revalidate: 120 }
  )();

  if (!course) notFound();

  if (course.subject.id !== subjectId) notFound();

  if (programmeNameToSlug(course.subject.programme.name) !== progSlug) notFound();

  const access = await getAccess();
  const programmeOwned = access.programmeSlugs.has(progSlug);
  const yearOwned =
    (progSlug === "bvsc" || progSlug === "ahdp") && course.subject.year
      ? access.ownedYearScopes.has(`${progSlug}:${course.subject.year}`)
      : false;
  const subjectOwned = access.ownedSubjectIds.has(course.subject.id);
  const hasAccess = course.isDemo || programmeOwned || yearOwned || subjectOwned || access.isAdmin;

  let purchasePlanSlug: string = progSlug;
  let purchaseViaCheckout = false;
  if (!hasAccess) {
    if (progSlug === "bvsc" || progSlug === "ahdp") {
      if (course.subject.year) {
        const yearPlan = await prisma.plan.findFirst({
          where: { programmeSlug: progSlug, year: course.subject.year },
          select: { slug: true },
        });
        if (yearPlan) {
          purchasePlanSlug = yearPlan.slug;
          purchaseViaCheckout = true;
        }
      }
    } else if (progSlug === "mvsc" || progSlug === "phd") {
      const subjPlan = await prisma.plan.findFirst({
        where: { subjectId: course.subject.id },
        select: { slug: true },
      });
      if (subjPlan) {
        purchasePlanSlug = subjPlan.slug;
        purchaseViaCheckout = true;
      }
    }
  }

  const courseCode = course.courseCode;
  const mockTests =
    hasAccess && courseCode
      ? await unstable_cache(
          () =>
            prisma.mockTest.findMany({
              where: { subjectId: course.subject.id, title: { startsWith: courseCode } },
              select: { id: true, title: true, duration: true, totalMarks: true },
              orderBy: { title: "asc" },
            }),
          ["syllabus-mock-tests", course.id],
          { revalidate: 120 }
        )()
      : [];

  // Mock test for each chapter (section), so it can be rendered at the end of
  // that chapter's row instead of only in the grouped card below.
  const sectionTitles = (course.sections ?? []).map((s) => s.title);
  const mockBySection = matchChapterMockTests(mockTests, sectionTitles);

  const signedContents = await Promise.all(
    course.chapterContents.map(async (c) => ({
      ...c,
      url: await getSignedUrl(c.url),
    }))
  );

  const courseHtml = await prepareChapterHtml(course.content);

  // Sections (lectures) for the Theory plate (Phase I — theory only).
  // Practical plates are intentionally NOT rendered until Phase II, when
  // practical content is supplied per programme/subject/course on command.
  // readerIndex is the position in the full ordered list, which is what
  // /reader/[chapterId]/[index] expects.
  const theorySections = (course.sections ?? []).map((s, idx) => ({ ...s, readerIndex: idx }));

  // Hierarchical curriculum sidebar — programme → subjects → chapters
  // (this course's lectures are attached as the active chapter's sections).
  const curriculum = await getCurriculumSidebar({
    programmeId: course.subject.programme.id,
    programmeSlug: progSlug,
    activeSubjectId: course.subject.id,
    activeChapterId: course.id,
  });

  // Parse creditHours "X+Y" — only the Theory (X) part is shown in Phase I.
  let theoryCredits = 0;
  if (course.creditHours && course.creditHours.includes("+")) {
    theoryCredits = parseInt(course.creditHours.split("+")[0], 10) || 0;
  } else if (course.creditHours) {
    theoryCredits = parseInt(course.creditHours, 10) || 0;
  }

  return (
    <div className="min-h-screen flex">
      <CurriculumSidebar
        data={curriculum}
        activeSubjectId={course.subject.id}
        activeChapterId={course.id}
      />
      <div className="flex-1 min-w-0">
      <div className="container mx-auto px-4 py-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
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

        {/* Hero banner */}
        <div className="relative h-32 w-full overflow-hidden rounded-[1.5rem] border border-primary/10 shadow-xl mb-4">
          <Image
            src={getCourseImage(course.courseCode, course.title) ?? getSubjectImage(course.subject.name)}
            alt={course.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c4a6e]/80 via-black/30 to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-80" />
        </div>

        {/* Header */}
        <div className="mb-5">
        <Link
          href={`/syllabus/${progSlug}/${subjectId}`}
          className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-primary hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {course.subject.name}
        </Link>
        <h1 className="text-3xl font-bold mb-2 tracking-tight">{course.title}</h1>
        <div className="h-1 w-16 rounded-full bg-gradient-to-r from-primary to-[#d4a843]" />
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          {course.courseCode && (
            <Badge variant="secondary" className="font-mono">{course.courseCode}</Badge>
          )}
          {course.isDemo && (
            <Badge className="bg-emerald-600 hover:bg-emerald-600">Free Preview</Badge>
          )}
          {course.creditHours && (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            {course.creditHours} Credits
          </Badge>
          )}
        </div>
      </div>

      {/* Theory only (Phase I) — no Practical plate until Phase II on command */}
      {hasAccess ? (
      <div className="grid gap-6">
        {theoryCredits === 0 && (
          <p>Content coming soon</p>
        )}
        {theoryCredits > 0 && (
          <Card className="va-card-hover rounded-[1.5rem] border-primary/10 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-70" />
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
                  <ProtectedHtml html={courseHtml} />
                ) : (
                  <p className="text-sm text-muted-foreground">{course.content}</p>
                )
              ) : (
                <p className="text-sm text-muted-foreground italic">Theory content coming soon...</p>
              )}
              {/* Theory plate — Unit I lectures (Chapters 1-9) */}
              {theorySections.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Theory Lectures ({theorySections.length})
                    </p>
                    <Link
                      href={`/reader/${course.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Open all in Reader
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {theorySections.map((s) => {
                      const mock = mockBySection[s.readerIndex] ?? null;
                      return (
                        <div
                          key={s.id}
                          className="rounded-xl border border-border bg-background overflow-hidden"
                        >
                          <Link
                            href={`/reader/${course.id}/${s.readerIndex}`}
                            className="flex items-center gap-3 p-3 hover:bg-accent transition-all group"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#0c4a6e] text-white text-xs font-bold shrink-0 group-hover:scale-105 transition-transform">
                              {s.readerIndex + 1}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold group-hover:text-primary">
                                {s.title}
                              </span>
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                          </Link>
                          {mock && (
                            <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-muted/30 px-3 py-2">
                              <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <ClipboardList className="h-3.5 w-3.5 text-emerald-600" />
                                Mock Test &middot; {mock.totalMarks ?? 20} MCQs &middot;{" "}
                                {mock.duration ?? 20} min
                              </span>
                              <Link
                                href={`/mock-tests/${mock.id}`}
                                className="text-xs font-semibold text-primary hover:underline shrink-0"
                              >
                                Start Test &rarr;
                              </Link>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <ChapterResources contents={signedContents} />
            </CardContent>
          </Card>
        )}

        {/* Chapter Mock Tests — one 20-MCQ test per chapter (same enrolment gating) */}
        {mockTests.length > 0 && (
          <Card className="va-card-hover rounded-[1.5rem] border-primary/10 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-70" />
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Chapter Mock Tests</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {mockTests.length} tests &middot; 20 MCQs each &middot; timed practice
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {mockTests.map((t, idx) => {
                  const matchedIdx = mockBySection.findIndex((m) => m?.id === t.id);
                  const chapterNo =
                    (t.title.match(/Ch-(\d+)/i)?.[1]?.replace(/^0+/, "") ||
                      (matchedIdx >= 0 ? String(matchedIdx + 1) : String(idx + 1)));
                  const display =
                    matchedIdx >= 0 && sectionTitles[matchedIdx]
                      ? chapterTitleWithoutNumber(sectionTitles[matchedIdx])
                      : t.title
                          .replace(
                            new RegExp(
                              `^${(courseCode ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*Ch-\\d+:\\s*`,
                              "i"
                            ),
                            ""
                          )
                          .replace(/\s*-\s*Mock Test\s*\(\d+\s*MCQs\)\s*$/i, "");
                  return (
                    <Link
                      key={t.id}
                      href={`/mock-tests/${t.id}`}
                      className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 hover:bg-accent hover:border-primary/40 transition-all group"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#0c4a6e] text-white text-xs font-bold shrink-0 group-hover:scale-105 transition-transform">
                        {chapterNo}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold group-hover:text-primary">
                          {display}
                        </span>
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          {t.totalMarks} marks &middot; {t.duration} min
                        </span>
                      </span>
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      ) : (
        <EnrollCta
          planSlug={purchasePlanSlug}
          title="Enroll to access this course"
          message="Enroll in this programme to unlock the full course content and resources."
          to={purchaseViaCheckout ? "checkout" : "pricing"}
        />
      )}
      </div>
      </div>
    </div>
  );
}

