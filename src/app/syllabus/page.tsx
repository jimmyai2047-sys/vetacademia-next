export const metadata = {
  title: "VetAcademia | Syllabus",
  description: "Browse B.V.Sc, M.V.Sc, Ph.D and AHDP curricula, subjects, and course content on VetAcademia.",
};

import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, FlaskConical, Stethoscope, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";
import { getProgrammeImage } from "@/lib/subject-images";
import { programmeNameToSlug } from "@/lib/programme";



const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  GraduationCap,
  FlaskConical,
  Stethoscope,
};

const colorMap: Record<string, string> = {
  ahdp: "from-green-600 to-green-800",
  bvsc: "from-blue-600 to-blue-800",
  mvsc: "from-purple-600 to-purple-800",
  phd: "from-orange-600 to-orange-800",
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
          const slug = programmeNameToSlug(programme.name);
          const Icon = iconMap[programme.icon || "BookOpen"] || BookOpen;
          const gradientColor = colorMap[slug] || "from-primary to-primary/80";
          const description = descriptionMap[slug] || "";
          const imageUrl = getProgrammeImage(slug);

          return (
            <Link key={programme.id} href={`/syllabus/${slug}`}>
              <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-0">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt={programme.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${gradientColor} opacity-80`} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="h-16 w-16 text-white/60" />
                  </div>
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/20 text-white border-white/30 text-xs">
                      {programme.yearType === "semester" ? "Semester System" : programme.yearType === "year" ? "Year System" : "Department Based"}
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-2xl font-bold text-white mb-1 group-hover:translate-x-1 transition-transform">
                      {programme.name}
                    </h2>
                    <p className="text-white/80 text-sm">{programme.fullName}</p>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-3">{description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {programme._count.subjects > 0 && (
                        <Badge variant="secondary">{programme._count.subjects} Subjects</Badge>
                      )}
                      {programme._count.departments > 0 && (
                        <Badge variant="secondary">{programme._count.departments} Departments</Badge>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1" />
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
