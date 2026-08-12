import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, FlaskConical, Stethoscope, ArrowLeft, ArrowRight } from "lucide-react";

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

  const groupedSubjects = programme.subjects.reduce(
    (acc, subject) => {
      const key = subject.year || "Other";
      if (!acc[key]) acc[key] = [];
      acc[key].push(subject);
      return acc;
    },
    {} as Record<string, typeof programme.subjects>
  );

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

      {isDepartmentBased ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Departments</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programme.departments.map((dept) => (
              <Link key={dept.id} href={`/syllabus/${slug}/${dept.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {dept.name}
                      </CardTitle>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">
                      {dept._count.subjects} {dept._count.subjects === 1 ? "Subject" : "Subjects"}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {Object.entries(groupedSubjects).map(([year, subjects]) => (
            <div key={year} className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Badge variant="outline" className="text-base">{year}</Badge>
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((subject) => (
                  <Link key={subject.id} href={`/syllabus/${slug}/${subject.id}`}>
                    <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {subject.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          {subject.code && <Badge variant="secondary">{subject.code}</Badge>}
                          {subject.semester && <Badge variant="outline">{subject.semester}</Badge>}
                          {subject.paper && <Badge variant="outline">{subject.paper}</Badge>}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">
                            {subject._count.chapters} {subject._count.chapters === 1 ? "Chapter" : "Chapters"}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
