import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAccess } from "@/lib/access";
import { programmeNameToSlug } from "@/lib/programme";
import PracticePage from "@/components/practice-page";
import EnrollCta from "@/components/enroll-cta";

export const dynamic = "force-dynamic";

export default async function PracticeRoute({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = await params;
  const access = await getAccess();

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          year: true,
          programme: { select: { name: true } },
        },
      },
      mcqs: { orderBy: { order: "asc" } },
    },
  });

  if (!chapter) notFound();

  const progSlug = programmeNameToSlug(chapter.subject.programme.name);
  const programmeOwned = access.programmeSlugs.has(progSlug);
  const yearOwned =
    (progSlug === "bvsc" || progSlug === "ahdp") && chapter.subject.year
      ? access.ownedYearScopes.has(`${progSlug}:${chapter.subject.year}`)
      : false;
  const subjectOwned = access.ownedSubjectIds.has(chapter.subject.id);
  const hasAccess = access.isAdmin || programmeOwned || yearOwned || subjectOwned;

  if (!access.isAuthed) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-2xl text-center">
        <h1 className="text-xl font-semibold mb-2">Login required</h1>
        <p className="text-muted-foreground mb-4">
          Sign in to practice MCQs for this chapter.
        </p>
        <Link
          href={`/login?redirect=${encodeURIComponent(`/reader/${chapterId}/practice`)}`}
          className="text-primary underline font-medium"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <EnrollCta
          planSlug={progSlug}
          title="Enroll to practice"
          message="Enroll in this programme to unlock chapter MCQs and practice tests."
        />
      </div>
    );
  }

  if (chapter.mcqs.length === 0) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <p className="text-muted-foreground">
          No practice questions are available for this chapter yet.
        </p>
      </div>
    );
  }

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
      programmeSlug={progSlug}
      subjectId={chapter.subject.id}
      mcqs={mcqs}
    />
  );
}
