export const metadata = {
  title: "VetAcademia | Exam Preparation",
  description: "Subjects and resources for this veterinary examination on VetAcademia.",
};

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
  Radio,
  Stethoscope,
  Tractor,
  GraduationCap,
  ShieldCheck,
  Download,
  ExternalLink,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { trackLabel } from "@/lib/exam-tracks";
import { EXAM_PREP_CATEGORIES } from "@/lib/exam-prep";
import { getSignedUrl } from "@/lib/blob";
import { getPublishedPosts } from "@/lib/posts";
import PostList from "@/components/post-list";
import { getAccess } from "@/lib/access";
import { planSlugForExam } from "@/lib/plans";
import ProtectedHtml from "@/components/protected-html";
import { programmeNameToSlug } from "@/lib/programme";
import { prepareChapterHtml } from "@/lib/chapter-images";
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
  "icar-jrf": {
    title: "ICAR-JRF",
    subtitle: "ICAR Entrance — Junior Research Fellowship",
    description:
      "B.V.Sc & A.H. level ICAR-JRF entrance for PG admission with fellowship — Chapter / Unit based preparation, JRF-specific mock tests and previous year papers.",
    icon: Beaker,
    color: "bg-emerald-600",
    lightColor: "bg-emerald-50",
    textColor: "text-emerald-600",
    badge: "ICAR-JRF",
  },
  "icar-srf": {
    title: "ICAR-SRF",
    subtitle: "ICAR Entrance — Senior Research Fellowship",
    description:
      "M.V.Sc level ICAR-SRF entrance for Ph.D. admission — Discipline / Course based preparation with SRF-specific resources.",
    icon: Beaker,
    color: "bg-green-600",
    lightColor: "bg-green-50",
    textColor: "text-green-600",
    badge: "ICAR-SRF",
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
  "net-icar": {
    title: "ICAR-NET",
    subtitle: "NET — ICAR (ASRB)",
    description:
      "ICAR-NET conducted by ASRB for Lectureship / Assistant Professor eligibility in veterinary & agricultural sciences — discipline-wise preparation.",
    icon: Award,
    color: "bg-purple-600",
    lightColor: "bg-purple-50",
    textColor: "text-purple-600",
    badge: "ICAR-NET",
  },
  "net-csir": {
    title: "CSIR-NET",
    subtitle: "NET — CSIR (Life Sciences)",
    description:
      "CSIR-NET for JRF & Lectureship in Life Sciences, Chemical Sciences and related fields — NTA conducted, twice a year, research-oriented preparation.",
    icon: Award,
    color: "bg-indigo-600",
    lightColor: "bg-indigo-50",
    textColor: "text-indigo-600",
    badge: "CSIR-NET",
  },
  "net-ugc": {
    title: "UGC-NET",
    subtitle: "NET — UGC (NTA)",
    description:
      "UGC-NET for Assistant Professor & JRF eligibility in higher education — NTA conducted, comprehensive preparation for Paper-1 & subject papers.",
    icon: Award,
    color: "bg-violet-600",
    lightColor: "bg-violet-50",
    textColor: "text-violet-600",
    badge: "UGC-NET",
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

// Alias new split plates to canonical exam keys for DB queries (so data under icar-entrance/net is reused)
const canonicalExamMap: Record<string, string> = {
  "icar-jrf": "icar-entrance",
  "icar-srf": "icar-entrance",
  "net-icar": "net",
  "net-csir": "net",
  "net-ugc": "net",
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

  const canonicalExam = canonicalExamMap[exam] ?? exam;
  const prevYearPosts = await getPublishedPosts("PREVIOUS_YEAR", canonicalExam);

  const dbMockTests = await prisma.mockTest.findMany({
    where: { exam: canonicalExam },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true } } },
  });

  const groupByTrack = (tests: typeof dbMockTests) => {
    const map = new Map<string, typeof dbMockTests>();
    for (const t of tests) {
      const key = t.track || "general";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries()).map(([k, items]) => ({
      key: k,
      label: k === "general" ? "General" : trackLabel(k),
      items,
    }));
  };
  const prevYearMocks = dbMockTests.filter((t) => t.kind === "PREVIOUS_YEAR");
  const otherMocks = dbMockTests.filter((t) => t.kind !== "PREVIOUS_YEAR");
  const prevYearGroups = groupByTrack(prevYearMocks);
  const otherGroups = groupByTrack(otherMocks);

  const examMaterialCats = EXAM_PREP_CATEGORIES.filter(
    (c) => c.examKey === canonicalExam
  ).map((c) => c.key);

  const liveClasses = await prisma.liveClass.findMany({
    where: { exam: canonicalExam, status: { in: ["SCHEDULED", "LIVE", "ENDED"] } },
    orderBy: [{ scheduledAt: "desc" }],
    take: 20,
    select: {
      id: true,
      title: true,
      description: true,
      subject: true,
      scheduledAt: true,
      duration: true,
      status: true,
      recordingUrl: true,
      isDemo: true,
      track: true,
    },
  });

  const examMaterials = examMaterialCats.length
    ? await prisma.examMaterial.findMany({
        where: { category: { in: examMaterialCats }, published: true },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      })
    : [];
  // Sign both fileUrl and any private Blob images inside body (for proper image box visibility)
  const examMaterialsWithLinks = await Promise.all(
    examMaterials.map(async (m) => ({
      ...m,
      signedUrl: m.fileUrl ? await getSignedUrl(m.fileUrl) : null,
      signedBody: m.body ? await prepareChapterHtml(m.body) : null,
    }))
  );

  const access = await getAccess();
  const examUnlocked = access.examKeys.has(exam) || access.examKeys.has(canonicalExam) || access.examPlanOwned;

  const groups = getExamGroups(canonicalExam);
  const disciplines = getExamDisciplines(canonicalExam);

  // For programme-based groups (PSC tracks), fetch only the subjects that
  // belong to that group's programme. Programme has no slug column, so build a
  // reverse slug→names map and filter server-side by programme name.
  const programmes = await prisma.programme.findMany({
    select: { name: true },
  });
  const slugToNames: Record<string, string[]> = {};
  for (const p of programmes) {
    const slug = programmeNameToSlug(p.name);
    (slugToNames[slug] ||= []).push(p.name);
  }

  const groupSubjects: Record<string, { slug: string; name: string }[]> = {};
  await Promise.all(
    groups
      .filter((g) => g.programmeSlug)
      .map(async (g) => {
        const names = slugToNames[g.programmeSlug as string] || [];
        const subs = await prisma.subject.findMany({
          where: { programme: { name: { in: names } } },
          orderBy: { name: "asc" },
        });
        const seen = new Set<string>();
        groupSubjects[g.slug] = subs
          .map((s) => ({ slug: slugify(s.name), name: s.name }))
          .filter((s) => (seen.has(s.slug) ? false : (seen.add(s.slug), true)));
      })
  );

  const isPSC = exam === "psc";

  // PSC-specific split helpers — only computed for PSC page
  const voMaterials = examMaterialsWithLinks.filter((m) => m.category === "VO");
  const lsaMaterials = examMaterialsWithLinks.filter((m) => m.category === "LSA");
  const voPosts = prevYearPosts.filter((p) => !p.track || p.track === "veterinary-officer");
  const lsaPosts = prevYearPosts.filter((p) => !p.track || p.track === "livestock-assistant");
  // Strict filter for display counts — VO-only vs LSA-only (excluding general for stricter badge)
  const voPostsStrict = prevYearPosts.filter((p) => p.track === "veterinary-officer");
  const lsaPostsStrict = prevYearPosts.filter((p) => p.track === "livestock-assistant");
  const voLive = liveClasses.filter((c: any) => !c.track || c.track === "veterinary-officer");
  const lsaLive = liveClasses.filter((c: any) => !c.track || c.track === "livestock-assistant");
  const voUnlocked = access.isAdmin || access.planSlugs.has("veterinary-officer");
  const lsaUnlocked = access.isAdmin || access.planSlugs.has("livestock-assistant");
  const voSubjects = groupSubjects["veterinary-officer"] ?? [];
  const lsaSubjects = groupSubjects["livestock-assistant"] ?? [];
  const voPrevGroups = prevYearGroups.filter((g) => g.key === "veterinary-officer");
  const lsaPrevGroups = prevYearGroups.filter((g) => g.key === "livestock-assistant");
  const generalPrevGroups = prevYearGroups.filter((g) => g.key === "general");
  const voOtherGroups = otherGroups.filter((g) => g.key === "veterinary-officer");
  const lsaOtherGroups = otherGroups.filter((g) => g.key === "livestock-assistant");
  const generalOtherGroups = otherGroups.filter((g) => g.key === "general");

  if (isPSC) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/examinations"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Examinations
        </Link>

        {/* PSC Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className={`w-16 h-16 rounded-xl ${meta.lightColor} flex items-center justify-center shrink-0`}>
            <meta.icon className={`h-8 w-8 ${meta.textColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-3xl font-bold">{meta.title}</h1>
              <Badge variant="secondary">{meta.badge}</Badge>
            </div>
            <p className="text-muted-foreground">{meta.subtitle}</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">{meta.description}</p>
          </div>
        </div>

        {/* PSC — Quick jump pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          <a
            href="#veterinary-officer"
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 text-white px-4 py-2 text-sm font-semibold shadow hover:bg-blue-700 transition-colors"
          >
            <Stethoscope className="h-4 w-4" /> V.O. / V.S.
          </a>
          <a
            href="#livestock-assistant"
            className="inline-flex items-center gap-2 rounded-full bg-teal-600 text-white px-4 py-2 text-sm font-semibold shadow hover:bg-teal-700 transition-colors"
          >
            <Tractor className="h-4 w-4" /> L.S.A.
          </a>
          <span className="inline-flex items-center text-xs text-muted-foreground px-2 py-2">
            नीचे अलग-अलग sections — अपनी तैयारी का track चुनें
          </span>
        </div>

        {/* ========== VETERINARY OFFICER / SURGEON — Section ========== */}
        <section
          id="veterinary-officer"
          className="scroll-mt-24 rounded-[1.75rem] border border-blue-200/60 bg-gradient-to-br from-blue-50/60 via-white to-white shadow-sm overflow-hidden mb-10"
        >
          <div className="h-1 bg-gradient-to-r from-blue-600 via-[#d4a843] to-blue-600" />
          <div className="p-6 md:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Stethoscope className="h-7 w-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-2xl font-extrabold text-blue-900">Veterinary Officer / Veterinary Surgeon</h2>
                  <Badge className="bg-blue-600 text-white border-0 rounded-full">V.O. / V.S. — B.V.Sc</Badge>
                  <Badge variant="outline" className="rounded-full border-blue-200 text-blue-700">PSC</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  B.V.Sc & A.H. syllabus पर आधारित — State & Central PSC के लिए। General Knowledge के साथ-साथ सभी veterinary subjects।
                </p>
              </div>
            </div>

            {/* VO Stats strip */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-xl border bg-white px-3 py-3 text-center">
                <div className="text-lg font-extrabold text-blue-700">{voSubjects.length}</div>
                <div className="text-xs text-muted-foreground">Subjects (B.V.Sc)</div>
              </div>
              <div className="rounded-xl border bg-white px-3 py-3 text-center">
                <div className="text-lg font-extrabold text-blue-700">{voPostsStrict.length || voPosts.length}</div>
                <div className="text-xs text-muted-foreground">Prev. Year Papers</div>
              </div>
              <div className="rounded-xl border bg-white px-3 py-3 text-center">
                <div className="text-lg font-extrabold text-blue-700">
                  {(voPrevGroups[0]?.items.length ?? 0) + (voOtherGroups[0]?.items.length ?? 0) || "—"}
                </div>
                <div className="text-xs text-muted-foreground">Mock Tests</div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* VO Previous Year Papers (PostList) */}
              <Card className="rounded-[1.25rem]">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Previous Year Papers — V.O.</CardTitle>
                      <CardDescription>B.V.Sc level actual papers (VO track)</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {voPosts.length > 0 ? (
                    <PostList posts={voPostsStrict.length ? voPostsStrict : voPosts} />
                  ) : (
                    <p className="text-sm text-muted-foreground">No V.O. previous year papers yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* VO Previous Year Papers as Mock Tests */}
              {(voPrevGroups.length > 0 || generalPrevGroups.length > 0) && (
                <Card className="rounded-[1.25rem]">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Prev. Papers as Mock — V.O.</CardTitle>
                        <CardDescription>Timed mock • VO track</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {[...voPrevGroups, ...generalPrevGroups].every((g) => g.items.length === 0) ? (
                      <p className="text-sm text-muted-foreground">No mock papers yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {[...voPrevGroups, ...generalPrevGroups].flatMap((g) => g.items).map((t) => (
                          <Link key={t.id} href={`/mock-tests/${t.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                            <div>
                              <div className="font-medium text-sm">{t.title}</div>
                              <div className="text-xs text-muted-foreground">{t._count.questions} Q • {t.duration} min</div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* VO Study Materials */}
              <Card className="rounded-[1.25rem]">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Study Materials — V.O.</CardTitle>
                      <CardDescription>PPT • PDF • Video • Audio (VO / B.V.Sc)</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!voUnlocked ? (
                    <EnrollCta planSlug="veterinary-officer" title="Enroll — Veterinary Officer" message="V.O./V.S. track unlock करें — सारे notes, PPT, PDFs और videos पाएँ।" />
                  ) : voMaterials.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No V.O. materials uploaded yet.</p>
                  ) : (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {voMaterials.map((m) => (
                        <div key={m.id} className="p-3 rounded-xl border bg-white space-y-2">
                          <div>
                            <div className="font-semibold text-sm">{m.title}</div>
                            <div className="text-xs text-muted-foreground">{m.type}{m.subject ? ` · ${m.subject}` : ""}{m.topic ? ` → ${m.topic}` : ""}</div>
                          </div>
                          {(m as any).signedBody || m.body ? (
                            <div className="rounded-xl border bg-muted/5 p-3 max-h-[260px] overflow-hidden relative">
                              <div className="pointer-events-none scale-[0.96] origin-top-left w-[104%]">
                                <ProtectedHtml html={(m as any).signedBody || m.body!} />
                              </div>
                              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
                              <Link href={`/prepare/material/${m.id}`} className="absolute bottom-2 right-2">
                                <Button size="sm" className="rounded-full shadow-md gap-1.5 text-xs"><BookOpen className="h-3 w-3" /> Read Full</Button>
                              </Link>
                            </div>
                          ) : null}
                          <div className="flex flex-wrap gap-2">
                            <Link href={`/prepare/material/${m.id}`}>
                              <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs"><BookOpen className="h-3 w-3" /> Open Reader</Button>
                            </Link>
                            {m.signedUrl ? (
                              <a href={m.signedUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs text-primary hover:underline gap-1"><Download className="h-3 w-3" /> Download</a>
                            ) : m.externalUrl ? (
                              <a href={m.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs text-primary hover:underline gap-1"><ExternalLink className="h-3 w-3" /> Open</a>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* VO Mock Tests */}
              <Card className="rounded-[1.25rem]">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Mock & Adaptive — V.O.</CardTitle>
                      <CardDescription>PSC level timed tests</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!voUnlocked ? (
                    <EnrollCta planSlug="veterinary-officer" title="Enroll — V.O. mocks" message="V.O. mock & adaptive tests unlock करने के लिए enroll करें।" />
                  ) : [...voOtherGroups, ...generalOtherGroups].flatMap((g) => g.items).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tests yet. Add from admin.</p>
                  ) : (
                    <div className="space-y-3">
                      {[...voOtherGroups, ...generalOtherGroups].flatMap((g) => g.items).map((t) => (
                        <Link key={t.id} href={`/mock-tests/${t.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                          <div><div className="font-medium text-sm">{t.title}</div><div className="text-xs text-muted-foreground">{t._count.questions} Q • {t.duration} min</div></div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      ))}
                    </div>
                  )}
                  {voUnlocked && <Link href="/mock-tests" className="block mt-4"><Button variant="outline" className="w-full">View All V.O. Tests</Button></Link>}
                </CardContent>
              </Card>

              {/* VO Live Classes */}
              {voLive.length > 0 && (
                <Card className="rounded-[1.25rem] lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><Radio className="h-5 w-5 text-red-600" /></div>
                      <div><CardTitle className="text-base">Live Classes — V.O.</CardTitle><CardDescription>Scheduled & recorded sessions for VO</CardDescription></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {voLive.slice(0, 8).map((lc: any) => (
                        <Link key={lc.id} href={`/examinations/${exam}/live/${lc.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${lc.status === "LIVE" ? "bg-red-500 animate-pulse" : lc.status === "SCHEDULED" ? "bg-blue-500" : "bg-green-500"}`} />
                            <div className="min-w-0"><div className="font-medium text-sm truncate">{lc.title}</div><div className="text-xs text-muted-foreground">{new Date(lc.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}{lc.subject && <> · {lc.subject}</>}{lc.status === "LIVE" && <span className="text-red-500 ml-1 font-medium">LIVE</span>}{lc.status === "ENDED" && <span className="text-green-600 ml-1">Recorded</span>}</div></div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* VO Subjects */}
              <Card className="rounded-[1.25rem] lg:col-span-2 border-blue-100">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><GraduationCap className="h-5 w-5 text-blue-600" /></div>
                    <div><CardTitle className="text-base">Subjects — V.O. / V.S. (B.V.Sc & A.H.)</CardTitle><CardDescription>B.V.Sc programme + General Knowledge</CardDescription></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {voSubjects.map((d) => (
                      <Link key={d.slug} href={`/examinations/${exam}/${d.slug}`} className="px-3 py-1.5 rounded-xl border bg-white text-sm hover:bg-blue-50 hover:border-blue-200 transition-colors">
                        {d.name}
                      </Link>
                    ))}
                    <Link href={`/examinations/${exam}/general-knowledge`} className="px-3 py-1.5 rounded-xl border bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors">General Knowledge</Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ========== LIVESTOCK ASSISTANT — Section ========== */}
        <section
          id="livestock-assistant"
          className="scroll-mt-24 rounded-[1.75rem] border border-teal-200/60 bg-gradient-to-br from-teal-50/60 via-white to-white shadow-sm overflow-hidden mb-10"
        >
          <div className="h-1 bg-gradient-to-r from-teal-600 via-[#d4a843] to-emerald-600" />
          <div className="p-6 md:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Tractor className="h-7 w-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-2xl font-extrabold text-teal-900">Livestock Assistant</h2>
                  <Badge className="bg-teal-600 text-white border-0 rounded-full">L.S.A. — AHDP</Badge>
                  <Badge variant="outline" className="rounded-full border-teal-200 text-teal-700">RSSB</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  AHDP syllabus पर आधारित — Rajasthan Staff Selection Board (RSSB) के लिए। सभी 10 veterinary subjects + Rajasthan GK।
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-xl border bg-white px-3 py-3 text-center">
                <div className="text-lg font-extrabold text-teal-700">{lsaSubjects.length}</div>
                <div className="text-xs text-muted-foreground">Subjects (AHDP)</div>
              </div>
              <div className="rounded-xl border bg-white px-3 py-3 text-center">
                <div className="text-lg font-extrabold text-teal-700">{lsaPostsStrict.length || lsaPosts.length}</div>
                <div className="text-xs text-muted-foreground">Prev. Year Papers</div>
              </div>
              <div className="rounded-xl border bg-white px-3 py-3 text-center">
                <div className="text-lg font-extrabold text-teal-700">
                  {(lsaPrevGroups[0]?.items.length ?? 0) + (lsaOtherGroups[0]?.items.length ?? 0) || "—"}
                </div>
                <div className="text-xs text-muted-foreground">Mock Tests</div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="rounded-[1.25rem]">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center"><FileText className="h-5 w-5 text-teal-600" /></div>
                    <div><CardTitle className="text-base">Previous Year Papers — L.S.A.</CardTitle><CardDescription>AHDP level actual papers (LSA track)</CardDescription></div>
                  </div>
                </CardHeader>
                <CardContent>
                  {lsaPosts.length > 0 ? <PostList posts={lsaPostsStrict.length ? lsaPostsStrict : lsaPosts} /> : <p className="text-sm text-muted-foreground">No L.S.A. previous year papers yet.</p>}
                </CardContent>
              </Card>

              {(lsaPrevGroups.length > 0 || generalPrevGroups.length > 0) && (
                <Card className="rounded-[1.25rem]">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center"><FileText className="h-5 w-5 text-orange-600" /></div>
                      <div><CardTitle className="text-base">Prev. Papers as Mock — L.S.A.</CardTitle><CardDescription>Timed mock • LSA track</CardDescription></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {[...lsaPrevGroups, ...generalPrevGroups].every((g) => g.items.length === 0) ? (
                      <p className="text-sm text-muted-foreground">No mock papers yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {[...lsaPrevGroups, ...generalPrevGroups].flatMap((g) => g.items).map((t) => (
                          <Link key={t.id} href={`/mock-tests/${t.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                            <div><div className="font-medium text-sm">{t.title}</div><div className="text-xs text-muted-foreground">{t._count.questions} Q • {t.duration} min</div></div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="rounded-[1.25rem]">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center"><BookOpen className="h-5 w-5 text-teal-600" /></div>
                    <div><CardTitle className="text-base">Study Materials — L.S.A.</CardTitle><CardDescription>PPT • PDF • Video • Audio (LSA / AHDP)</CardDescription></div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!lsaUnlocked ? (
                    <EnrollCta planSlug="livestock-assistant" title="Enroll — Livestock Assistant" message="L.S.A. track unlock करें — AHDP notes, Rajasthan GK और videos पाएँ।" />
                  ) : lsaMaterials.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No L.S.A. materials uploaded yet.</p>
                  ) : (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {lsaMaterials.map((m) => (
                        <div key={m.id} className="p-3 rounded-xl border bg-white space-y-2">
                          <div>
                            <div className="font-semibold text-sm">{m.title}</div>
                            <div className="text-xs text-muted-foreground">{m.type}{m.subject ? ` · ${m.subject}` : ""}{m.topic ? ` → ${m.topic}` : ""}</div>
                          </div>
                          {(m as any).signedBody || m.body ? (
                            <div className="rounded-xl border bg-muted/5 p-3 max-h-[260px] overflow-hidden relative">
                              <div className="pointer-events-none scale-[0.96] origin-top-left w-[104%]">
                                <ProtectedHtml html={(m as any).signedBody || m.body!} />
                              </div>
                              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
                              <Link href={`/prepare/material/${m.id}`} className="absolute bottom-2 right-2">
                                <Button size="sm" className="rounded-full shadow-md gap-1.5 text-xs"><BookOpen className="h-3 w-3" /> Read Full</Button>
                              </Link>
                            </div>
                          ) : null}
                          <div className="flex flex-wrap gap-2">
                            <Link href={`/prepare/material/${m.id}`}>
                              <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs"><BookOpen className="h-3 w-3" /> Open Reader</Button>
                            </Link>
                            {m.signedUrl ? (
                              <a href={m.signedUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs text-primary hover:underline gap-1"><Download className="h-3 w-3" /> Download</a>
                            ) : m.externalUrl ? (
                              <a href={m.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs text-primary hover:underline gap-1"><ExternalLink className="h-3 w-3" /> Open</a>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[1.25rem]">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"><Brain className="h-5 w-5 text-emerald-600" /></div>
                    <div><CardTitle className="text-base">Mock & Adaptive — L.S.A.</CardTitle><CardDescription>AHDP level timed tests</CardDescription></div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!lsaUnlocked ? (
                    <EnrollCta planSlug="livestock-assistant" title="Enroll — L.S.A. mocks" message="L.S.A. mock & adaptive tests unlock करने के लिए enroll करें।" />
                  ) : [...lsaOtherGroups, ...generalOtherGroups].flatMap((g) => g.items).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tests yet. Add from admin.</p>
                  ) : (
                    <div className="space-y-3">
                      {[...lsaOtherGroups, ...generalOtherGroups].flatMap((g) => g.items).map((t) => (
                        <Link key={t.id} href={`/mock-tests/${t.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                          <div><div className="font-medium text-sm">{t.title}</div><div className="text-xs text-muted-foreground">{t._count.questions} Q • {t.duration} min</div></div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      ))}
                    </div>
                  )}
                  {lsaUnlocked && <Link href="/mock-tests" className="block mt-4"><Button variant="outline" className="w-full">View All L.S.A. Tests</Button></Link>}
                </CardContent>
              </Card>

              {lsaLive.length > 0 && (
                <Card className="rounded-[1.25rem] lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><Radio className="h-5 w-5 text-red-600" /></div>
                      <div><CardTitle className="text-base">Live Classes — L.S.A.</CardTitle><CardDescription>Scheduled & recorded sessions for LSA</CardDescription></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {lsaLive.slice(0, 8).map((lc: any) => (
                        <Link key={lc.id} href={`/examinations/${exam}/live/${lc.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${lc.status === "LIVE" ? "bg-red-500 animate-pulse" : lc.status === "SCHEDULED" ? "bg-blue-500" : "bg-green-500"}`} />
                            <div className="min-w-0"><div className="font-medium text-sm truncate">{lc.title}</div><div className="text-xs text-muted-foreground">{new Date(lc.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}{lc.subject && <> · {lc.subject}</>}{lc.status === "LIVE" && <span className="text-red-500 ml-1 font-medium">LIVE</span>}{lc.status === "ENDED" && <span className="text-green-600 ml-1">Recorded</span>}</div></div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="rounded-[1.25rem] lg:col-span-2 border-teal-100">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center"><ShieldCheck className="h-5 w-5 text-teal-600" /></div>
                    <div><CardTitle className="text-base">Subjects — L.S.A. (AHDP)</CardTitle><CardDescription>AHDP programme + Rajasthan GK</CardDescription></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {lsaSubjects.map((d) => (
                      <Link key={d.slug} href={`/examinations/${exam}/${d.slug}`} className="px-3 py-1.5 rounded-xl border bg-white text-sm hover:bg-teal-50 hover:border-teal-200 transition-colors">
                        {d.name}
                      </Link>
                    ))}
                    <Link href={`/examinations/${exam}/general-knowledge`} className="px-3 py-1.5 rounded-xl border bg-teal-600 text-white text-sm hover:bg-teal-700 transition-colors">General Knowledge</Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* PSC Common CTA */}
        <Card className="bg-primary text-primary-foreground rounded-[1.5rem]">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-2">Ready to start preparing?</h3>
            <p className="opacity-90 mb-4">Track your progress, identify weak areas, and improve with our intelligent learning system</p>
            <Link href="/mock-tests"><Button variant="secondary" size="lg">Start Preparation</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
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
                {prevYearPosts.length > 0 ? (
                  <PostList posts={prevYearPosts} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No previous year papers yet.
                  </p>
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
            {!examUnlocked ? (
              <EnrollCta
                planSlug={planSlugForExam(exam) || "veterinary-officer"}
                title="Enroll to access study materials"
                message="Enroll in this exam track to unlock its study materials, PPTs, PDFs, and videos."
              />
            ) : examMaterialsWithLinks.length === 0 ? (
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
                        {m.subject ? ` Â· ${m.subject}` : ""}
                        {m.topic ? ` â†’ ${m.topic}` : ""}
                      </div>
                      {m.body ? (
                        <div className="mt-2 rounded-md border bg-muted/30 p-3">
                          <ProtectedHtml html={(m as any).signedBody || m.body} />
                        </div>
                      ) : null}
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

        {/* Live Classes */}
        {liveClasses.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <Radio className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <CardTitle>Live Classes</CardTitle>
                  <CardDescription>Scheduled and recorded live sessions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {liveClasses.map((lc) => (
                  <Link
                    key={lc.id}
                    href={`/examinations/${exam}/live/${lc.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        lc.status === "LIVE" ? "bg-red-500 animate-pulse" :
                        lc.status === "SCHEDULED" ? "bg-blue-500" : "bg-green-500"
                      }`} />
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{lc.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {lc.scheduledAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                          {lc.subject && <> &middot; {lc.subject}</>}
                          {lc.status === "LIVE" && <span className="text-red-500 ml-1 font-medium">LIVE</span>}
                          {lc.status === "ENDED" && <span className="text-green-600 ml-1">Recorded</span>}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Previous Year Papers as Mock Tests - always visible (free) */}
        {prevYearGroups.map((group) => (
          <Card key={`pyp-${group.key}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle>
                    Previous Year Papers (Mock Tests)
                    {group.key !== "general" && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        {group.label}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Attempt previous year papers as timed mock tests
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {group.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No previous year papers as tests yet.
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
            </CardContent>
          </Card>
        ))}
        {/* Mock & Adaptive Tests (DB-driven), grouped by track */}
        {examUnlocked ? (
          otherGroups.map((group) => (
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
        ))
        ) : (
          <Card>
            <CardContent>
              <EnrollCta
                planSlug={planSlugForExam(exam) || "veterinary-officer"}
                title="Enroll to access mock tests"
                message="Enroll in this exam track to unlock its mock and adaptive tests."
              />
            </CardContent>
          </Card>
        )}
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


