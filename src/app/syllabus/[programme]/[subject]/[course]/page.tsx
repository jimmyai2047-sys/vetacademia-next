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
import { ArrowLeft, BookOpen, FlaskConical, Clock } from "lucide-react";
import ChapterResources from "@/components/chapter-resources";
import ProtectedHtml from "@/components/protected-html";
import { isHtmlContent } from "@/lib/content";
import { prepareChapterHtml } from "@/lib/chapter-images";
import { getSignedUrl } from "@/lib/blob";
import { getSubjectImage } from "@/lib/subject-images";
import { getAccess } from "@/lib/access";
import { programmeNameToSlug } from "@/lib/programme";
import EnrollCta from "@/components/enroll-cta";



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
              programme: { select: { name: true } },
            },
          },
          chapterContents: { orderBy: { createdAt: "desc" } },
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
  const hasAccess = programmeOwned || yearOwned || subjectOwned || access.isAdmin;

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

  const signedContents = await Promise.all(
    course.chapterContents.map(async (c) => ({
      ...c,
      url: await getSignedUrl(c.url),
    }))
  );

  const courseHtml = await prepareChapterHtml(course.content);

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
            src={getSubjectImage(course.subject.name)}
            alt={course.subject.name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#003d2e]/80 via-black/30 to-transparent" />
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
          {course.creditHours && (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            {course.creditHours} Credits
          </Badge>
          )}
        </div>
      </div>

      {/* Theory / Practical split */}
      {hasAccess ? (
      <div className="grid md:grid-cols-2 gap-6">
        {theoryCredits === 0 && practicalCredits === 0 && (
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
              <ChapterResources contents={signedContents} />
            </CardContent>
          </Card>
        )}

        {practicalCredits > 0 && (
          <Card className="va-card-hover rounded-[1.5rem] border-primary/10 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-[#d4a843] to-primary opacity-70" />
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
              {course.content && !course.content.startsWith("Credit Hours:") ? (
                isHtmlContent(course.content) ? (
                  <ProtectedHtml html={courseHtml} />
                ) : (
                  <p className="text-sm text-muted-foreground">{course.content}</p>
                )
              ) : (
                <p className="text-sm text-muted-foreground italic">Practical content coming soon...</p>
              )}
              <ChapterResources contents={signedContents} />
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
  );
}
