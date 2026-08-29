"use client";

import { useState, useEffect, useMemo } from "react";
import { csrfFetch } from "@/lib/csrf-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowLeft, RotateCcw, Crown, Sparkles, Clock, Trophy, Shield } from "lucide-react";
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

function QuestionText({ text }: { text: string }) {
  const DEVA = /[०-९\u0900-\u097F]/;
  const hasHindi = (s: string) => DEVA.test(s);
  // Split Hindi / English if both present (stored as "Hindi\nEnglish")
  const rawLines = text.split("\n");
  let hiLines: string[] = [];
  let enLines: string[] = [];
  let seenDevanagari = false;
  let seenLatinAfterHindi = false;
  for (const l of rawLines) {
    if (hasHindi(l)) {
      if (seenLatinAfterHindi) {
        hiLines.push(l);
      } else {
        hiLines.push(l);
        seenDevanagari = true;
      }
    } else if (l.trim() && seenDevanagari && /[A-Za-z]/.test(l)) {
      seenLatinAfterHindi = true;
      enLines.push(l);
    } else if (seenDevanagari && enLines.length > 0) {
      enLines.push(l);
    } else if (!seenDevanagari) {
      enLines.push(l);
    } else {
      hiLines.push(l);
    }
  }
  const hasBilingual = hiLines.length > 0 && enLines.length > 0 && hiLines.some((l) => hasHindi(l)) && enLines.some((l) => /[A-Za-z]/.test(l));
  // Helper to render a block (either Hi or En) with list support — royal justified style
  const renderBlock = (blockLines: string[], keyPrefix: string) => {
    const els: React.ReactNode[] = [];
    let tableRows: string[][] = [];
    const flushTable = () => {
      if (tableRows.length > 0) {
        const isHeaderRow = (row: string[]) =>
          row.some((c) => /सूची|List|लेखक|Author|List–I|सूची–I/.test(c));
        const header = tableRows.length > 0 && isHeaderRow(tableRows[0]) ? tableRows[0] : null;
        const bodyRows = header ? tableRows.slice(1) : tableRows;
        els.push(
          <div key={`${keyPrefix}-tbl-${els.length}`} className="my-3 overflow-x-auto rounded-xl border border-primary/10 shadow-sm">
            <table className="w-full text-[13.5px] border-collapse">
              {header && (
                <thead>
                  <tr className="bg-gradient-to-r from-primary to-[#005f48] text-white">
                    {header.map((c, j) => (
                      <th key={j} className="px-3.5 py-2 border-r border-white/15 last:border-r-0 text-left font-bold tracking-wide text-xs uppercase">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {bodyRows.map((cols, idx) => (
                  <tr key={idx} className={`border-b last:border-0 ${idx % 2 === 0 ? "bg-white" : "bg-primary/[0.04]"}`}>
                    {cols.map((c, j) => (
                      <td key={j} className="px-3.5 py-2 border-r border-primary/10 last:border-r-0 align-top text-justify leading-relaxed">
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
      }
    };
    for (const raw of blockLines) {
      const line = raw.trim();
      if (!line) {
        flushTable();
        els.push(<div key={`${keyPrefix}-br-${els.length}`} className="h-1.5" />);
        continue;
      }
      const isHeaderRow =
        (line.includes("सूची") ||
          line.includes("List") ||
          line.includes("Column") ||
          line.includes("लेखक") ||
          line.includes("Author")) &&
        (line.includes("→") || line.includes(":")) &&
        !/^(?:\(?[A-D]\)?|\(?I{1,3}V?\)?|\(?IV\)?|\(?[0-9]+\)?)[\.\s\)]/.test(line);
      if (isHeaderRow) {
        let hcols: string[] = [];
        if (line.includes("→")) hcols = line.split("→").map((s) => s.trim());
        else if (line.includes(":")) {
          const m = line.match(/^(.*?सूची[^\:]*?)\s*:\s*(.*?सूची.*)$/);
          const m2 = line.match(/^(.*?List[^\:]*?)\s*:\s*(.*?List.*)$/);
          if (m) hcols = [m[1].trim(), m[2].trim()];
          else if (m2) hcols = [m2[1].trim(), m2[2].trim()];
          else hcols = line.split(":").map((s) => s.trim()).filter(Boolean);
          if (hcols.length === 1 && line.includes(":")) {
            const idx = line.indexOf(":");
            const before = line.slice(0, idx).trim();
            const after = line.slice(idx + 1).trim();
            const listIdx = after.search(/सूची|List/);
            if (listIdx !== -1) {
              hcols = [before + " :", after];
            } else {
              hcols = [before, after];
            }
          }
        }
        if (hcols.length >= 2) {
          flushTable();
          tableRows.push(hcols.map((c) => c.replace(/^List–I\s*→\s*List–II.*$/, "List–I").replace(/^सूची.*/, (m) => m)));
          continue;
        }
      }
      const isListRow =
        line.includes("→") &&
        (/^(?:\(?[A-D]\)?|\(?I{1,3}V?\)?|\(?IV\)?|\(?[0-9]+\)?)[\.\s\)]/.test(line) ||
          line.trim().startsWith("→"));
      if (isListRow) {
        const cols = line.split("→").map((s) => s.trim());
        if (cols.length >= 2) {
          tableRows.push(cols);
          continue;
        }
      }
      flushTable();
      els.push(
        <div key={`${keyPrefix}-ln-${els.length}`} className="leading-[1.85] text-justify hyphens-auto text-[15px] text-foreground/90">
          {line}
        </div>
      );
    }
    flushTable();
    return <div className="space-y-1.5">{els}</div>;
  };
  if (hasBilingual) {
    return (
      <div className="grid md:grid-cols-2 gap-5">
        <div className="border-r-0 md:border-r md:border-primary/10 md:pr-5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#d4a843]/15 border border-[#d4a843]/30 px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase text-[#8a6a0a] mb-2">हिन्दी</div>
          {renderBlock(hiLines, "hi")}
        </div>
        <div className="md:pl-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/15 px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase text-primary mb-2">English</div>
          {renderBlock(enLines, "en")}
        </div>
      </div>
    );
  }
  return renderBlock(rawLines, "single");
}

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

  const progressPct = Math.round((attempted / Math.max(1, questions.length)) * 100);
  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/mock-tests"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Mock Tests
      </Link>

      {/* Royal header */}
      <div className="relative overflow-hidden rounded-[1.4rem] border border-primary/10 shadow-xl mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-[#003d2e] via-primary to-[#005f48]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "18px 18px" }} />
        <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-[#d4a843]/15 blur-3xl" />
        <div className="relative px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3 text-white min-w-0">
              <span className="hidden sm:flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur border border-white/20 shadow-sm shrink-0">
                <Trophy className="h-5 w-5 text-[#d4a843]" />
              </span>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase">
                  <Crown className="h-3 w-3 text-[#d4a843]" /> Royal Examination
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight mt-1">{title}</h1>
                <p className="text-white/75 text-xs sm:text-sm flex flex-wrap items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-[#d4a843]" />{duration} min</span>
                  <span className="h-1 w-1 rounded-full bg-white/30" />
                  <span>{questions.length} questions</span>
                  <span className="h-1 w-1 rounded-full bg-white/30" />
                  <span>{totalMarks} marks</span>
                  {adaptive && <Badge className="rounded-full bg-[#d4a843] text-[#003d2e] border-0 ml-1"><Sparkles className="h-3 w-3 mr-1" />Adaptive</Badge>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {submitted ? (
                <Button variant="secondary" onClick={reset} className="rounded-full bg-white text-primary hover:bg-white/90 shadow-md">
                  <RotateCcw className="h-4 w-4 mr-1" /> Retake
                </Button>
              ) : (
                <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/20 px-3 py-1.5 text-white">
                  <Shield className="h-4 w-4 text-[#d4a843]" />
                  <span className="text-xs font-semibold tracking-wide">Timed • Justified • Royal</span>
                </div>
              )}
            </div>
          </div>
          {/* progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-semibold tracking-widest uppercase text-white/70 mb-1.5">
              <span>Progress</span>
              <span>{attempted}/{questions.length} • {progressPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/15 overflow-hidden border border-white/10">
              <div className="h-full bg-gradient-to-r from-[#d4a843] to-white transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {submitted && (
        <Card className="mb-6 overflow-hidden border-primary/10 shadow-lg bg-gradient-to-br from-white to-primary/[0.04]">
          <div className="h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
          <CardContent className="p-6 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#005f48] text-white shadow-md mb-2">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="text-3xl font-extrabold tracking-tight">
              {score} <span className="text-lg font-semibold text-muted-foreground">/ {totalMarks}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Your royal score</p>
            {saved && (
              <p className="text-xs text-green-600 mt-1 inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Saved to your progress</p>
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
              const optLetters = ["A", "B", "C", "D", "E", "F"];
              const shortOpts = q.options.every((o) => o.length <= 45) && q.options.length === 4;
              return (
                <Card key={q.id} className="overflow-hidden rounded-[1.4rem] border-primary/10 shadow-sm hover:shadow-md transition-shadow bg-white">
                  <div className="h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
                  <CardHeader className="pb-3">
                    <CardTitle className="flex gap-3 items-start leading-relaxed text-[15px]">
                      <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#005f48] text-white text-xs font-extrabold shadow-sm ring-1 ring-primary/20">
                        {i + 1}
                      </span>
                      <span className="flex-1 min-w-0 pt-0.5">
                        <QuestionText text={q.text} />
                      </span>
                      <Badge variant="outline" className="shrink-0 rounded-full border-primary/15 bg-primary/5 text-primary text-[11px] px-2 py-0.5">
                        {q.marks} mark{q.marks !== 1 ? "s" : ""}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className={`grid gap-2.5 ${shortOpts ? "md:grid-cols-2" : "grid-cols-1"}`}>
                      {q.options.map((opt, oi) => {
                        const showCorrect = submitted && oi === correctAnswerOf(q);
                        const showWrong = submitted && chosen === oi && oi !== correctAnswerOf(q);
                        const isChosen = chosen === oi && !submitted;
                        return (
                          <label
                            key={oi}
                            className={`group relative flex items-start gap-3 rounded-xl border p-3.5 pr-9 cursor-pointer transition-all text-left ${
                              showCorrect
                                ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm ring-1 ring-green-200"
                                : showWrong
                                  ? "border-red-400 bg-gradient-to-br from-red-50 to-rose-50 shadow-sm ring-1 ring-red-200"
                                  : isChosen
                                    ? "border-primary bg-gradient-to-br from-primary/7 to-primary/3 shadow-sm ring-1 ring-primary/20"
                                    : "border-primary/10 bg-white hover:border-primary/20 hover:bg-primary/[0.03] hover:shadow-sm"
                            }`}
                          >
                            <input type="radio" name={q.id} checked={chosen === oi} onChange={() => select(q.id, oi)} disabled={submitted} className="sr-only" />
                            <span
                              className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold border shadow-sm transition-colors ${
                                showCorrect
                                  ? "bg-green-600 border-green-600 text-white"
                                  : showWrong
                                    ? "bg-red-500 border-red-500 text-white"
                                    : isChosen
                                      ? "bg-primary border-primary text-white"
                                      : "bg-white border-primary/15 text-primary group-hover:border-primary/30"
                              }`}
                            >
                              {optLetters[oi] ?? oi + 1}
                            </span>
                            <span className="text-[14px] leading-relaxed text-justify hyphens-auto flex-1 pt-0.5">{opt}</span>
                            {showCorrect && <CheckCircle2 className="h-4.5 w-4.5 text-green-600 absolute right-3 top-1/2 -translate-y-1/2" />}
                            {showWrong && <XCircle className="h-4.5 w-4.5 text-red-500 absolute right-3 top-1/2 -translate-y-1/2" />}
                            {!submitted && isChosen && <span className="h-2 w-2 rounded-full bg-primary absolute right-3 top-1/2 -translate-y-1/2" />}
                          </label>
                        );
                      })}
                    </div>
                    {submitted && explanationOf(q) && (
                      <div className="mt-4 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/50 p-3.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-amber-700 mb-1">
                          <Sparkles className="h-3.5 w-3.5" /> Explanation
                        </div>
                        <p className="text-sm leading-relaxed text-justify text-foreground/80">{explanationOf(q)}</p>
                      </div>
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
  const optLetters = ["A", "B", "C", "D", "E", "F"];
  const shortOpts = q.options.every((o) => o.length <= 45) && q.options.length === 4;
  return (
    <Card className="overflow-hidden rounded-[1.4rem] border-primary/10 shadow-md bg-white">
      <div className="h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="flex gap-3 items-start leading-relaxed flex-1 min-w-0 text-[15px]">
            <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#005f48] text-white text-xs font-extrabold shadow-sm ring-1 ring-primary/20">
              {index}
            </span>
            <span className="flex-1 min-w-0 pt-0.5">
              <QuestionText text={q.text} />
            </span>
            <Badge variant="outline" className="shrink-0 rounded-full border-primary/15 bg-primary/5 text-primary text-[11px] px-2 py-0.5">
              {q.marks} mark{q.marks !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>
          <Badge variant="secondary" className="shrink-0 rounded-full bg-amber-100 text-amber-800 border-amber-200">{difficultyLabel(difficulty)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className={`grid gap-2.5 ${shortOpts ? "md:grid-cols-2" : "grid-cols-1"}`}>
          {q.options.map((opt, oi) => {
            const isChosen = chosen === oi;
            return (
              <label
                key={oi}
                className={`group relative flex items-start gap-3 rounded-xl border p-3.5 pr-9 cursor-pointer transition-all text-left ${
                  isChosen ? "border-primary bg-gradient-to-br from-primary/7 to-primary/3 shadow-sm ring-1 ring-primary/20" : "border-primary/10 bg-white hover:border-primary/20 hover:bg-primary/[0.03] hover:shadow-sm"
                }`}
              >
                <input type="radio" name={q.id} checked={isChosen} onChange={() => onSelect(oi)} className="sr-only" />
                <span className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold border shadow-sm ${isChosen ? "bg-primary border-primary text-white" : "bg-white border-primary/15 text-primary group-hover:border-primary/30"}`}>
                  {optLetters[oi] ?? oi + 1}
                </span>
                <span className="text-[14px] leading-relaxed text-justify hyphens-auto flex-1 pt-0.5">{opt}</span>
                {isChosen && <span className="h-2 w-2 rounded-full bg-primary absolute right-3 top-1/2 -translate-y-1/2" />}
              </label>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
