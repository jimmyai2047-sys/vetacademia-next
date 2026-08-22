"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ListChecks,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Mcq = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
  marks: number;
};

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function PracticePage({
  chapterId,
  chapterTitle,
  subjectName,
  programmeSlug,
  subjectId,
  mcqs: initialMcqs,
}: {
  chapterId: string;
  chapterTitle: string;
  subjectName: string;
  programmeSlug: string;
  subjectId: string;
  mcqs: Mcq[];
}) {
  const mcqs = initialMcqs;
  const totalQuestions = mcqs.length;
  const totalMarks = mcqs.reduce((s, m) => s + m.marks, 0);
  const [duration] = useState(() => Math.max(totalQuestions, 10)); // 1 min per question, min 10 min

  // State
  const [started, setStarted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(duration * 60);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Timer
  useEffect(() => {
    if (!started || submitted || secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [started, submitted, secondsLeft]);

  // Auto-submit on timeout
  useEffect(() => {
    if (started && !submitted && secondsLeft <= 0) {
      doSubmit();
    }
  }, [secondsLeft, started, submitted]);

  const select = useCallback(
    (id: string, idx: number) => {
      if (submitted) return;
      setAnswers((a) => ({ ...a, [id]: idx }));
    },
    [submitted]
  );

  function doSubmit() {
    let s = 0;
    for (const m of mcqs) {
      if (answers[m.id] === m.correctIndex) s += m.marks;
    }
    setScore(s);
    setSubmitted(true);
  }

  function reset() {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setSecondsLeft(duration * 60);
    setCurrentIdx(0);
    setStarted(false);
  }

  const attempted = Object.keys(answers).length;
  const correct = mcqs.filter((m) => answers[m.id] === m.correctIndex).length;
  const wrong = attempted - correct;
  const pct = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

  /* ── START SCREEN ── */
  if (!started) {
    return (
      <div className="min-h-screen bg-[#fdf6ec] dark:bg-[#0f172a] flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-background rounded-2xl border shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-700 flex items-center justify-center">
            <ListChecks className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold mb-1">Practice MCQs</h1>
            <p className="text-sm text-muted-foreground">{chapterTitle}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950 p-3">
              <div className="text-xl font-bold">{totalQuestions}</div>
              <div className="text-xs text-muted-foreground">Questions</div>
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950 p-3">
              <div className="text-xl font-bold">{totalMarks}</div>
              <div className="text-xs text-muted-foreground">Total Marks</div>
            </div>
            <div className="rounded-xl bg-purple-50 dark:bg-purple-950 p-3">
              <div className="text-xl font-bold">{fmtTime(duration * 60)}</div>
              <div className="text-xs text-muted-foreground">Time Limit</div>
            </div>
          </div>
          <div className="space-y-3">
            <Button onClick={() => setStarted(true)} className="w-full h-12 text-lg">
              Start Practice
            </Button>
            <Link
              href={`/reader/${chapterId}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Chapter
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── EXAM UI ── */
  return (
    <div className="min-h-screen bg-[#fdf6ec] dark:bg-[#0f172a]">
      {/* ── TOP BAR ── */}
      <div className="sticky top-0 z-40 bg-background border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href={`/reader/${chapterId}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{subjectName}</span>
          </Link>
          <h1 className="font-semibold text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">
            Practice MCQs
          </h1>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span
              className={`font-mono text-sm font-semibold tabular-nums ${
                secondsLeft <= 60 ? "text-red-600 animate-pulse" : ""
              }`}
            >
              {fmtTime(secondsLeft)}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* ── MAIN: QUESTIONS ── */}
        <div className="flex-1 space-y-4">
          {submitted && (
            <div className="rounded-2xl bg-primary/5 border p-6 text-center mb-6">
              <p className="text-sm text-muted-foreground mb-1">Your Score</p>
              <p className="text-4xl font-bold">
                {score} <span className="text-lg font-normal text-muted-foreground">/ {totalMarks}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">{pct}% · {correct} correct, {wrong} wrong</p>
              <Button variant="outline" className="mt-4" onClick={reset}>
                <RotateCcw className="h-4 w-4 mr-2" /> Retake
              </Button>
            </div>
          )}

          {mcqs.map((m, i) => {
            const chosen = answers[m.id];
            const isAnswered = chosen !== undefined;
            const isCurrent = i === currentIdx;
            const showCorrect = submitted && chosen === m.correctIndex;
            const showWrong = submitted && chosen !== undefined && chosen !== m.correctIndex;

            return (
              <div
                key={m.id}
                id={`q-${i}`}
                className={`rounded-xl border p-5 transition-all ${
                  isCurrent && !submitted ? "ring-2 ring-primary/40 border-primary/40" : ""
                } ${showCorrect ? "border-green-500 bg-green-50/50 dark:bg-green-950/30" : ""} ${
                  showWrong ? "border-red-500 bg-red-50/50 dark:bg-red-950/30" : ""
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                    {i + 1}
                  </span>
                  <p className="font-medium leading-relaxed">{m.question}</p>
                </div>
                <div className="space-y-2 ml-10">
                  {m.options.map((opt, oi) => {
                    const selected = chosen === oi;
                    const correct = m.correctIndex === oi;
                    let cls =
                      "border rounded-lg px-4 py-3 text-sm flex items-center gap-3 cursor-pointer transition-all";

                    if (submitted) {
                      cls += " cursor-default";
                      if (correct)
                        cls += " border-green-500 bg-green-50 dark:bg-green-950";
                      else if (selected)
                        cls += " border-red-500 bg-red-50 dark:bg-red-950";
                      else cls += " border-border opacity-60";
                    } else {
                      cls += selected
                        ? " border-primary bg-primary/5"
                        : " border-border hover:bg-accent";
                    }

                    return (
                      <div key={oi} className={cls} onClick={() => select(m.id, oi)}>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold shrink-0">
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <span className="flex-1">{opt}</span>
                        {submitted && correct && (
                          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                        )}
                        {submitted && selected && !correct && (
                          <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
                {submitted && m.explanation && (
                  <div className="ml-10 mt-3 rounded-lg bg-muted p-3 text-sm">
                    <span className="font-semibold">Explanation:</span> {m.explanation}
                  </div>
                )}
              </div>
            );
          })}

          {!submitted && (
            <div className="sticky bottom-0 bg-background/80 backdrop-blur border-t p-4 -mx-4 flex justify-center">
              <Button
                onClick={doSubmit}
                disabled={attempted < totalQuestions}
                size="lg"
                className="px-8"
              >
                Submit ({attempted}/{totalQuestions})
              </Button>
            </div>
          )}
        </div>

        {/* ── SIDEBAR ── */}
        <div className="hidden lg:block w-64 shrink-0">
          <div className="rounded-2xl border bg-card p-4 space-y-3 sticky top-20">
            <div className="rounded-xl bg-primary/5 p-3 text-center">
              <div className="text-3xl font-bold leading-none">{totalQuestions}</div>
              <div className="text-xs text-muted-foreground mt-1">Questions</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg p-2 text-center text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-300">
                <div className="text-xl font-bold leading-none">{attempted}</div>
                <div className="text-[10px] mt-0.5 font-medium">Attempted</div>
              </div>
              <div className="rounded-lg p-2 text-center text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-300">
                <div className="text-xl font-bold leading-none">{submitted ? correct : "—"}</div>
                <div className="text-[10px] mt-0.5 font-medium">Correct</div>
              </div>
              <div className="rounded-lg p-2 text-center text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-300">
                <div className="text-xl font-bold leading-none">{submitted ? wrong : "—"}</div>
                <div className="text-[10px] mt-0.5 font-medium">Wrong</div>
              </div>
            </div>

            <div className="rounded-xl border p-3 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Time</span>
                <span className="font-medium">{fmtTime(duration * 60)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> Remaining
                </span>
                <span
                  className={`font-semibold tabular-nums ${
                    secondsLeft <= 60 ? "text-red-600" : ""
                  }`}
                >
                  {fmtTime(secondsLeft)}
                </span>
              </div>
            </div>

            {/* Question navigator */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Questions
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {mcqs.map((m, i) => {
                  const answered = answers[m.id] !== undefined;
                  const isCurrent = i === currentIdx;
                  let bg = "bg-muted";
                  if (answered && submitted) {
                    bg =
                      answers[m.id] === m.correctIndex
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white";
                  } else if (answered) {
                    bg = "bg-primary text-primary-foreground";
                  }
                  return (
                    <button
                      key={m.id}
                      onClick={() => setCurrentIdx(i)}
                      className={`h-8 rounded text-xs font-bold ${bg} ${
                        isCurrent ? "ring-2 ring-primary ring-offset-1" : ""
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
