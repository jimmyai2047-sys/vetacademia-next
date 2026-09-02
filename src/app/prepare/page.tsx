export const metadata = {
  title: "VetAcademia | Exam Preparation",
  description: "Structured preparation tracks for ICAR, PSC, and other veterinary entrance exams.",
};

import { prisma } from "@/lib/prisma";
import { getSignedUrl } from "@/lib/blob";
import { EXAM_PREP_CATEGORIES } from "@/lib/exam-prep";
import ExamPrepTabs from "@/components/exam-prep-tabs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import { GraduationCap, Sparkles } from "lucide-react";
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

export default async function PreparePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-5 max-w-3xl">
        <DecorativePageHeader
          badge="Exam Preparation"
          title="Exam"
          titleHighlight="Preparation"
          description="Structured tracks, previous year papers, and mock tests — login to unlock your personalized exam preparation hub."
          variant="primary"
        />
        <div className="mt-5 va-card-hover relative overflow-hidden rounded-[1.75rem] border border-primary/5 bg-white shadow-sm p-5 md:p-6 text-center">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#005f48] text-white shadow-lg">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-2xl font-bold">Log in to access exam preparation</h2>
          <div className="va-divider-dots my-4 mx-auto max-w-[120px]"><span /></div>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Structured tracks, previous year papers, and mock tests are available to enrolled members. Highly decorative, highly focused preparation.
          </p>
          <Link href={`/login?callbackUrl=${encodeURIComponent(tab ? `/prepare?tab=${tab}` : "/prepare")}`} className={buttonVariants({ size: "lg", className: "gap-2 rounded-xl shadow-md" })}>
            <Sparkles className="h-4 w-4" /> Log In
          </Link>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary/20" />
            Secure • Personalized • Decorative
            <span className="h-px w-8 bg-gradient-to-r from-primary/20 to-transparent" />
          </div>
        </div>
      </div>
    );
  }

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
          body: m.body ? await prepareChapterHtml(m.body) : null,
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

  return (
    <ExamPrepTabs
      key={tab || "all"}
      categories={categories}
      initialTab={tab || undefined}
    />
  );
}
