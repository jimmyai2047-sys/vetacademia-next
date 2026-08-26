export const metadata = {
  title: "VetAcademia | Programme Syllabus",
  description: "Subject-wise syllabus and course content for veterinary programmes on VetAcademia.",
};

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



export default async function ProgrammePage({
  params,
}: {
  params: Promise<{ programme: string }>;
}) {
  const { programme: slug } = await params;

  const programme = await unstable_cache(
    () =>
      prisma.programme.findFirst({
        where: {
          name: {
            equals: slugToProgrammeName(slug),
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
                  _count: { select: { chapters: true } },
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
              _count: { select: { chapters: true } },
            },
            orderBy: [{ year: "asc" }, { semester: "asc" }, { paper: "asc" }],
          },
        },
      }),
    ["syllabus-programme", slug],
    { revalidate: 120 }
  )();

  if (!programme) notFound();

  const Icon = iconMap[programme.icon || "BookOpen"] || BookOpen;
  const colorClass = colorMap[slug] || "text-primary";
  const isDepartmentBased = programme.yearType === "department";

  const access = await getAccess();

  // Granular purchase plans for this programme (year plans for BVSc/AHDP,
  // subject plans for MVSc/PhD).
  const granularPlans = await unstable_cache(
    () =>
      prisma.plan.findMany({
        where: {
          programmeSlug: slug,
          OR: [{ year: { not: null } }, { subjectId: { not: null } }],
        },
        select: { slug: true, year: true, subjectId: true },
      }),
    ["syllabus-granular-plans", slug],
    { revalidate: 120 }
  )();
  const yearPlanByYear = new Map<string, string>();
  const subjectPlanBySubject = new Map<string, string>();
  for (const p of granularPlans) {
    if (p.year) yearPlanByYear.set(p.year, p.slug);
    if (p.subjectId) subjectPlanBySubject.set(p.subjectId, p.slug);
  }

  const isYearProgramme = slug === "bvsc" || slug === "ahdp";
  const isSubjectProgramme = slug === "mvsc" || slug === "phd";

  // Build a readable "Syllabus at a Glance" grouping (year/semester based for
  // BVSc/AHDP, department based for MVSc/PhD) — mirrors a course-structure tree.
  const allSubjects = [
    ...programme.departments.flatMap((d) => d.subjects),
    ...programme.subjects,
  ];
  const groupKey = (s: { year: string | null; semester: string | null }) =>
    s.year || s.semester || "General";
  const glanceGroups = new Map<string, typeof allSubjects>();
  for (const s of allSubjects) {
    const key = groupKey(s);
    if (!glanceGroups.has(key)) glanceGroups.set(key, []);
    glanceGroups.get(key)!.push(s);
  }
  const totalCourses = allSubjects.reduce(
    (sum, s) => sum + s._count.chapters,
    0
  );

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
    const programmeOwned = access.programmeSlugs.has(slug);
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

  return (
      <div className="container mx-auto px-4 py-8">
        <Link href="/syllabus" className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-primary hover:text-white transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> All Programmes
        </Link>
        <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/10 shadow-xl mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#005f48] to-[#003d2e]" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative px-6 py-8 md:px-8 md:py-10 text-white">
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
                    <BookMarked className="h-3.5 w-3.5" /> {allSubjects.length} Subjects
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1 text-xs font-medium">
                    <Users className="h-3.5 w-3.5" /> {totalCourses} Courses
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d4a843] px-3 py-1 text-xs font-bold text-[#003d2e]">
                    VCI MSVE-2016
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Syllabus at a Glance */}
        <div className="mb-10 grid md:grid-cols-[1fr_280px] gap-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-1">Syllabus at a Glance</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {allSubjects.length} subjects · {totalCourses} courses mapped unit-wise
                across {glanceGroups.size} {isYearProgramme ? "year" : "group"}
                {glanceGroups.size === 1 ? "" : "s"}.
              </p>
              <div className="space-y-4">
                {Array.from(glanceGroups.entries()).map(([group, subs]) => (
                  <div key={group} className="rounded-xl border overflow-hidden">
                    <div className="bg-primary/5 px-4 py-2.5 border-b">
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
            <Card className="border-primary/20 bg-primary/5">
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
                {dept.subjects.map(renderSubjectCard)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programme.subjects.map(renderSubjectCard)}
          </div>
        </div>
      )}
    </div>
  );
}
