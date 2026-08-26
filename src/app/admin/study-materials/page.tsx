import StudyMaterialManager from "@/components/admin/study-material-manager";
import { prisma } from "@/lib/prisma";
import { programmeNameToSlug } from "@/lib/programme";
import { Crown, Sparkles, Shield, BookOpen } from "lucide-react";

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
      {/* Royal Gradient Header */}
      <div className="relative overflow-hidden rounded-[1.25rem] border border-primary/10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#003d2e] via-primary to-[#005f48]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-[#d4a843]/15 blur-3xl" />
        <div className="relative px-6 py-7 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1 text-xs font-bold tracking-widest uppercase">
              <Crown className="h-3.5 w-3.5 text-[#d4a843]" /> Royal Study Hub
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Study Materials (UG / PG)</h1>
            <p className="mt-1 text-white/70 flex items-center gap-2 text-sm max-w-2xl">
              <Shield className="h-3.5 w-3.5 text-[#d4a843] shrink-0" /> Organize content like a flowchart: Programme &rarr; Subject &rarr;{` `}(for PG) Course &rarr; Chapter. Open a chapter to view or upload its study materials.
            </p>
          </div>
          <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a843] text-[#003d2e] shadow-lg shrink-0">
            <BookOpen className="h-6 w-6" />
          </div>
        </div>
      </div>
      <div className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm p-5">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60" />
        <StudyMaterialManager programmeTree={programmeTree} />
      </div>
    </div>
  );
}
