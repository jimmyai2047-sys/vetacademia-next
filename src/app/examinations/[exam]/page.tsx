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
  Sparkles,
  ArrowLeft,
  Clock,
  Users,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
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

const examinationsData: Record<
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
    stats: { label: string; value: string }[];
    previousYearPapers: {
      year: string;
      title: string;
      questions: number;
      duration: string;
    }[];
    studyMaterials: {
      title: string;
      description: string;
      type: string;
      pages: number;
    }[];
    mockTests: {
      title: string;
      questions: number;
      duration: string;
      difficulty: string;
    }[];
    adaptiveTests: {
      title: string;
      description: string;
      level: string;
    }[];
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
    stats: [
      { label: "Previous Papers", value: "120+" },
      { label: "Mock Tests", value: "45" },
      { label: "Study Notes", value: "200+" },
      { label: "Questions", value: "5000+" },
    ],
    previousYearPapers: [
      { year: "2024", title: "UPPSC Veterinary Officer 2024", questions: 150, duration: "2 hrs" },
      { year: "2024", title: "RPSC Veterinary Officer 2024", questions: 100, duration: "2 hrs" },
      { year: "2023", title: "BPSC Veterinary Surgeon 2023", questions: 150, duration: "2.5 hrs" },
      { year: "2023", title: "MPPSC Livestock Assistant 2023", questions: 100, duration: "2 hrs" },
      { year: "2023", title: "KPSC Veterinary Officer 2023", questions: 100, duration: "2 hrs" },
      { year: "2022", title: "UPPSC Veterinary Officer 2022", questions: 150, duration: "2 hrs" },
    ],
    studyMaterials: [
      { title: "Veterinary Anatomy Complete Notes", description: "Comprehensive notes covering all topics for PSC exams", type: "PDF", pages: 120 },
      { title: "Animal Husbandry Practice Guide", description: "Practical guide for livestock management questions", type: "PDF", pages: 85 },
      { title: "Veterinary Pharmacology Summary", description: "Quick revision notes for pharmacology section", type: "PDF", pages: 60 },
      { title: "Previous Year Analysis", description: "Topic-wise analysis of PSC veterinary papers", type: "PDF", pages: 45 },
    ],
    mockTests: [
      { title: "PSC Veterinary Officer Mock 1", questions: 150, duration: "2 hrs", difficulty: "Medium" },
      { title: "PSC Veterinary Officer Mock 2", questions: 100, duration: "2 hrs", difficulty: "Medium" },
      { title: "Livestock Assistant Practice 1", questions: 100, duration: "1.5 hrs", difficulty: "Easy" },
      { title: "PSC Veterinary Officer Mock 3", questions: 150, duration: "2 hrs", difficulty: "Hard" },
    ],
    adaptiveTests: [
      { title: "PSC Adaptive Test - Anatomy", description: "AI-powered adaptive test focusing on weak areas in anatomy", level: "Intermediate" },
      { title: "PSC Adaptive Test - Surgery", description: "Dynamic difficulty test for surgical subjects", level: "Advanced" },
      { title: "PSC Adaptive Test - Complete", description: "Full syllabus adaptive test with personalized questions", level: "All Levels" },
    ],
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
    stats: [
      { label: "Previous Papers", value: "80+" },
      { label: "Mock Tests", value: "30" },
      { label: "Study Notes", value: "150+" },
      { label: "Questions", value: "3000+" },
    ],
    previousYearPapers: [
      { year: "2024", title: "ICAR-JRF Veterinary Science 2024", questions: 200, duration: "3 hrs" },
      { year: "2023", title: "ICAR-JRF Veterinary Science 2023", questions: 200, duration: "3 hrs" },
      { year: "2023", title: "ICAR-SRF Veterinary Science 2023", questions: 150, duration: "2.5 hrs" },
      { year: "2022", title: "ICAR-JRF Veterinary Science 2022", questions: 200, duration: "3 hrs" },
      { year: "2022", title: "ICAR-SRF Veterinary Science 2022", questions: 150, duration: "2.5 hrs" },
    ],
    studyMaterials: [
      { title: "ICAR-JRF Complete Syllabus Notes", description: "Full syllabus coverage for JRF veterinary exam", type: "PDF", pages: 200 },
      { title: "ICAR-SRF Research Methodology", description: "Research methodology and biostatistics notes", type: "PDF", pages: 90 },
      { title: "Animal Breeding & Genetics", description: "Detailed notes on animal breeding concepts", type: "PDF", pages: 75 },
      { title: "Veterinary Public Health", description: "Public health and epidemiology for ICAR exams", type: "PDF", pages: 65 },
    ],
    mockTests: [
      { title: "ICAR-JRF Mock Test 1", questions: 200, duration: "3 hrs", difficulty: "Medium" },
      { title: "ICAR-JRF Mock Test 2", questions: 200, duration: "3 hrs", difficulty: "Hard" },
      { title: "ICAR-SRF Mock Test 1", questions: 150, duration: "2.5 hrs", difficulty: "Hard" },
      { title: "ICAR-JRF Practice Test", questions: 100, duration: "1.5 hrs", difficulty: "Easy" },
    ],
    adaptiveTests: [
      { title: "ICAR-JRF Adaptive - Genetics", description: "Focus on animal genetics and breeding concepts", level: "Intermediate" },
      { title: "ICAR-JRF Adaptive - Pathology", description: "Dynamic test for veterinary pathology", level: "Advanced" },
      { title: "ICAR-SRF Adaptive Test", description: "Advanced adaptive test for SRF preparation", level: "Expert" },
    ],
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
    stats: [
      { label: "Previous Papers", value: "100+" },
      { label: "Mock Tests", value: "40" },
      { label: "Study Notes", value: "180+" },
      { label: "Questions", value: "4000+" },
    ],
    previousYearPapers: [
      { year: "2024", title: "ICAR-NET Veterinary Science 2024", questions: 150, duration: "3 hrs" },
      { year: "2024", title: "UGC-NET Veterinary Science 2024", questions: 150, duration: "3 hrs" },
      { year: "2023", title: "ICAR-NET Veterinary Science 2023", questions: 150, duration: "3 hrs" },
      { year: "2023", title: "CSIR-NET Life Sciences 2023", questions: 140, duration: "3 hrs" },
      { year: "2022", title: "ICAR-NET Veterinary Science 2022", questions: 150, duration: "3 hrs" },
    ],
    studyMaterials: [
      { title: "NET Veterinary Science Complete Guide", description: "Comprehensive preparation guide for NET exam", type: "PDF", pages: 250 },
      { title: "Paper 1 General Studies", description: "General studies and aptitude for NET Paper 1", type: "PDF", pages: 100 },
      { title: "Veterinary Microbiology Notes", description: "Detailed microbiology notes for NET preparation", type: "PDF", pages: 80 },
      { title: "Animal Physiology Advanced", description: "Advanced physiology concepts for NET level", type: "PDF", pages: 70 },
    ],
    mockTests: [
      { title: "ICAR-NET Mock Test 1", questions: 150, duration: "3 hrs", difficulty: "Medium" },
      { title: "UGC-NET Mock Test 1", questions: 150, duration: "3 hrs", difficulty: "Medium" },
      { title: "CSIR-NET Mock Test 1", questions: 140, duration: "3 hrs", difficulty: "Hard" },
      { title: "NET Practice Test - Part B", questions: 50, duration: "1 hr", difficulty: "Easy" },
    ],
    adaptiveTests: [
      { title: "NET Adaptive - Part A", description: "General aptitude adaptive test for Paper 1", level: "All Levels" },
      { title: "NET Adaptive - Part B", description: "Subject-specific adaptive test for Paper 2", level: "Intermediate" },
      { title: "NET Adaptive - Part C", description: "Advanced concepts adaptive test for Paper 2", level: "Expert" },
    ],
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
    stats: [
      { label: "Previous Papers", value: "60+" },
      { label: "Mock Tests", value: "25" },
      { label: "Study Notes", value: "120+" },
      { label: "Questions", value: "2500+" },
    ],
    previousYearPapers: [
      { year: "2024", title: "ARS Veterinary Science 2024", questions: 200, duration: "3 hrs" },
      { year: "2023", title: "ARS Veterinary Science 2023", questions: 200, duration: "3 hrs" },
      { year: "2022", title: "ARS Veterinary Science 2022", questions: 200, duration: "3 hrs" },
      { year: "2021", title: "ARS Veterinary Science 2021", questions: 200, duration: "3 hrs" },
    ],
    studyMaterials: [
      { title: "ARS Complete Preparation Guide", description: "All-in-one guide for ARS veterinary exam", type: "PDF", pages: 220 },
      { title: "Veterinary Surgery & Radiology", description: "In-depth notes on surgical procedures and radiology", type: "PDF", pages: 110 },
      { title: "Livestock Production Technology", description: "Complete notes on livestock production and management", type: "PDF", pages: 95 },
      { title: "ARS Previous Year Analysis", description: "Detailed analysis of ARS paper patterns", type: "PDF", pages: 50 },
    ],
    mockTests: [
      { title: "ARS Mock Test 1", questions: 200, duration: "3 hrs", difficulty: "Hard" },
      { title: "ARS Mock Test 2", questions: 200, duration: "3 hrs", difficulty: "Hard" },
      { title: "ARS Practice - Section A", questions: 100, duration: "1.5 hrs", difficulty: "Medium" },
      { title: "ARS Practice - Section B", questions: 100, duration: "1.5 hrs", difficulty: "Hard" },
    ],
    adaptiveTests: [
      { title: "ARS Adaptive - Basic Sciences", description: "Adaptive test covering anatomy, physiology, biochemistry", level: "Intermediate" },
      { title: "ARS Adaptive - Clinical Sciences", description: "Dynamic test for medicine, surgery, gynaecology", level: "Advanced" },
      { title: "ARS Adaptive - Full Syllabus", description: "Complete adaptive test for ARS preparation", level: "Expert" },
    ],
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
    stats: [
      { label: "Previous Papers", value: "50+" },
      { label: "Mock Tests", value: "20" },
      { label: "Study Notes", value: "80+" },
      { label: "Questions", value: "1500+" },
    ],
    previousYearPapers: [
      { year: "2024", title: "State Veterinary Entrance 2024", questions: 100, duration: "2 hrs" },
      { year: "2023", title: "AIVRP Entrance 2023", questions: 100, duration: "2 hrs" },
      { year: "2023", title: "IVRI Entrance 2023", questions: 150, duration: "2.5 hrs" },
      { year: "2022", title: "State Veterinary Officer 2022", questions: 100, duration: "2 hrs" },
    ],
    studyMaterials: [
      { title: "Veterinary Entrance Guide", description: "General preparation guide for various entrance exams", type: "PDF", pages: 150 },
      { title: "Animal Nutrition Complete Notes", description: "Detailed notes on animal nutrition and feeding", type: "PDF", pages: 70 },
      { title: "Veterinary Pathology Summary", description: "Quick revision notes for pathology", type: "PDF", pages: 55 },
      { title: "Extension Education Notes", description: "Veterinary and animal husbandry extension education", type: "PDF", pages: 45 },
    ],
    mockTests: [
      { title: "General Veterinary Mock 1", questions: 100, duration: "2 hrs", difficulty: "Medium" },
      { title: "State Level Exam Mock 1", questions: 100, duration: "2 hrs", difficulty: "Easy" },
      { title: "IVRI Practice Test", questions: 150, duration: "2.5 hrs", difficulty: "Medium" },
      { title: "Veterinary General Mock", questions: 50, duration: "1 hr", difficulty: "Easy" },
    ],
    adaptiveTests: [
      { title: "General Adaptive - Anatomy", description: "Basic adaptive test for anatomy concepts", level: "Beginner" },
      { title: "General Adaptive - Medicine", description: "Dynamic test covering veterinary medicine", level: "Intermediate" },
      { title: "General Adaptive - Complete", description: "Full syllabus adaptive test for all topics", level: "All Levels" },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(examinationsData).map((exam) => ({ exam }));
}

export default async function ExamPage({
  params,
}: {
  params: Promise<{ exam: string }>;
}) {
  const { exam } = await params;
  const data = examinationsData[exam];

  if (!data) {
    notFound();
  }

  const prevYearPosts = await getPublishedPosts("PREVIOUS_YEAR", exam);

  const dbMockTests = await prisma.mockTest.findMany({
    where: { exam },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true } } },
  });

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
          className={`w-16 h-16 rounded-xl ${data.lightColor} flex items-center justify-center shrink-0`}
        >
          <data.icon className={`h-8 w-8 ${data.textColor}`} />
        </div>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold">{data.title}</h1>
            <Badge variant="secondary">{data.badge}</Badge>
          </div>
          <p className="text-muted-foreground">{data.subtitle}</p>
        </div>
      </div>

      {/* Description */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <p className="text-muted-foreground">{data.description}</p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {data.stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 4 Main Sections */}
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
              <>
                {prevYearPosts.length > 0 ? (
                  <PostList posts={prevYearPosts} />
                ) : (
                  <div className="space-y-3">
                    {data.previousYearPapers.map((paper, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                      >
                        <div>
                          <div className="font-medium text-sm">{paper.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {paper.questions} Questions &middot; {paper.duration}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{paper.year}</Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {prevYearPosts.length === 0 && (
                  <Button variant="outline" className="w-full mt-4">
                    View All Papers
                  </Button>
                )}
              </>
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
            <div className="space-y-3">
              {data.studyMaterials.map((material, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                >
                  <div>
                    <div className="font-medium text-sm">{material.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {material.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{material.type}</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Materials
            </Button>
          </CardContent>
        </Card>

        {/* Mock & Adaptive Tests (DB-driven) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Brain className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle>Mock &amp; Adaptive Tests</CardTitle>
                <CardDescription>
                  Practice with timed and personalized tests
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {dbMockTests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tests yet. Add them from the admin panel.
              </p>
            ) : (
              <div className="space-y-3">
                {dbMockTests.map((t) => (
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
            Track your progress, identify weak areas, and improve with our intelligent learning system
          </p>
          <Button variant="secondary" size="lg">
            Start Preparation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
