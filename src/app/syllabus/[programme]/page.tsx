import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, FlaskConical, Stethoscope, ArrowLeft } from "lucide-react";
import { getSubjectImage } from "@/lib/subject-images";
import { getAccess } from "@/lib/access";

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

  const programme = await prisma.programme.findFirst({
    where: {
      name: {
        equals: slug === "ahdp" ? "AHDP" : slug === "bvsc" ? "BVSC" : slug === "mvsc" ? "MVSC" : slug === "phd" ? "PHD" : slug,
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
  });

  if (!programme) notFound();

  const Icon = iconMap[programme.icon || "BookOpen"] || BookOpen;
  const colorClass = colorMap[slug] || "text-primary";
  const isDepartmentBased = programme.yearType === "department";

  const access = await getAccess();

  // Granular purchase plans for this programme (year plans for BVSc/AHDP,
  // subject plans for MVSc/PhD).
  const granularPlans = await prisma.plan.findMany({
    where: {
      programmeSlug: slug,
      OR: [{ year: { not: null } }, { subjectId: { not: null } }],
    },
    select: { slug: true, year: true, subjectId: true },
  });
  const yearPlanByYear = new Map<string, string>();
  const subjectPlanBySubject = new Map<string, string>();
  for (const p of granularPlans) {
    if (p.year) yearPlanByYear.set(p.year, p.slug);
    if (p.subjectId) subjectPlanBySubject.set(p.subjectId, p.slug);
  }

  const isYearProgramme = slug === "bvsc" || slug === "ahdp";
  const isSubjectProgramme = slug === "mvsc" || slug === "phd";

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
      } else if (isSubjectProgramme) {
        const ss = subjectPlanBySubject.get(subject.id);
        if (ss) {
          unlocked = access.ownedSubjectIds.has(subject.id);
          buySlug = ss;
        }
      }
    }
    return (
      <Card key={subject.id} className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 group border-0 flex flex-col">
        <Link href={`/syllabus/${slug}/${subject.id}`} className="block relative h-48 overflow-hidden">
          <Image
            src={imageUrl}
            alt={subject.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-white/50" />
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
              Buy {isYearProgramme ? subject.year : ""}
            </Link>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/syllabus"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          All Programmes
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-primary/10">
            <Icon className={`h-7 w-7 ${colorClass}`} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{programme.name}</h1>
            <p className="text-muted-foreground">{programme.fullName}</p>
          </div>
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
