export const metadata = {
  title: "VetAcademia | Flashcards",
  description: "Revision flashcards to reinforce key veterinary concepts.",
};

import { prisma } from "@/lib/prisma";
import FlashcardDeck from "@/components/flashcard-deck";
import BookmarkButton from "@/components/bookmark-button";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import { Layers, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FlashcardsPage() {
  const questions = await prisma.question.findMany({
    take: 20,
    where: { mockTest: { kind: { not: "PREVIOUS_YEAR" } } },
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <DecorativePageHeader
        badge="Quick Revision"
        title="Flash"
        titleHighlight="cards"
        description="Quick-revision flashcards built from real practice questions. Reveal the answer, then move through the deck at your own pace — highly decorative, highly retentive."
        variant="primary"
      />
      <div className="mt-4 flex justify-end">
        <BookmarkButton
          type="flashcard"
          refId="flashcards"
          title="Flashcards"
          url="/flashcards"
        />
      </div>

      <div className="va-divider-dots my-6"><span /></div>

      {cards.length === 0 ? (
        <div className="va-card-hover rounded-[1.5rem] border border-primary/5 bg-muted/40 p-10 text-center text-muted-foreground shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-3">
            <Layers className="h-6 w-6 text-primary" />
          </div>
          No flashcards available yet. Questions will appear here once mock tests
          have been added.
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-[#d4a843]" /> Add mock tests in admin to generate deck
          </div>
        </div>
      ) : (
        <div className="va-card-hover rounded-[1.75rem] border border-primary/5 bg-white p-2 shadow-sm">
          <div className="h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary rounded-full mb-2 opacity-60" />
          <FlashcardDeck
            cards={cards}
            duration={Math.max(3, Math.round(cards.length * 0.5))}
          />
        </div>
      )}
    </div>
  );
}
