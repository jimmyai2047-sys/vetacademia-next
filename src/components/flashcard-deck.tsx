"use client";

import { useState, useEffect, useCallback } from "react";
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
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { TestStatsSidebar } from "@/components/test-stats";

export type Flashcard = {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string | null;
  mockTestTitle: string | null;
};

const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export default function FlashcardDeck({
  cards,
  duration,
}: {
  cards: Flashcard[];
  duration?: number;
}) {
  const [order, setOrder] = useState<number[]>(() => cards.map((_, i) => i));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [known, setKnown] = useState<string[]>([]);
  const [unknown, setUnknown] = useState<string[]>([]);

  const hasDuration = !!duration && duration > 0;
  const totalSeconds = hasDuration ? duration * 60 : 0;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      if (hasDuration) setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
      else setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [hasDuration]);

  const card = cards[order[index]];

  const markReviewed = useCallback((id: string) => {
    setReviewed((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

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

  const mark = (correct: boolean) => {
    markReviewed(card.id);
    if (correct) {
      setKnown((prev) => (prev.includes(card.id) ? prev : [...prev, card.id]));
    } else {
      setUnknown((prev) =>
        prev.includes(card.id) ? prev : [...prev, card.id]
      );
    }
    go(1);
  };

  const totalTime = hasDuration ? `${duration} min` : fmtTime(elapsed);
  const timeRemaining = hasDuration ? fmtTime(secondsLeft) : fmtTime(elapsed);

  return (
    <div className="lg:grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
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
            <CardTitle className="text-lg leading-relaxed">
              {card.text}
            </CardTitle>
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
          <CardFooter className="flex flex-col gap-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setRevealed((r) => {
                  const next = !r;
                  if (next) markReviewed(card.id);
                  return next;
                });
              }}
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

            {revealed && (
              <div className="grid grid-cols-2 gap-3 w-full">
                <Button
                  variant="outline"
                  className="border-green-500 text-green-700 hover:bg-green-50"
                  onClick={() => mark(true)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Correct
                </Button>
                <Button
                  variant="outline"
                  className="border-red-500 text-red-700 hover:bg-red-50"
                  onClick={() => mark(false)}
                >
                  <XCircle className="h-4 w-4 mr-2" /> Wrong
                </Button>
              </div>
            )}
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

      <aside className="lg:col-span-1 mt-6 lg:mt-0">
        <TestStatsSidebar
          total={order.length}
          attempted={reviewed.length}
          correct={known.length}
          wrong={unknown.length}
          totalTime={totalTime}
          timeRemaining={timeRemaining}
        />
      </aside>
    </div>
  );
}
