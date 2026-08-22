import { notFound } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import PracticePage from "@/components/practice-page";

export const dynamic = "force-dynamic";

const envUrl = process.env.DATABASE_URL!;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: envUrl }),
});

export default async function PracticeRoute({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = await params;

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      subject: { include: { programme: true } },
      mcqs: { orderBy: { order: "asc" } },
    },
  });

  if (!chapter) notFound();

  const mcqs = chapter.mcqs.map((m) => ({
    id: m.id,
    question: m.question,
    options: (() => {
      try {
        const raw = m.options;
        if (Array.isArray(raw)) return raw as string[];
        const parsed = JSON.parse(raw as string);
        return Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {
        return [];
      }
    })(),
    correctIndex: m.correctIndex,
    explanation: m.explanation,
    marks: m.marks,
  }));

  return (
    <PracticePage
      chapterId={chapterId}
      chapterTitle={chapter.title}
      subjectName={chapter.subject.name}
      programmeSlug={chapter.subject.programme.slug}
      subjectId={chapter.subject.id}
      mcqs={mcqs}
    />
  );
}
