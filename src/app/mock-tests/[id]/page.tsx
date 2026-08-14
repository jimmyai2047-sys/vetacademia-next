import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MockTestPlayer from "@/components/mock-test-player";

export const dynamic = "force-dynamic";

export default async function MockTestAttemptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const test = await prisma.mockTest.findUnique({
    where: { id },
    include: { questions: { orderBy: { createdAt: "asc" } } },
  });
  if (!test) notFound();

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

  return (
    <MockTestPlayer
      testId={test.id}
      title={test.title}
      duration={test.duration}
      totalMarks={test.totalMarks}
      questions={questions}
    />
  );
}
