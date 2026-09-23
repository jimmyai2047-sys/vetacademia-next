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
    <div className="container mx-auto px-4 py-8 md:py-12">
      <Link
        href={`/examinations/${exam}`}
        className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-primary hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {canonicalExam === "icar-entrance" ? "ICAR Entrance" : canonicalExam.toUpperCase()}
      </Link>

      <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/10 shadow-xl mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#0284c7] to-[#0c4a6e]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-[#d4a843]/15 blur-3xl" />
        <div className="relative px-6 py-8 md:px-8 text-white">
        <h1 className="text-3xl font-bold mb-2 tracking-tight">{discipline.name}</h1>
        <div className="h-1 w-16 rounded-full bg-gradient-to-r from-white to-[#d4a843]" />
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <Badge className="rounded-full bg-white/15 backdrop-blur-md border-white/20 text-white">
            {canonicalExam === "icar-entrance"
              ? exam === "icar-jrf" ? "ICAR-JRF" : exam === "icar-srf" ? "ICAR-SRF" : "ICAR-JRF / SRF"
              : canonicalExam === "net"
                ? exam === "net-icar" ? "ICAR-NET" : exam === "net-csir" ? "CSIR-NET" : exam === "net-ugc" ? "UGC-NET" : "NET"
                : exam.toUpperCase()}
          </Badge>
          {group && <Badge className="rounded-full bg-white/15 backdrop-blur-md border-white/20 text-white">{group.name}</Badge>}
          {discipline.isGeneral && <Badge className="rounded-full bg-white/15 backdrop-blur-md border-white/20 text-white">Paper</Badge>}
        </div>
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
          <Card className="va-card-hover rounded-[1.5rem] border-primary/10 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-70" />
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shadow-sm">
                  <FileText className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <CardTitle className="tracking-tight">Previous Year Papers</CardTitle>
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
          <Card className="va-card-hover rounded-[1.5rem] border-primary/10 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-[#d4a843] to-primary opacity-70" />
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm">
                  <Brain className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="tracking-tight">Mock Tests</CardTitle>
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
                      className="flex items-center justify-between p-3 rounded-xl border border-primary/10 bg-white hover:border-primary/20 hover:shadow-sm hover:bg-gradient-to-r hover:from-primary/[0.04] hover:to-transparent transition-all"
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
            <Card className="md:col-span-2 va-card-hover rounded-[1.5rem] border-primary/10 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-70" />
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
                          className="px-3 py-2 rounded-xl border border-primary/10 bg-white text-sm hover:border-primary/20 hover:shadow-sm hover:bg-primary/5 transition-all"
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

