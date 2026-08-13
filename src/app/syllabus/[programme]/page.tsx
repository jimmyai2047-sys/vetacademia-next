import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, FlaskConical, Stethoscope, ArrowLeft, ArrowRight } from "lucide-react";
import { getSubjectImage } from "@/lib/subject-images";

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
        <div>
          <h2 className="text-xl font-semibold mb-6">Departments</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programme.departments.map((dept) => {
              const imageUrl = getSubjectImage(dept.name);
              return (
                <Link key={dept.id} href={`/syllabus/${slug}/${dept.id}`}>
                  <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-0">
                    <div className="relative h-40 overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={dept.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-4xl font-bold opacity-30">
                          {dept._count.subjects}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <Badge className="bg-white/20 text-white border-white/30 text-xs">
                          {dept._count.subjects} {dept._count.subjects === 1 ? "Subject" : "Subjects"}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base group-hover:text-primary transition-colors leading-tight">
                          {dept.name}
                        </CardTitle>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programme.subjects.map((subject) => {
              const imageUrl = getSubjectImage(subject.name);
              return (
                <Link key={subject.id} href={`/syllabus/${slug}/${subject.id}`}>
                  <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-0">
                    <div className="relative h-48 overflow-hidden">
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
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {subject.semester && <Badge variant="outline" className="text-xs">{subject.semester}</Badge>}
                        {subject.paper && <Badge variant="outline" className="text-xs">{subject.paper}</Badge>}
                        {subject.year && <Badge variant="outline" className="text-xs">{subject.year}</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
