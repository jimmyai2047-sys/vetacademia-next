export const metadata = {
  title: "VetAcademia | Exam Preparation",
  description: "Structured preparation tracks for ICAR, PSC, and other veterinary entrance exams.",
};

import { prisma } from "@/lib/prisma";
import { getSignedUrl } from "@/lib/blob";
import { EXAM_PREP_CATEGORIES } from "@/lib/exam-prep";
import { isStudyToolSubject } from "@/lib/subjects";
import ExamPrepTabs from "@/components/exam-prep-tabs";
import { prepareChapterHtml } from "@/lib/chapter-images";

export const dynamic = "force-dynamic";

function ytEmbed(url?: string | null): string | null {
  if (!url) return null;
  let id: string | null = null;
  const m = url.match(/[?&]v=([^&]+)/);
  if (m) id = m[1];
  const m2 = url.match(/youtu\.be\/([^?&]+)/);
  if (m2) id = m2[1];
  if (id) return `https://www.youtube.com/embed/${id}`;
  return null;
}

type PreparedCategory = {
  key: string;
  label: string;
  materials: {
    id: string;
    type: string;
    title: string;
    description: string | null;
    body: string | null;
    downloadUrl: string | null;
    externalUrl: string | null;
    embedUrl: string | null;
    subject: string | null;
    topic: string | null;
  }[];
  papers: { id: string; title: string; downloadUrl: string | null }[];
  mockTests: { id: string; title: string; questions: number; duration: number }[];
  adaptiveTests: {
    id: string;
    title: string;
    questions: number;
    duration: number;
  }[];
  lsaSubjects?: {
    id: string;
    name: string;
    code: string | null;
    chapterCount: number;
    materialCount: number;
  }[];
  dvpSubjects?: {
    id: string;
    name: string;
    code: string | null;
    chapterCount: number;
    materialCount: number;
  }[];
};

export default async function PreparePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; state?: string }>;
}) {
  const { tab, state } = await searchParams;
  // Step A (Nov 2026): no login gate — the whole prep hub is public.

  let categories: PreparedCategory[] = [];
  try {
    categories = await Promise.all(
      EXAM_PREP_CATEGORIES.map(async (c) => {
      const materials = await prisma.examMaterial.findMany({
        where: { category: c.key, published: true, isDemo: false },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        take: 200,
      });
      const mats = await Promise.all(
        materials.map(async (m) => ({
          id: m.id,
          type: m.type,
          title: m.title,
          description: m.description,
          body: m.body ? await prepareChapterHtml(m.body) : null,
          downloadUrl: m.fileUrl ? await getSignedUrl(m.fileUrl) : null,
          externalUrl: m.externalUrl,
          embedUrl: ytEmbed(m.externalUrl),
          subject: (m as any).subject || null,
          topic: (m as any).topic || null,
        }))
      );

      // For LSA, fetch AHDP subjects to show as plates (same subjects as AHDP programme)
      let lsaSubjects: PreparedCategory["lsaSubjects"] = undefined;
      if (c.key === "LSA") {
        const ahdpSubjects = (
          await prisma.subject.findMany({
            where: { programme: { name: "A.H.D.P." } },
            orderBy: [{ name: "asc" }],
            select: {
              id: true,
              name: true,
              code: true,
              _count: { select: { chapters: { where: { status: "PUBLISHED" } } } },
            },
          })
        ).filter((s) => !isStudyToolSubject(s));
        // ExamMaterials per subject name (case-sensitive, as stored) for the
        // exam-resource count; `chapterCount` below is the CURRICULUM count
        // from the Chapter table — the two are tracked separately on purpose.
        const counts = new Map<string, number>();
        for (const m of materials) if ((m as any).subject) counts.set((m as any).subject, (counts.get((m as any).subject) || 0) + 1);
        lsaSubjects = ahdpSubjects.map((s) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          chapterCount: s._count.chapters,
          materialCount: counts.get(s.name) || 0,
        }));
      }

      // For UP Pharmacist, fetch DVP (Uttar Pradesh) subjects as plates
      let dvpSubjects: PreparedCategory["dvpSubjects"] = undefined;
      if (c.key === "UP_PHARMACIST") {
        const dvpSubs = (
          await prisma.subject.findMany({
            where: { programme: { name: "DVP" } },
            orderBy: [{ code: "asc" }],
            select: {
              id: true,
              name: true,
              code: true,
              _count: { select: { chapters: { where: { status: "PUBLISHED" } } } },
            },
          })
        ).filter((s) => !isStudyToolSubject(s));
        const counts = new Map<string, number>();
        for (const m of materials) if ((m as any).subject) counts.set((m as any).subject, (counts.get((m as any).subject) || 0) + 1);
        dvpSubjects = dvpSubs.map((s) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          chapterCount: s._count.chapters,
          materialCount: counts.get(s.name) || 0,
        }));
      }

      const papers = await prisma.post.findMany({
        where: {
          category: "PREVIOUS_YEAR",
          track: { in: c.tracks },
          published: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      const paperList = await Promise.all(
        papers.map(async (p) => ({
          id: p.id,
          title: p.title,
          downloadUrl: p.fileUrl ? await getSignedUrl(p.fileUrl) : null,
        }))
      );

      const mockTests = await prisma.mockTest.findMany({
        where: { track: { in: c.tracks }, isAdaptive: false },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { _count: { select: { questions: true } } },
      });
      const adaptiveTests = await prisma.mockTest.findMany({
        where: { track: { in: c.tracks }, isAdaptive: true },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { _count: { select: { questions: true } } },
      });

      const mapTest = (t: {
        id: string;
        title: string;
        _count: { questions: number };
        duration: number;
      }) => ({
        id: t.id,
        title: t.title,
        questions: t._count.questions,
        duration: t.duration,
      });

      return {
        key: c.key,
        label: c.label,
        materials: mats,
        papers: paperList,
        mockTests: mockTests.map(mapTest),
        adaptiveTests: adaptiveTests.map(mapTest),
        lsaSubjects,
        dvpSubjects,
      };
      })
    );
  } catch {
    categories = [];
  }

  return (
    <ExamPrepTabs
      key={`${tab || "all"}:${state || ""}`}
      categories={categories}
      initialTab={tab || undefined}
      initialState={state || undefined}
    />
  );
}
