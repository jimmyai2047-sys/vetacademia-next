import StudyMaterialManager from "@/components/admin/study-material-manager";
import { prisma } from "@/lib/prisma";
import { programmeNameToSlug } from "@/lib/programme";

export const metadata = {
  title: "VetAcademia | Admin · Study Materials",
};

export const dynamic = "force-dynamic";

export default async function AdminStudyMaterialsPage() {
  const programmes = await prisma.programme.findMany({
    orderBy: { name: "asc" },
    include: {
      subjects: {
        orderBy: { name: "asc" },
        include: {
          chapters: {
            orderBy: { unitNumber: "asc" },
            select: {
              id: true,
              title: true,
              unitNumber: true,
              courseCode: true,
              type: true,
            },
          },
        },
      },
    },
  });

  const programmeTree = programmes.map((p) => {
    const slug = programmeNameToSlug(p.name);
    const isPG = slug === "mvsc" || slug === "phd";
    return {
      id: p.id,
      name: p.name,
      slug,
      isPG,
      subjects: p.subjects.map((s) => ({
        id: s.id,
        name: s.name,
        chapters: s.chapters.map((c) => ({
          id: c.id,
          title: c.title,
          unitNumber: c.unitNumber,
          courseCode: c.courseCode,
          type: c.type,
        })),
      })),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Study Materials (UG / PG)</h1>
        <p className="text-muted-foreground">
          Organize content like a flowchart: Programme &rarr; Subject &rarr;
          {` `}(for PG) Course &rarr; Chapter. Open a chapter to view or upload
          its study materials.
        </p>
      </div>
      <StudyMaterialManager programmeTree={programmeTree} />
    </div>
  );
}
