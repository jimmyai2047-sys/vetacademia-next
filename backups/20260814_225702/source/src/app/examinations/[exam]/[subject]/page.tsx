import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAccess } from "@/lib/access";
import { planSlugForExam } from "@/lib/plans";
import { findDiscipline } from "@/lib/exam-subjects";
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
  const found = findDiscipline(exam, subjectSlug);
  if (!found) notFound();

  const { discipline, group } = found;

  const access = await getAccess();
  const examUnlocked = access.examKeys.has(exam) || exam === "other";

  const [mvscSubject, papers] = await Promise.all([
    prisma.subject.findFirst({
      where: {
        name: { equals: discipline.mvscSubject, mode: "insensitive" },
        programme: { name: "MVSC" },
      },
      include: {
        chapters: {
          orderBy: { unitNumber: "asc" },
          select: { id: true, title: true, unitNumber: true },
        },
        mockTests: {
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, duration: true, totalMarks: true },
        },
      },
    }),
    getPublishedPosts("PREVIOUS_YEAR", exam, subjectSlug),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href={`/examinations/${exam}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {exam === "icar-entrance" ? "ICAR Entrance" : exam.toUpperCase()}
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{discipline.name}</h1>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="secondary">
            {exam === "icar-entrance"
              ? "ICAR-JRF / SRF"
              : exam.toUpperCase()}
          </Badge>
          {group && <Badge variant="outline">{group.name}</Badge>}
        </div>
      </div>

      {!examUnlocked ? (
        <EnrollCta
          planSlug={planSlugForExam(exam) || "veterinary-officer"}
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
              {mvscSubject && mvscSubject.mockTests.length > 0 ? (
                <div className="space-y-3">
                  {mvscSubject.mockTests.map((t) => (
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

          {/* Study Material (M.V.Sc syllabus) */}
          {mvscSubject && mvscSubject.chapters.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Study Material</CardTitle>
                    <CardDescription>
                      M.V.Sc {discipline.name} syllabus &amp; notes
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {mvscSubject.chapters.map((c) => (
                    <Link
                      key={c.id}
                      href={`/syllabus/mvsc/${mvscSubject.id}/${c.id}`}
                      className="px-3 py-2 rounded-lg border text-sm hover:bg-accent transition-colors"
                    >
                      {c.title}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
