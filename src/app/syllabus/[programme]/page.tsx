import type { Metadata } from "next";

const programmeSeo: Record<string, { title: string; description: string; reference: string }> = {
  bvsc: {
    title: "B.V.Sc & A.H. Syllabus — VCI MSVE-2016 Pattern",
    description:
      "Subject-wise B.V.Sc & A.H. syllabus mapped to the VCI MSVE-2016 course structure, with year-wise courses, notes and mock tests.",
    reference: "Based on VCI MSVE-2016",
  },
  mvsc: {
    title: "M.V.Sc Syllabus — Course-wise Study Material",
    description:
      "M.V.Sc syllabus by discipline and course (typically two years, semester pattern) with notes, PYQs and mock tests for ICAR-SRF and NET.",
    reference: "ICAR PG Course Structure",
  },
  phd: {
    title: "Ph.D Veterinary Syllabus — Coursework & Research",
    description:
      "Ph.D veterinary coursework and research-methods syllabus, offered as per university regulations, with reading lists and review material.",
    reference: "As per University Regulations",
  },
  ahdp: {
    title: "AHDP Syllabus — Diploma in Veterinary & Animal Husbandry",
    description:
      "Complete AHDP (Rajasthan) diploma syllabus — subject-wise units, bilingual notes, previous year papers and mock tests.",
    reference: "State Diploma Curriculum",
  },
  dvp: {
    title: "DVP Syllabus — Diploma in Veterinary Pharmacy (UP)",
    description:
      "Complete DVP (Uttar Pradesh) diploma syllabus — subject-wise units, bilingual notes, previous year papers and mock tests for UPSSSC Pharmacist.",
    reference: "UP Diploma Curriculum",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ programme: string }>;
}): Promise<Metadata> {
  const { programme: slug } = await params;
  // "Soon" diploma tracks (VLDD, DAH, …) get their own coming-soon metadata
  // (noindex) instead of inheriting AHDP's — duplicate content across URLs.
  const soonTrack = getDiploma(slug);
  if (soonTrack && soonTrack.status !== "live") {
    const t = `${soonTrack.short} (${soonTrack.state}) — Syllabus Coming Soon | VetAcademia`;
    return {
      title: t,
      description: `The ${soonTrack.fullName} syllabus for ${soonTrack.state} (${soonTrack.authority}) is being prepared. Get notified at launch, or study the shared AHDP core meanwhile.`,
      robots: { index: false, follow: true },
      alternates: { canonical: `https://www.vetacademia.in/syllabus/${slug}` },
      openGraph: { title: t, type: "website" },
    };
  }
  const seo = programmeSeo[slug];
  if (!seo) {
    return {
      title: "VetAcademia | Programme Syllabus",
      description:
        "Subject-wise syllabus, courses and chapter content for veterinary programmes on VetAcademia.",
    };
  }
  // Page titles carry the brand once (root template is "%s" — it appends nothing).
  const branded = `${seo.title} | VetAcademia`;
  return {
    title: branded,
    description: seo.description,
    alternates: { canonical: `https://www.vetacademia.in/syllabus/${slug}` },
    openGraph: { title: branded, description: seo.description, type: "website" },
  };
}

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, FlaskConical, Stethoscope, ArrowLeft, Sparkles, Users, BookMarked } from "lucide-react";
import { getSubjectImage } from "@/lib/subject-images";
import { getAccess } from "@/lib/access";
import { slugToProgrammeName } from "@/lib/programme";
import { isStudyToolSubject } from "@/lib/subjects";
import { getDiploma, type DiplomaTrack } from "@/lib/diplomas";
import NotifyMe from "@/components/notify-me";
import SyllabusProgress from "@/components/syllabus-progress";
import SyllabusDarkToggle from "@/components/syllabus-dark-toggle";
import SyllabusBookmarkButton from "@/components/syllabus-bookmark-button";
import CurriculumSidebar from "@/components/curriculum-sidebar";
import { getCurriculumSidebar } from "@/lib/curriculum-sidebar";



const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  GraduationCap,
  FlaskConical,
  Stethoscope,
};

const colorMap: Record<string, string> = {
  ahdp: "text-green-600",
  bvsc: "text-blue-600",
  mvsc: "text-purple-600",
  phd: "text-orange-600",
};

// Distinct page for diploma tracks whose syllabus isn't authored yet (VLDD,
// DAH, DVSAHT, …). Previously these URLs re-rendered the AHDP syllabus —
// duplicate content under many URLs. This renders track-specific content
// with HTTP 200 (and noindex metadata above).
function TrackComingSoon({ track }: { track: DiplomaTrack }) {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
      <Link
        href="/diplomas"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Diplomas
      </Link>
      <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/10 bg-white shadow-xl p-6 md:p-8">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge className="rounded-full bg-amber-100 text-amber-800 border-amber-200">
            Coming Soon
          </Badge>
          <Badge variant="outline" className="rounded-full">
            {track.stateCode} • {track.state}
          </Badge>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          {track.fullName} ({track.short})
        </h1>
        <div className="mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-primary to-[#d4a843]" />
        <p className="mt-4 text-muted-foreground leading-relaxed">
          The {track.short} syllabus for {track.state} ({track.authority}) is
          being prepared — units, bilingual notes and mock tests will appear
          here at launch.
        </p>
        <div className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border bg-muted/40 p-3">
            <div className="font-semibold">Duration</div>
            <div className="text-muted-foreground">{track.duration}</div>
          </div>
          <div className="rounded-xl border bg-muted/40 p-3">
            <div className="font-semibold">Eligibility</div>
            <div className="text-muted-foreground">{track.eligibility}</div>
          </div>
          <div className="rounded-xl border bg-muted/40 p-3">
            <div className="font-semibold">Job post</div>
            <div className="text-muted-foreground">{track.jobPost}</div>
          </div>
          <div className="rounded-xl border bg-muted/40 p-3">
            <div className="font-semibold">Recruiting body</div>
            <div className="text-muted-foreground">{track.recruitingBody}</div>
          </div>
        </div>
        {track.focus.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {track.focus.map((f) => (
              <Badge key={f} variant="outline" className="rounded-full">
                {f}
              </Badge>
            ))}
          </div>
        )}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="sm:w-56">
            <NotifyMe track={track.short} state={track.state} />
          </div>
          <Link
            href={track.examLink}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            <BookOpen className="h-4 w-4" /> {track.examLabel} prep
          </Link>
          <Link
            href="/syllabus/ahdp"
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            Study the shared AHDP core
          </Link>
        </div>
      </div>
    </div>
  );
}



export default async function ProgrammePage({
  params,
}: {
  params: Promise<{ programme: string }>;
}) {
  const { programme: slug } = await params;

  // Diploma-basket tracks without authored syllabi (status "coming-soon")
  // render a distinct coming-soon page — never the AHDP syllabus (that was
  // duplicate content under many URLs). Unknown slugs fall through to the
  // DB lookup below and 404 there.
  const diplomaTrack = getDiploma(slug);
  if (diplomaTrack && diplomaTrack.status !== "live") {
    return <TrackComingSoon track={diplomaTrack} />;
  }
  const dbName = slugToProgrammeName(slug);

  const programme = await unstable_cache(
    () =>
      prisma.programme.findFirst({
        where: {
          name: {
            equals: dbName,
            mode: "insensitive",
          },
        },
        include: {
          departments: {
            select: {
              id: true,
              name: true,
              subjects: {
                select: {
                  id: true,
                  name: true,
                  year: true,
                  semester: true,
                  paper: true,
                  code: true,
                  _count: { select: { chapters: { where: { status: "PUBLISHED" } } } },
                },
                orderBy: [{ year: "asc" }, { name: "asc" }],
              },
              _count: { select: { subjects: true } },
            },
            orderBy: { name: "asc" },
          },
          subjects: {
            where: { departmentId: null },
            select: {
              id: true,
              name: true,
              year: true,
              semester: true,
              paper: true,
              code: true,
              _count: { select: { chapters: { where: { status: "PUBLISHED" } } } },
            },
            orderBy: [{ year: "asc" }, { semester: "asc" }, { paper: "asc" }],
          },
        },
      }),
    ["syllabus-programme", slug],
    { revalidate: 120 }
  )();

  if (!programme) notFound();

  // Hierarchical curriculum sidebar — programme → subjects → chapters.
  const curriculum = await getCurriculumSidebar({
    programmeId: programme.id,
    programmeSlug: slug,
  });

  const Icon = iconMap[programme.icon || "BookOpen"] || BookOpen;
  const colorClass = colorMap[slug] || "text-primary";
  const isDepartmentBased = programme.yearType === "department";

  const access = await getAccess();

  // Granular purchase plans for this programme (year plans for BVSc/AHDP,
  // subject plans for MVSc/PhD). Ordered so the base (lifetime) plan sorts
  // before its -6mo/-12mo/-24mo duration variants; the maps below keep the
  // FIRST row per year/subject so the CTA never links a random variant.
  const granularPlans = await unstable_cache(
    () =>
      prisma.plan.findMany({
        where: {
          programmeSlug: slug,
          OR: [{ year: { not: null } }, { subjectId: { not: null } }],
        },
        orderBy: [{ year: { sort: "asc", nulls: "last" } }, { subjectId: { sort: "asc", nulls: "last" } }, { slug: "asc" }],
        select: { slug: true, year: true, subjectId: true },
      }),
    ["syllabus-granular-plans", slug],
    { revalidate: 120 }
  )();
  const yearPlanByYear = new Map<string, string>();
  const subjectPlanBySubject = new Map<string, string>();
  for (const p of granularPlans) {
    if (p.year && !yearPlanByYear.has(p.year)) yearPlanByYear.set(p.year, p.slug);
    if (p.subjectId && !subjectPlanBySubject.has(p.subjectId))
      subjectPlanBySubject.set(p.subjectId, p.slug);
  }

  const isYearProgramme = slug === "bvsc" || slug === "ahdp";
  const isSubjectProgramme = slug === "mvsc" || slug === "phd";

  // Build a readable "Syllabus at a Glance" grouping (year/semester based for
  // BVSc/AHDP, department based for MVSc/PhD) — mirrors a course-structure tree.
  const allSubjects = [
    ...programme.departments.flatMap((d) => d.subjects),
    ...programme.subjects,
  ];
  // Study tools (Flashcards, Mock Tests, …) can exist as subject rows so they
  // can carry content, but they are not part of the prescribed academic
  // curriculum — keep them out of the subject/course totals and the year tree.
  const isStudyTool = isStudyToolSubject;
  const academicSubjects = allSubjects.filter((s) => !isStudyTool(s));
  const studyToolSubjects = allSubjects.filter(isStudyTool);
  const groupKey = (s: { year: string | null; semester: string | null }) =>
    s.year || s.semester || "General";
  const glanceGroups = new Map<string, typeof allSubjects>();
  for (const s of academicSubjects) {
    const key = groupKey(s);
    if (!glanceGroups.has(key)) glanceGroups.set(key, []);
    glanceGroups.get(key)!.push(s);
  }
  const totalCourses = academicSubjects.reduce(
    (sum, s) => sum + s._count.chapters,
    0
  );
  // Only real year groups count as "years" — a catch-all "General" bucket
  // (subjects without an assigned year) must never inflate the year count.
  const glanceGroupKeys = Array.from(glanceGroups.keys());
  const yearGroupKeys = glanceGroupKeys.filter((k) => /year/i.test(k));
  const generalGroupKeys = glanceGroupKeys.filter((k) => !/year/i.test(k));

  const renderSubjectCard = (subject: {
    id: string;
    name: string;
    year: string | null;
    semester: string | null;
    paper: string | null;
    code: string | null;
    _count: { chapters: number };
  }) => {
    const imageUrl = getSubjectImage(subject.name);
    const programmeOwned = access.programmeSlugs.has(slug) || access.isAdmin;
    let unlocked = programmeOwned;
    let buySlug: string | null = null;
    if (!programmeOwned) {
      if (isYearProgramme && subject.year) {
        const ys = yearPlanByYear.get(subject.year);
        if (ys) {
          unlocked = access.ownedYearScopes.has(`${slug}:${subject.year}`);
          buySlug = ys;
        }
      } else if (isYearProgramme) {
        // Subject with no assigned year: offer the full programme plan.
        buySlug = slug;
      } else if (isSubjectProgramme) {
        const ss = subjectPlanBySubject.get(subject.id);
        if (ss) {
          unlocked = access.ownedSubjectIds.has(subject.id);
          buySlug = ss;
        }
      }
    }
    return (
      <Card key={subject.id} className="va-card-hover h-full overflow-hidden rounded-[1.5rem] border border-primary/5 bg-white p-0 shadow-sm hover:shadow-xl group flex flex-col">
        <Link href={`/syllabus/${slug}/${subject.id}`} className="block relative h-48 overflow-hidden">
          <Image
            src={imageUrl}
            alt={subject.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-[1.06] transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-lg">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="absolute top-3 left-3">
            {subject.code && (
              <Badge className="bg-white/20 text-white border-white/30 text-xs">
                {subject.code}
              </Badge>
            )}
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <CardTitle className="text-lg font-bold text-white mb-1 group-hover:translate-x-1 transition-transform leading-tight">
              {subject.name}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {subject._count.chapters} {subject._count.chapters === 1 ? "Course" : "Courses"}
            </Badge>
          </div>
        </Link>
        <CardContent className="p-4 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {subject.semester && <Badge variant="outline" className="text-xs">{subject.semester}</Badge>}
            {subject.paper && <Badge variant="outline" className="text-xs">{subject.paper}</Badge>}
            {subject.year && <Badge variant="outline" className="text-xs">{subject.year}</Badge>}
            {unlocked && <Badge className="bg-emerald-600 text-xs">Owned</Badge>}
            <SyllabusBookmarkButton subjectId={subject.id} />
          </div>
          {!unlocked && buySlug && (
            <Link
              href={`/checkout?plan=${encodeURIComponent(buySlug)}`}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Buy{subject.year ? ' ' + subject.year : ''}
            </Link>
          )}
        </CardContent>
      </Card>
    );
  };

  // Course structured data for the subject cards rendered below. Only fields
  // that are actually visible on this page are emitted.
  const reference = programmeSeo[slug]?.reference;
  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `https://vetacademia.in/syllabus/${slug}`,
    url: `https://vetacademia.in/syllabus/${slug}`,
    name: programme.name,
    description: programmeSeo[slug]?.description ?? programme.fullName,
    inLanguage: "en",
    isPartOf: { "@type": "WebSite", "@id": "https://vetacademia.in/#website" },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: academicSubjects.length,
      itemListElement: academicSubjects.map((s, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Course",
          name: s.name,
          description:
            `${s.name} — ${s._count.chapters} course${s._count.chapters === 1 ? "" : "s"} ` +
            `in ${programme.name}, mapped unit-wise` +
            (reference ? ` to ${reference}.` : "."),
          url: `https://vetacademia.in/syllabus/${slug}/${s.id}`,
          inLanguage: "en",
          provider: { "@id": "https://vetacademia.in/#organization" },
          hasCourseInstance: { "@type": "CourseInstance", courseMode: "online" },
        },
      })),
    },
  };

  return (
    <div className="min-h-screen flex">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
      <CurriculumSidebar data={curriculum} />
      <div className="flex-1 min-w-0">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <Link href="/syllabus" className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-primary hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> All Programmes
          </Link>
          <SyllabusDarkToggle />
        </div>
        <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/10 shadow-xl mb-5">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#0284c7] to-[#0c4a6e]" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="relative px-5 py-5 md:px-6 md:py-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-lg">
                <Icon className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <Badge className="rounded-full bg-white/15 backdrop-blur-md border-white/20 text-white gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#d4a843]" /> {programme.yearType === "semester" ? "Semester System" : programme.yearType === "year" ? "Year System" : "Department Based"}
                </Badge>
                <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">{programme.name}</h1>
                <p className="mt-1 text-white/80 max-w-2xl">{programme.fullName}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1 text-xs font-medium">
                    <BookMarked className="h-3.5 w-3.5" /> {academicSubjects.length} Subjects
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1 text-xs font-medium">
                    <Users className="h-3.5 w-3.5" /> {totalCourses} Courses
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d4a843] px-3 py-1 text-xs font-bold text-[#0c4a6e]">
                    {programmeSeo[slug]?.reference ?? "VetAcademia course mapping"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Syllabus at a Glance */}
        <div className="mb-6 grid md:grid-cols-[1fr_280px] gap-5">
          <Card className="va-card-hover rounded-[1.5rem] border-primary/10 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-70" />
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-1 tracking-tight">Syllabus at a <span className="va-gradient-text">Glance</span></h2>
              <div className="h-1 w-12 rounded-full bg-gradient-to-r from-primary to-[#d4a843] mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                {academicSubjects.length} subjects · {totalCourses} courses mapped unit-wise
                {yearGroupKeys.length > 0 ? (
                  <>
                    {" "}across {yearGroupKeys.length} {yearGroupKeys.length === 1 ? "year" : "years"}
                    {generalGroupKeys.length > 0 &&
                      ` · ${generalGroupKeys.length} general ${generalGroupKeys.length === 1 ? "group" : "groups"}`}
                  </>
                ) : (
                  <>{" "}across {glanceGroups.size} {glanceGroups.size === 1 ? "group" : "groups"}</>
                )}
                {studyToolSubjects.length > 0 &&
                  ` · ${studyToolSubjects.length} study ${studyToolSubjects.length === 1 ? "tool" : "tools"} below`}.
              </p>
              <div className="space-y-4">
                {Array.from(glanceGroups.entries()).map(([group, subs]) => (
                  <div key={group} className="rounded-xl border border-primary/10 overflow-hidden bg-white">
                    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-2.5 border-b border-primary/10">
                      <span className="font-semibold text-sm">{group}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {subs.length} subject{subs.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <ul className="divide-y">
                      {subs.map((s) => (
                        <li
                          key={s.id}
                          className="flex items-center justify-between px-4 py-2 text-sm"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            {s.code && (
                              <span className="font-mono text-xs text-muted-foreground shrink-0">
                                {s.code}
                              </span>
                            )}
                            <span className="truncate">{s.name}</span>
                          </span>
                          <Link
                            href={`/syllabus/${slug}/${s.id}`}
                            className="text-xs text-primary hover:underline shrink-0 ml-3"
                          >
                            View →
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <SyllabusProgress total={academicSubjects.length} completed={0} lastSubject={null} />
            <Card className="va-card-hover rounded-[1.5rem] border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-70" />
              <CardContent className="p-5 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" /> How to Use
                </h3>
                <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                  <li>Pick your {isYearProgramme ? "year" : "subject group"} above.</li>
                  <li>Open a subject to see units &amp; chapters.</li>
                  <li>Read theory, download notes &amp; attempt mock tests.</li>
                </ol>
                <Link
                  href="/admission"
                  className="inline-flex items-center justify-center w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Enroll to Unlock
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-2">Need Help?</h3>
                <p className="text-sm text-muted-foreground">
                  Not sure which programme fits you? Our team will guide you.
                </p>
                <Link
                  href="/contact"
                  className="mt-3 inline-flex items-center text-sm text-primary font-medium hover:underline"
                >
                  Contact admissions →
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>


      {isDepartmentBased && programme.departments.length > 0 ? (
        <div className="space-y-10">
          {programme.departments.map((dept) => (
            <div key={dept.id}>
              <h2 className="text-xl font-semibold mb-4">{dept.name}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dept.subjects.filter((s) => !isStudyTool(s)).map(renderSubjectCard)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {academicSubjects.map(renderSubjectCard)}
          </div>
        </div>
      )}

      {/* Study tools sit alongside the syllabus — never counted as academic
          subjects or years in the summary above. */}
      {studyToolSubjects.length > 0 && (
        <div className="mt-10">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Study Tools</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Practice tools that complement the syllabus — not academic subjects
              and not part of the prescribed course structure.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studyToolSubjects.map(renderSubjectCard)}
          </div>
        </div>
      )}
      </div>
      </div>
    </div>
  );
}

