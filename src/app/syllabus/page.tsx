export const metadata = {
  title: "VetAcademia | Syllabus",
  description: "Browse B.V.Sc, M.V.Sc, Ph.D and AHDP curricula, subjects, and course content on VetAcademia.",
};

import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, FlaskConical, Stethoscope, ArrowRight, Sparkles } from "lucide-react";
import { DecorativePageHeader } from "@/components/decorative/page-header";

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
  ahdp: "from-green-900/80 via-green-900/30 to-transparent",
  bvsc: "from-blue-900/80 via-blue-900/30 to-transparent",
  mvsc: "from-purple-900/80 via-purple-900/30 to-transparent",
  phd: "from-orange-900/80 via-orange-900/30 to-transparent",
};

const descriptionMap: Record<string, string> = {
  ahdp: "Comprehensive diploma in animal husbandry practices covering all essential aspects of livestock management.",
  bvsc: "Professional undergraduate degree in veterinary science and animal husbandry as per VCI MSVE-2016 regulations.",
  mvsc: "Advanced postgraduate specializations in various veterinary disciplines with departmental structure.",
  phd: "Doctoral research programs in various veterinary specializations across 18 departments.",
};

export default async function SyllabusPage() {
  const programmes = await unstable_cache(
    () =>
      prisma.programme.findMany({
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
      }),
    ["syllabus-programmes"],
    { revalidate: 120 }
  )();

  return (
    <div className="container mx-auto px-4 py-8">
      <DecorativePageHeader
        badge="VCI MSVE-2016 • ICAR Approved"
        title="Syllabus"
        titleHighlight="Explorer"
        description="Explore the complete curriculum for all veterinary programmes — subjects and detailed syllabus for A.H.D.P., B.V.Sc & A.H., M.V.Sc, Ph.D in one place."
        variant="primary"
      />
      <div className="va-divider-dots my-8 max-w-[200px] mx-auto"><span /></div>

      <div className="grid md:grid-cols-2 gap-6">
        {programmes.map((programme) => {
          const slug = programmeNameToSlug(programme.name);
          const Icon = iconMap[programme.icon || "BookOpen"] || BookOpen;
          const gradientColor = colorMap[slug] || "from-primary to-primary/80";
          const description = descriptionMap[slug] || "";
          const imageUrl = getProgrammeImage(slug);

          return (
            <Link key={programme.id} href={`/syllabus/${slug}`}>
              <Card className="va-card-hover h-full overflow-hidden rounded-[1.75rem] border border-primary/5 bg-white p-0 shadow-sm hover:shadow-xl group cursor-pointer">
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt={programme.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover group-hover:scale-[1.06] transition-transform duration-700"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${gradientColor}`} />
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-80" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-lg group-hover:bg-white group-hover:text-primary transition-all">
                      <Icon className="h-10 w-10 text-white group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                  <div className="absolute top-4 left-4">
                    <Badge className="rounded-full bg-white/90 backdrop-blur-md text-primary border-0 shadow-md gap-1">
                      <Sparkles className="h-3 w-3" />
                      {programme.yearType === "semester" ? "Semester System" : programme.yearType === "year" ? "Year System" : "Department Based"}
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-2xl font-bold text-white mb-1 group-hover:translate-x-1 transition-transform drop-shadow-lg">
                      {programme.name}
                    </h2>
                    <p className="text-white/90 text-sm font-medium">{programme.fullName}</p>
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
