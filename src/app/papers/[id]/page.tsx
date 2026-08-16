import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MockTestPlayer from "@/components/mock-test-player";
import { getAccess } from "@/lib/access";
import EnrollCta from "@/components/enroll-cta";

export const dynamic = "force-dynamic";

export default async function PreviousYearPaperPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const test = await prisma.mockTest.findUnique({
    where: { id, kind: "PREVIOUS_YEAR" },
    include: { questions: { orderBy: { createdAt: "asc" } } },
  });
  if (!test) notFound();

  const subject = test.subjectId
    ? await prisma.subject.findUnique({
        where: { id: test.subjectId },
        select: { programme: { select: { name: true } } },
      })
    : null;
  const progSlug = subject
    ? subject.programme.name.toLowerCase().replace(/[.\s&]/g, "")
    : null;

  const access = await getAccess();
  const hasAccess =
    !progSlug || access.programmeSlugs.has(progSlug) || access.examPlanOwned;

  const questions = test.questions.map((q) => {
    let opts: string[] = [];
    try {
      opts = JSON.parse(q.options);
    } catch {
      opts = [];
    }
    return {
      id: q.id,
      text: q.text,
      options: opts,
      correctAnswer: q.correctAnswer,
      marks: q.marks,
      explanation: q.explanation,
    };
  });

  const title = test.year ? `${test.title} (${test.year})` : test.title;

  if (!hasAccess && progSlug) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <EnrollCta
          planSlug={progSlug}
          title="Enroll to access this paper"
          message="Enroll in this programme to unlock its previous year papers and solutions."
        />
      </div>
    );
  }

  return (
    <MockTestPlayer
      testId={test.id}
      title={title}
      duration={test.duration}
      totalMarks={test.totalMarks}
      questions={questions}
    />
  );
}
