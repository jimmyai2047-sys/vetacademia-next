import { prisma } from "@/lib/prisma";
import FlashcardDeck from "@/components/flashcard-deck";

export const dynamic = "force-dynamic";

export const metadata = { title: "Flashcards | VetAcademia" };

export default async function FlashcardsPage() {
  const questions = await prisma.question.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: { mockTest: { select: { title: true } } },
  });

  const cards = questions.map((q) => {
    let options: string[] = [];
    try {
      options = JSON.parse(q.options);
    } catch {
      options = [];
    }
    return {
      id: q.id,
      text: q.text,
      options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      mockTestTitle: q.mockTest?.title ?? null,
    };
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">Flashcards</h1>
      <p className="text-muted-foreground mb-8">
        Quick-revision flashcards built from real practice questions. Reveal the
        answer, then move through the deck at your own pace.
      </p>

      {cards.length === 0 ? (
        <div className="rounded-xl border bg-muted/40 p-8 text-center text-muted-foreground">
          No flashcards available yet. Questions will appear here once mock tests
          have been added.
        </div>
      ) : (
        <FlashcardDeck cards={cards} />
      )}
    </div>
  );
}
