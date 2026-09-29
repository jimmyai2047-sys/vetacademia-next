import { prisma } from "@/lib/prisma";

// Hierarchical sidebar data: Programme → Subjects → Units → Chapters
// (→ Sections for the active chapter). Built server-side and passed as
// serializable props to the client CurriculumSidebar component.

export interface CurriculumSidebarSection {
  index: number;
  title: string;
}

export interface CurriculumSidebarChapter {
  id: string;
  title: string;
  /** 1-based position within its subject (theory units first, then practical). */
  index: number;
  courseCode: string | null;
  /** Only populated for the active chapter. */
  sections?: CurriculumSidebarSection[];
}

export interface CurriculumSidebarUnit {
  unit: string;
  type: "theory" | "practical";
  chapters: CurriculumSidebarChapter[];
}

export interface CurriculumSidebarSubject {
  id: string;
  name: string;
  totalChapters: number;
  units: CurriculumSidebarUnit[];
}

export interface CurriculumSidebarData {
  programme: { name: string; slug: string };
  subjects: CurriculumSidebarSubject[];
}

export async function getCurriculumSidebar(opts: {
  programmeId: string;
  /** Route slug for /syllabus/{slug} links (diploma tracks pass their own). */
  programmeSlug: string;
  activeSubjectId?: string | null;
  activeChapterId?: string | null;
}): Promise<CurriculumSidebarData> {
  const { programmeId, programmeSlug, activeChapterId } = opts;

  const programme = await prisma.programme.findUnique({
    where: { id: programmeId },
    select: { name: true },
  });

  const subjects = await prisma.subject.findMany({
    where: { programmeId },
    orderBy: [{ year: "asc" }, { semester: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      chapters: {
        orderBy: [{ unitNumber: "asc" }, { title: "asc" }],
        select: { id: true, title: true, type: true, unitNumber: true, courseCode: true },
      },
    },
  });

  // Sections (lectures) only for the chapter currently open — keeps the
  // payload small while making the active chapter expandable to its lectures.
  const sectionsByChapter = new Map<string, CurriculumSidebarSection[]>();
  if (activeChapterId) {
    const secs = await prisma.chapterSection.findMany({
      where: { chapterId: activeChapterId },
      orderBy: { order: "asc" },
      select: { title: true },
    });
    sectionsByChapter.set(
      activeChapterId,
      secs.map((s, i) => ({ index: i, title: s.title }))
    );
  }

  const groupUnits = (
    chapters: { id: string; title: string; type: string | null; unitNumber: number; courseCode: string | null }[]
  ): { units: CurriculumSidebarUnit[]; total: number } => {
    const theory = chapters.filter((c) => c.type !== "PRACTICAL");
    const practical = chapters.filter((c) => c.type === "PRACTICAL");
    const units: CurriculumSidebarUnit[] = [];
    let idx = 0;
    for (const [list, type] of [
      [theory, "theory"],
      [practical, "practical"],
    ] as const) {
      const byUnit = new Map<number, typeof list>();
      for (const ch of list) {
        if (!byUnit.has(ch.unitNumber)) byUnit.set(ch.unitNumber, []);
        byUnit.get(ch.unitNumber)!.push(ch);
      }
      for (const [unitNumber, unitChapters] of [...byUnit.entries()].sort((a, b) => a[0] - b[0])) {
        units.push({
          unit: `Unit ${unitNumber}`,
          type,
          chapters: unitChapters.map((ch) => ({
            id: ch.id,
            title: ch.title,
            index: ++idx,
            courseCode: ch.courseCode,
            ...(sectionsByChapter.has(ch.id) ? { sections: sectionsByChapter.get(ch.id)! } : {}),
          })),
        });
      }
    }
    return { units, total: chapters.length };
  };

  return {
    programme: { name: programme?.name ?? "", slug: programmeSlug },
    subjects: subjects.map((s) => {
      const { units, total } = groupUnits(s.chapters);
      return { id: s.id, name: s.name, totalChapters: total, units };
    }),
  };
}
