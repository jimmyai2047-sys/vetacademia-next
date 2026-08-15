import { prisma } from "@/lib/prisma";
import { getSignedUrl } from "@/lib/blob";
import { EXAM_PREP_CATEGORIES } from "@/lib/exam-prep";
import ExamPrepTabs from "@/components/exam-prep-tabs";

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
    downloadUrl: string | null;
    externalUrl: string | null;
    embedUrl: string | null;
  }[];
  papers: { id: string; title: string; downloadUrl: string | null }[];
  mockTests: { id: string; title: string; questions: number; duration: number }[];
  adaptiveTests: {
    id: string;
    title: string;
    questions: number;
    duration: number;
  }[];
};

export default async function PreparePage() {
  const categories: PreparedCategory[] = await Promise.all(
    EXAM_PREP_CATEGORIES.map(async (c) => {
      const materials = await prisma.examMaterial.findMany({
        where: { category: c.key, published: true },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      });
      const mats = await Promise.all(
        materials.map(async (m) => ({
          id: m.id,
          type: m.type,
          title: m.title,
          description: m.description,
          downloadUrl: m.fileUrl ? await getSignedUrl(m.fileUrl) : null,
          externalUrl: m.externalUrl,
          embedUrl: ytEmbed(m.externalUrl),
        }))
      );

      const papers = await prisma.post.findMany({
        where: {
          category: "PREVIOUS_YEAR",
          track: { in: c.tracks },
          published: true,
        },
        orderBy: { createdAt: "desc" },
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
        include: { _count: { select: { questions: true } } },
      });
      const adaptiveTests = await prisma.mockTest.findMany({
        where: { track: { in: c.tracks }, isAdaptive: true },
        orderBy: { createdAt: "desc" },
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
      };
    })
  );

  return <ExamPrepTabs categories={categories} />;
}
