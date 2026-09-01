export const metadata = {
  title: "VetAcademia | Exam Subject",
  description: "Topic-wise preparation material for this veterinary exam subject on VetAcademia.",
};

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAccess } from "@/lib/access";
import { planSlugForExam } from "@/lib/plans";
import { programmeNameToSlug, slugToProgrammeName } from "@/lib/programme";
import { findDiscipline, getExamGroups, slugify } from "@/lib/exam-subjects";
import { getPublishedPosts } from "@/lib/posts";
import PostList from "@/components/post-list";
import EnrollCta from "@/components/enroll-cta";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Brain, FileText, ArrowLeft } from "lucide-react";



export const dynamic = "force-dynamic";

export default async function ExamSubjectPage({
  params,
}: {
  params: Promise<{ exam: string; subject: string }>;
}) {
  const { exam, subject: subjectSlug } = await params;
  const canonicalExamMap: Record<string, string> = {
    "icar-jrf": "icar-entrance",
    "icar-srf": "icar-entrance",
    "net-icar": "net",
    "net-csir": "net",
    "net-ugc": "net",
  };
  const canonicalExam = canonicalExamMap[exam] ?? exam;

  // Resolve discipline (static config, plus DB fallback for programme-based tracks).
  let found = findDiscipline(canonicalExam, subjectSlug);
  if (!found) {
    const groups = getExamGroups(canonicalExam).filter((g) => g.programmeSlug);
    if (groups.length > 0) {
      const programmes = groups.map((g) => slugToProgrammeName(g.programmeSlug!));
      const subjects = await prisma.subject.findMany({
        where: { programme: { name: { in: programmes } } },
        select: { name: true, programme: { select: { name: true } } },
      });
      const match = subjects.find((s) => slugify(s.name) === subjectSlug);
      if (match) {
        const grp = groups.find(
          (g) => slugToProgrammeName(g.programmeSlug!) === match.programme.name
        );
        found = {
          discipline: {
            slug: subjectSlug,
            name: match.name,
            subjectName: match.name,
            programmeSlug: programmeNameToSlug(match.programme.name),
          },
          group: grp,
        };
      }
    }
  }
  if (!found) notFound();
  const { discipline, group } = found;

  const access = await getAccess();
  const examUnlocked = access.examKeys.has(exam) || access.examKeys.has(canonicalExam) || access.examPlanOwned;
  const requiredPlan = group?.planSlug ?? planSlugForExam(canonicalExam);
  const unlocked = group?.planSlug
    ? access.planSlugs.has(group.planSlug)
    : examUnlocked;

  const [matchedSubjects, papers] = await Promise.all([
    discipline.subjectName && discipline.programmeSlug
      ? prisma.subject
          .findMany({
          where: {
            name: { equals: discipline.subjectName, mode: "insensitive" },
          },
            include: {
              programme: true,
              chapters: {
                orderBy: { unitNumber: "asc" },
                select: { id: true, title: true, unitNumber: true },
              },
              mockTests: {
                orderBy: { createdAt: "desc" },
                select: { id: true, title: true, duration: true, totalMarks: true },
              },
            },
            orderBy: { year: "asc" },
          })
          .then((subs) =>
            subs.filter(
              (s) =>
                s.programme &&
                programmeNameToSlug(s.programme.name) === discipline.programmeSlug
            )
          )
      : Promise.resolve([]),
    getPublishedPosts("PREVIOUS_YEAR", canonicalExam, subjectSlug),
  ]);

  // Merge all year records that share this subject name (e.g. III Year + IV Year).
  const allMockTests = matchedSubjects.flatMap((s) => s.mockTests);
  const studySections = matchedSubjects
    .filter((s) => s.chapters.length > 0)
    .map((s) => ({
      subjectId: s.id,
      year: s.year,
      creditHours: s.creditHours,
      chapters: s.chapters,
    }));

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href={`/examinations/${exam}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {canonicalExam === "icar-entrance" ? "ICAR Entrance" : canonicalExam.toUpperCase()}
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{discipline.name}</h1>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="secondary">
            {canonicalExam === "icar-entrance"
              ? exam === "icar-jrf" ? "ICAR-JRF" : exam === "icar-srf" ? "ICAR-SRF" : "ICAR-JRF / SRF"
              : canonicalExam === "net"
                ? exam === "net-icar" ? "ICAR-NET" : exam === "net-csir" ? "CSIR-NET" : exam === "net-ugc" ? "UGC-NET" : "NET"
                : exam.toUpperCase()}
          </Badge>
          {group && <Badge variant="outline">{group.name}</Badge>}
          {discipline.isGeneral && <Badge variant="outline">Paper</Badge>}
        </div>
      </div>

      {!unlocked ? (
        <EnrollCta
          planSlug={requiredPlan || "veterinary-officer"}
          title="Enroll to access this subject"
          message={`Enroll in the exam preparation plan to unlock ${discipline.name} previous year papers, mock tests and study material.`}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Previous Year Papers */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <CardTitle>Previous Year Papers</CardTitle>
                  <CardDescription>Solve actual exam papers</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {papers.length > 0 ? (
                <PostList posts={papers} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No tagged papers yet for this subject.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Mock Tests */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle>Mock Tests</CardTitle>
                  <CardDescription>Practice with timed mock tests</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {allMockTests.length > 0 ? (
                <div className="space-y-3">
                  {allMockTests.map((t) => (
                    <Link
                      key={t.id}
                      href={`/mock-tests/${t.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div>
                        <div className="font-medium text-sm">{t.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.totalMarks} Marks &middot; {t.duration} min
                        </div>
                      </div>
                      <Badge variant="outline">Start</Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No mock tests yet for this subject.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Study Material (programme syllabus, merged across years) */}
          {studySections.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Study Material</CardTitle>
                    <CardDescription>
                      {discipline.programmeSlug?.toUpperCase()} {discipline.name}{" "}
                      syllabus &amp; notes
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {studySections.map((sec, i) => (
                  <div key={`${sec.subjectId ?? ""}-${sec.year ?? ""}-${i}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {sec.year && <Badge variant="secondary">{sec.year}</Badge>}
                      {sec.creditHours && (
                        <span className="text-xs text-muted-foreground">
                          Credit Hours: {sec.creditHours}
                        </span>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {sec.chapters.map((c) => (
                        <Link
                          key={c.id}
                          href={`/syllabus/${discipline.programmeSlug}/${sec.subjectId}/${c.id}`}
                          className="px-3 py-2 rounded-lg border text-sm hover:bg-accent transition-colors"
                        >
                          {c.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
