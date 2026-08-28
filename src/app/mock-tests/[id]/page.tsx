export const metadata = {
  title: "VetAcademia | Mock Test",
  description: "Take this timed mock test and review your performance on VetAcademia.",
};

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MockTestPlayer from "@/components/mock-test-player-lazy";
import { getAccess } from "@/lib/access";
import { programmeNameToSlug } from "@/lib/programme";
import { planSlugForExam } from "@/lib/plans";
import EnrollCta from "@/components/enroll-cta";



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

  const subject = test.subjectId
    ? await prisma.subject.findUnique({
        where: { id: test.subjectId },
        select: { id: true, year: true, programme: { select: { name: true } } },
      })
    : null;
  const progSlug = subject
    ? programmeNameToSlug(subject.programme.name)
    : null;

  const access = await getAccess();
  const programmeOwned = progSlug
    ? access.programmeSlugs.has(progSlug)
    : false;
  const yearOwned =
    subject && (progSlug === "bvsc" || progSlug === "ahdp") && subject.year
      ? access.ownedYearScopes.has(`${progSlug}:${subject.year}`)
      : false;
  const subjectOwned = subject
    ? access.ownedSubjectIds.has(subject.id)
    : false;
  const examOwned = test.exam
    ? access.examKeys.has(test.exam)
    : access.examPlanOwned;

  // Free general tests (no programme, no exam) are open to everyone, matching
  // the original behaviour. Programme tests gate on programme/year/subject
  // plans; exam tests gate on the matching exam plan. The `!progSlug` shortcut
  // must NOT apply to exam tests, or they would become publicly accessible.
  let hasAccess: boolean;
  if (test.isDemo) {
    hasAccess = true;
  } else if (test.kind === "PREVIOUS_YEAR") {
    // Previous year papers are free for everyone (browsable as mock tests)
    hasAccess = true;
  } else if (test.exam) {
    hasAccess = examOwned || (test.exam === "other" && access.isAuthed);
  } else if (progSlug) {
    hasAccess = programmeOwned || yearOwned || subjectOwned;
  } else {
    hasAccess = true;
  }

  // Strip correctAnswer/explanation from the initial client payload; the player
  // fetches them only at review time via the attempt API. Adaptive (CAT) tests
  // need correctAnswer mid-test to adapt difficulty, so keep it for those only.
  const questions = test.questions.map((q) => {
    let opts: string[] = [];
    try {
      opts = JSON.parse(q.options);
    } catch {
      opts = [];
    }
    const base = {
      id: q.id,
      text: q.text,
      options: opts,
      marks: q.marks,
      difficulty: q.difficulty,
    };
    if (test.isAdaptive) {
      return { ...base, correctAnswer: q.correctAnswer };
    }
    return base;
  });

  if (!hasAccess) {
    const planSlug =
      progSlug || (test.exam ? planSlugForExam(test.exam) : "bvsc");
    return (
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <EnrollCta
          planSlug={planSlug ?? "bvsc"}
          title="Enroll to access this mock test"
          message="Enroll in this programme to unlock its mock tests and performance analytics."
        />
      </div>
    );
  }

  return (
    <MockTestPlayer
      testId={test.id}
      title={test.title}
      duration={test.duration}
      totalMarks={test.totalMarks}
      questions={questions}
      adaptive={test.isAdaptive}
    />
  );
}
