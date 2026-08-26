"use client";

import { useState, useEffect, useMemo } from "react";
import { csrfFetch } from "@/lib/csrf-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { TestStatsSidebar } from "@/components/test-stats";
import { nextDifficulty, difficultyLabel } from "@/lib/adaptive";

type Q = {
  id: string;
  text: string;
  options: string[];
  correctAnswer?: number;
  marks: number;
  explanation?: string | null;
  difficulty?: number | null;
};

type ReviewEntry = { correctAnswer: number; explanation: string | null };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MockTestPlayer({
  testId,
  title,
  duration,
  totalMarks,
  questions,
  adaptive = false,
}: {
  testId: string;
  title: string;
  duration: number;
  totalMarks: number;
  questions: Q[];
  adaptive?: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // correctAnswer/explanation are only fetched from the server at review time
  // (the initial payload omits them). review[qid] holds the server-provided
  // values, falling back to any value already present (e.g. adaptive tests).
  const [review, setReview] = useState<Record<string, ReviewEntry>>({});
  const correctAnswerOf = (q: Q): number | undefined =>
    review[q.id]?.correctAnswer ?? q.correctAnswer;
  const explanationOf = (q: Q): string | null | undefined =>
    review[q.id]?.explanation ?? q.explanation;

  const totalSeconds = duration * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Live countdown timer.
  useEffect(() => {
    if (submitted || secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [submitted, secondsLeft]);

  // Auto-submit when time runs out.
  useEffect(() => {
    if (secondsLeft <= 0 && !submitted) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const attempted = Object.keys(answers).length;
  const correct = submitted
    ? questions.filter((q) => answers[q.id] === correctAnswerOf(q)).length
    : 0;
  const wrong = submitted
    ? questions.filter(
        (q) =>
          answers[q.id] !== undefined &&
          answers[q.id] !== correctAnswerOf(q)
      ).length
    : 0;

  function select(qid: string, idx: number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qid]: idx }));
  }

  async function submit() {
    setSubmitted(true);

    try {
      const res = await csrfFetch(`/api/mock-tests/${testId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalMarks,
          answers,
        }),
      });
      if (res.ok) {
        setSaved(true);
        const data = await res.json().catch(() => ({}));
        if (typeof data?.attempt?.score === "number") {
          setScore(data.attempt.score);
        }
        if (Array.isArray(data?.review)) {
          const map: Record<string, ReviewEntry> = {};
          for (const r of data.review) {
            map[r.id] = {
              correctAnswer: r.correctAnswer,
              explanation: r.explanation,
            };
          }
          setReview(map);
        }
      } else {
        setSaveError(true);
      }
    } catch {
      // Network error: progress not persisted, but the result is still shown locally.
      setSaveError(true);
    }
  }

  function reset() {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setSaved(false);
    setSaveError(false);
    setCurrentDifficulty(2);
    setAskedOrder([]);
    setCurrentQid(
      adaptive
        ? (pools[2][0] ?? pools[1][0] ?? pools[3][0] ?? null)
        : null
    );
  }

  // ---- Adaptive (CAT) state ----
  const pools = useMemo(() => {
    const p: Record<number, string[]> = { 1: [], 2: [], 3: [] };
    questions.forEach((q) => {
      const d =
        q.difficulty && q.difficulty >= 1 && q.difficulty <= 3
          ? q.difficulty
          : 2;
      p[d].push(q.id);
    });
    p[1] = shuffle(p[1]);
    p[2] = shuffle(p[2]);
    p[3] = shuffle(p[3]);
    return p;
  }, [questions]);

  const [currentDifficulty, setCurrentDifficulty] = useState<number>(2);
  const [askedOrder, setAskedOrder] = useState<string[]>([]);
  const [currentQid, setCurrentQid] = useState<string | null>(null);

  useEffect(() => {
    if (adaptive && !currentQid && !submitted && askedOrder.length === 0) {
      const first = pools[2][0] ?? pools[1][0] ?? pools[3][0] ?? null;
      setCurrentQid(first);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adaptive, pools, submitted]);

  function advanceAdaptive() {
    const qid = currentQid;
    if (!qid) return;
    const q = questions.find((x) => x.id === qid);
    if (!q) return;
    const isCorrect = answers[qid] === correctAnswerOf(q);
    const nd = nextDifficulty(currentDifficulty, isCorrect);

    let nextQid: string | null = null;
    const candidates = [nd, nd - 1, nd + 1, 1, 2, 3];
    for (const d of candidates) {
      const cand = pools[d]?.find(
        (id) => id !== qid && !askedOrder.includes(id)
      );
      if (cand) {
        nextQid = cand;
        break;
      }
    }

    const newOrder = [...askedOrder, qid];
    setAskedOrder(newOrder);
    setCurrentDifficulty(nd);

    if (nextQid) {
      setCurrentQid(nextQid);
    } else {
      setCurrentQid(null);
      submit();
    }
  }

  // ---- Adaptive: pick the single question to show ----
  const currentQ = adaptive
    ? questions.find((q) => q.id === currentQid) ?? null
    : null;
  const resultQuestions =
    submitted && adaptive
      ? questions.filter((q) => askedOrder.includes(q.id))
      : questions;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/mock-tests"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Mock Tests
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">
            {duration} min &middot; {questions.length} questions &middot; {totalMarks} marks
            {adaptive && (
              <Badge variant="secondary" className="ml-2">
                Adaptive
              </Badge>
            )}
          </p>
        </div>
        {submitted && (
          <Button variant="outline" onClick={reset} className="shrink-0">
            <RotateCcw className="h-4 w-4 mr-1" /> Retake
          </Button>
        )}
      </div>

      {submitted && (
        <Card className="mb-6 bg-primary/5">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold">
              {score} / {totalMarks}
            </div>
            <p className="text-muted-foreground">Your score</p>
            {saved && (
              <p className="text-xs text-green-600 mt-1">Saved to your progress</p>
            )}
            {saveError && (
              <p className="text-xs text-amber-600 mt-1">
                Couldn&apos;t save to your progress. Please retry.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="lg:grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {adaptive && !submitted && currentQ ? (
            <AdaptiveQuestion
              q={currentQ}
              index={askedOrder.length + 1}
              difficulty={currentDifficulty}
              chosen={answers[currentQ.id]}
              onSelect={(idx) => select(currentQ.id, idx)}
              onNext={advanceAdaptive}
              canNext={answers[currentQ.id] !== undefined}
              total={questions.length}
              asked={askedOrder.length + 1}
            />
          ) : (
            resultQuestions.map((q, i) => {
              const chosen = answers[q.id];
              const isCorrect = submitted && chosen === correctAnswerOf(q);
              const isWrong =
                submitted &&
                chosen !== undefined &&
                chosen !== correctAnswerOf(q);
              return (
                <Card key={q.id}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {i + 1}. {q.text}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {q.marks} marks
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {q.options.map((opt, oi) => {
                      const showCorrect = submitted && oi === correctAnswerOf(q);
                      const showWrong =
                        submitted && chosen === oi && oi !== correctAnswerOf(q);
                      return (
                        <label
                          key={oi}
                          className={`flex items-center gap-2 rounded-md border p-3 cursor-pointer transition-colors ${
                            showCorrect
                              ? "border-green-500 bg-green-50"
                              : showWrong
                                ? "border-red-500 bg-red-50"
                                : "hover:bg-accent"
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            checked={chosen === oi}
                            onChange={() => select(q.id, oi)}
                            disabled={submitted}
                          />
                          <span className="text-sm">
                            {String.fromCharCode(65 + oi)}. {opt}
                          </span>
                          {showCorrect && (
                            <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                          )}
                          {showWrong && (
                            <XCircle className="h-4 w-4 text-red-500 ml-auto" />
                          )}
                        </label>
                      );
                    })}
                    {submitted && explanationOf(q) && (
                      <p className="text-xs text-muted-foreground mt-2">
                        <strong>Explanation:</strong> {explanationOf(q)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}

          {!submitted && !adaptive && (
            <div className="mt-6">
              <Button
                size="lg"
                onClick={submit}
                disabled={Object.keys(answers).length < questions.length}
              >
                Submit Test
              </Button>
              {Object.keys(answers).length < questions.length && (
                <span className="ml-3 text-xs text-muted-foreground">
                  Answer all questions to submit (
                  {Object.keys(answers).length}/{questions.length})
                </span>
              )}
            </div>
          )}

          {!submitted && adaptive && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                onClick={advanceAdaptive}
                disabled={!currentQ || answers[currentQ.id] === undefined}
              >
                {askedOrder.length + 1 >= questions.length
                  ? "Finish Test"
                  : "Next Question"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentQid(null);
                  submit();
                }}
              >
                End Test
              </Button>
              <span className="text-xs text-muted-foreground">
                Question {askedOrder.length + 1} of {questions.length}
              </span>
            </div>
          )}
        </div>

        <aside className="lg:col-span-1 mt-6 lg:mt-0">
          <TestStatsSidebar
            total={questions.length}
            attempted={attempted}
            correct={correct}
            wrong={wrong}
            totalTime={`${duration} min`}
            timeRemaining={fmtTime(secondsLeft)}
          />
        </aside>
      </div>
    </div>
  );
}

function AdaptiveQuestion({
  q,
  index,
  difficulty,
  chosen,
  onSelect,
  onNext,
  canNext,
  total,
  asked,
}: {
  q: Q;
  index: number;
  difficulty: number;
  chosen: number | undefined;
  onSelect: (idx: number) => void;
  onNext: () => void;
  canNext: boolean;
  total: number;
  asked: number;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {index}. {q.text}
            <Badge variant="outline" className="ml-2 text-xs">
              {q.marks} marks
            </Badge>
          </CardTitle>
          <Badge variant="secondary">{difficultyLabel(difficulty)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {q.options.map((opt, oi) => {
          const isChosen = chosen === oi;
          return (
            <label
              key={oi}
              className={`flex items-center gap-2 rounded-md p-3 cursor-pointer transition-colors ${
                isChosen ? "border-primary bg-primary/5 border" : "border hover:bg-accent"
              }`}
            >
              <input
                type="radio"
                name={q.id}
                checked={isChosen}
                onChange={() => onSelect(oi)}
              />
              <span className="text-sm">
                {String.fromCharCode(65 + oi)}. {opt}
              </span>
            </label>
          );
        })}
      </CardContent>
    </Card>
  );
}
