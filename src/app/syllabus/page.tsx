import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, FlaskConical, Stethoscope, ArrowRight } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  GraduationCap,
  FlaskConical,
  Stethoscope,
};

const colorMap: Record<string, string> = {
  ahdp: "text-green-600 bg-green-50",
  bvsc: "text-blue-600 bg-blue-50",
  mvsc: "text-purple-600 bg-purple-50",
  phd: "text-orange-600 bg-orange-50",
};

const descriptionMap: Record<string, string> = {
  ahdp: "Comprehensive diploma in animal husbandry practices covering all essential aspects of livestock management.",
  bvsc: "Professional undergraduate degree in veterinary science and animal husbandry as per VCI MSVE-2016 regulations.",
  mvsc: "Advanced postgraduate specializations in various veterinary disciplines with departmental structure.",
  phd: "Doctoral research programs in various veterinary specializations across 18 departments.",
};

export default async function SyllabusPage() {
  const programmes = await prisma.programme.findMany({
    select: {
      id: true,
      name: true,
      fullName: true,
      yearType: true,
      icon: true,
      _count: {
        select: {
          subjects: true,
          departments: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Syllabus</h1>
        <p className="text-muted-foreground max-w-2xl">
          Explore the complete curriculum for all veterinary programmes. Select a programme to view its subjects and detailed syllabus.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {programmes.map((programme) => {
          const slug = programme.name.toLowerCase().replace(/[.\s&]/g, "");
          const Icon = iconMap[programme.icon || "BookOpen"] || BookOpen;
          const colorClass = colorMap[slug] || "text-primary bg-primary/10";
          const description = descriptionMap[slug] || "";

          return (
            <Link key={programme.id} href={`/syllabus/${slug}`}>
              <Card className="h-full hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-primary/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${colorClass}`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {programme.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{programme.fullName}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{description}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {programme.yearType === "semester" ? "Semester System" : programme.yearType === "year" ? "Year System" : "Department Based"}
                    </Badge>
                    {programme._count.subjects > 0 && (
                      <Badge variant="outline">{programme._count.subjects} Subjects</Badge>
                    )}
                    {programme._count.departments > 0 && (
                      <Badge variant="outline">{programme._count.departments} Departments</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
