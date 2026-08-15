"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Eye,
  EyeOff,
} from "lucide-react";

export type Flashcard = {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string | null;
  mockTestTitle: string | null;
};

export default function FlashcardDeck({ cards }: { cards: Flashcard[] }) {
  const [order, setOrder] = useState<number[]>(() =>
    cards.map((_, i) => i)
  );
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const card = cards[order[index]];

  const go = useCallback(
    (delta: number) => {
      setRevealed(false);
      setIndex((prev) => {
        const next = prev + delta;
        if (next < 0) return order.length - 1;
        if (next >= order.length) return 0;
        return next;
      });
    },
    [order.length]
  );

  const shuffle = useCallback(() => {
    setRevealed(false);
    setIndex(0);
    setOrder((prev) => {
      const arr = [...prev];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    });
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
        <span>
          Card {index + 1} of {order.length}
        </span>
        {card.mockTestTitle && (
          <Badge variant="outline">{card.mockTestTitle}</Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg leading-relaxed">{card.text}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {card.options.map((opt, i) => {
              const isCorrect = i === card.correctAnswer;
              return (
                <div
                  key={i}
                  className={
                    "flex items-center gap-2 rounded-lg border p-3 text-sm " +
                    (revealed && isCorrect
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      : "border-border")
                  }
                >
                  <span className="font-medium text-muted-foreground">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <span>{opt}</span>
                </div>
              );
            })}
          </div>

          {revealed && card.explanation && (
            <div className="rounded-lg bg-muted/50 p-4 text-sm">
              <p className="font-medium mb-1">Explanation</p>
              <p className="text-muted-foreground">{card.explanation}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setRevealed((r) => !r)}
          >
            {revealed ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" /> Hide Answer
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" /> Show Answer
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <div className="flex items-center justify-between mt-4">
        <Button variant="outline" onClick={() => go(-1)}>
          <ChevronLeft className="h-4 w-4 mr-2" /> Previous
        </Button>
        <Button variant="outline" onClick={shuffle}>
          <Shuffle className="h-4 w-4 mr-2" /> Shuffle
        </Button>
        <Button variant="outline" onClick={() => go(1)}>
          Next <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
