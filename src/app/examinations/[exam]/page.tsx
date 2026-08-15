import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Beaker,
  Award,
  Microscope,
  MoreHorizontal,
  FileText,
  BookOpen,
  Brain,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { trackLabel } from "@/lib/exam-tracks";
import { EXAM_PREP_CATEGORIES } from "@/lib/exam-prep";
import { getSignedUrl } from "@/lib/blob";
import { getPublishedPosts } from "@/lib/posts";
import PostList from "@/components/post-list";
import { getAccess } from "@/lib/access";
import { planSlugForExam } from "@/lib/plans";
import {
  getExamGroups,
  getExamDisciplines,
  slugify,
} from "@/lib/exam-subjects";
import EnrollCta from "@/components/enroll-cta";

export const dynamic = "force-dynamic";

const examMeta: Record<
  string,
  {
    title: string;
    subtitle: string;
    description: string;
    icon: typeof Building2;
    color: string;
    lightColor: string;
    textColor: string;
    badge: string;
  }
> = {
  psc: {
    title: "Public Service Commission",
    subtitle: "Veterinary Officer / Surgeon, Livestock Assistant",
    description:
      "Complete preparation material for State and Central PSC examinations for Veterinary Officer, Veterinary Surgeon, and Livestock Assistant positions.",
    icon: Building2,
    color: "bg-blue-500",
    lightColor: "bg-blue-50",
    textColor: "text-blue-600",
    badge: "State & Central PSC",
  },
  "icar-entrance": {
    title: "ICAR Entrance",
    subtitle: "JRF and SRF",
    description:
      "Comprehensive preparation for ICAR-JRF (Junior Research Fellow) and ICAR-SRF (Senior Research Fellow) entrance examinations for veterinary sciences.",
    icon: Beaker,
    color: "bg-emerald-500",
    lightColor: "bg-emerald-50",
    textColor: "text-emerald-600",
    badge: "JRF & SRF",
  },
  net: {
    title: "National Eligibility Test",
    subtitle: "ICAR, CSIR, UGC",
    description:
      "Prepare for NET examinations conducted by ICAR, CSIR, and UGC for lectureship (LS) and Junior Research Fellowship (JRF) eligibility in veterinary sciences.",
    icon: Award,
    color: "bg-purple-500",
    lightColor: "bg-purple-50",
    textColor: "text-purple-600",
    badge: "ICAR / CSIR / UGC",
  },
  ars: {
    title: "Agricultural Research Scientist",
    subtitle: "ARS Examination",
    description:
      "Targeted preparation for ARS (Agricultural Research Scientist) examination conducted by ASRB (Agricultural Scientists Recruitment Board) for research positions.",
    icon: Microscope,
    color: "bg-orange-500",
    lightColor: "bg-orange-50",
    textColor: "text-orange-600",
    badge: "ARS - ASRB",
  },
  other: {
    title: "Other Examinations",
    subtitle: "Various Veterinary Competitive Exams",
    description:
      "Preparation material for various other veterinary competitive examinations including state-level entrance tests, institutional exams, and specialized certifications.",
    icon: MoreHorizontal,
    color: "bg-rose-500",
    lightColor: "bg-rose-50",
    textColor: "text-rose-600",
    badge: "Multiple Exams",
  },
};

export default async function ExamPage({
  params,
}: {
  params: Promise<{ exam: string }>;
}) {
  const { exam } = await params;
  const meta = examMeta[exam];

  if (!meta) {
    notFound();
  }

  const prevYearPosts = await getPublishedPosts("PREVIOUS_YEAR", exam);

  const dbMockTests = await prisma.mockTest.findMany({
    where: { exam },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true } } },
  });

  const mockTestGroups = (() => {
    const map = new Map<string, typeof dbMockTests>();
    for (const t of dbMockTests) {
      const key = t.track || "general";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries()).map(([k, items]) => ({
      key: k,
      label: k === "general" ? "General" : trackLabel(k),
      items,
    }));
  })();

  const examMaterialCats = EXAM_PREP_CATEGORIES.filter(
    (c) => c.examKey === exam
  ).map((c) => c.key);
  const examMaterials = examMaterialCats.length
    ? await prisma.examMaterial.findMany({
        where: { category: { in: examMaterialCats }, published: true },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      })
    : [];
  const examMaterialsWithLinks = await Promise.all(
    examMaterials.map(async (m) => ({
      ...m,
      signedUrl: m.fileUrl ? await getSignedUrl(m.fileUrl) : null,
    }))
  );

  const access = await getAccess();
  const examUnlocked = access.examKeys.has(exam) || exam === "other";

  const groups = getExamGroups(exam);
  const disciplines = getExamDisciplines(exam);

  // For programme-based groups (PSC tracks), fetch the actual subjects.
  const groupSubjects: Record<string, { slug: string; name: string }[]> = {};
  for (const g of groups) {
    if (g.programmeSlug) {
      const subs = await prisma.subject.findMany({
        where: { programme: { name: g.programmeSlug.toUpperCase() } },
        select: { name: true },
        orderBy: { name: "asc" },
      });
      const seen = new Set<string>();
      groupSubjects[g.slug] = subs
        .map((s) => ({ slug: slugify(s.name), name: s.name }))
        .filter((s) => (seen.has(s.slug) ? false : (seen.add(s.slug), true)));
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link
        href="/examinations"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Examinations
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div
          className={`w-16 h-16 rounded-xl ${meta.lightColor} flex items-center justify-center shrink-0`}
        >
          <meta.icon className={`h-8 w-8 ${meta.textColor}`} />
        </div>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold">{meta.title}</h1>
            <Badge variant="secondary">{meta.badge}</Badge>
          </div>
          <p className="text-muted-foreground">{meta.subtitle}</p>
        </div>
      </div>

      {/* Description */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <p className="text-muted-foreground">{meta.description}</p>
        </CardContent>
      </Card>

      {/* Main Sections */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
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
            {examUnlocked ? (
              prevYearPosts.length > 0 ? (
                <PostList posts={prevYearPosts} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No previous year papers yet.
                </p>
              )
            ) : (
              <EnrollCta
                planSlug={planSlugForExam(exam) || "veterinary-officer"}
                title="Enroll to access previous year papers"
                message="Enroll in the exam preparation plan to unlock previous year papers and solutions."
              />
            )}
          </CardContent>
        </Card>

        {/* Study Material */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>Study Material</CardTitle>
                <CardDescription>Comprehensive study resources</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Browse notes, advisories and reference material for this exam.
            </p>
            <Link href="/study-materials">
              <Button variant="outline" className="w-full">
                View All Materials
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Exam Study Materials (uploaded, category-specific) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle>Study Materials</CardTitle>
                <CardDescription>
                  PPT, PDF, Video, Audio, Animations &amp; Images for this exam
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {examMaterialsWithLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No study materials uploaded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {examMaterialsWithLinks.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">
                        {m.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {m.type}
                      </div>
                    </div>
                    {m.signedUrl ? (
                      <a
                        href={m.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline shrink-0 ml-3"
                      >
                        Download
                      </a>
                    ) : m.externalUrl ? (
                      <a
                        href={m.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline shrink-0 ml-3"
                      >
                        Open
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mock & Adaptive Tests (DB-driven), grouped by track */}
        {mockTestGroups.map((group) => (
          <Card key={group.key}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle>
                    Mock &amp; Adaptive Tests
                    {group.key !== "general" && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        {group.label}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Practice with timed and personalized tests
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {group.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No tests yet. Add them from the admin panel.
                </p>
              ) : (
                <div className="space-y-3">
                  {group.items.map((t) => (
                    <Link
                      key={t.id}
                      href={`/mock-tests/${t.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div>
                        <div className="font-medium text-sm">{t.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {t._count.questions} Questions &middot; {t.duration} min
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
              <Link href="/mock-tests" className="block mt-4">
                <Button variant="outline" className="w-full">
                  View All Tests
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subjects / Disciplines */}
      {(groups.length > 0 || disciplines.length > 0) && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            {groups.length > 0 ? "Subject Groups" : "Subjects / Disciplines"}
          </h2>
          {groups.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {groups.map((g) => {
                const items = [
                  ...(g.programmeSlug
                    ? groupSubjects[g.slug] ?? []
                    : g.disciplines ?? []),
                  ...(g.extraDisciplines ?? []),
                ];
                return (
                  <Card key={g.slug}>
                    <CardHeader>
                      <CardTitle className="text-lg">{g.name}</CardTitle>
                      {g.planSlug && (
                        <p className="text-xs text-muted-foreground">
                          Enroll in this track to unlock
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {items.map((d) => (
                          <Link
                            key={d.slug}
                            href={`/examinations/${exam}/${d.slug}`}
                            className="px-3 py-1.5 rounded-lg border text-sm hover:bg-accent transition-colors"
                          >
                            {d.name}
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {disciplines.map((d) => (
                <Link
                  key={d.slug}
                  href={`/examinations/${exam}/${d.slug}`}
                  className="px-4 py-3 rounded-lg border hover:bg-accent transition-colors text-sm font-medium"
                >
                  {d.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">Ready to start preparing?</h3>
          <p className="opacity-90 mb-4">
            Track your progress, identify weak areas, and improve with our
            intelligent learning system
          </p>
          <Link href="/mock-tests">
            <Button variant="secondary" size="lg">
              Start Preparation
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
