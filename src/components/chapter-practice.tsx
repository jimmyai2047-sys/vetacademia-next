"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle2, XCircle, Loader2, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";

type Mcq = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
  marks: number;
  difficulty: number | null;
};

export default function ChapterPractice({
  chapterId,
  chapterTitle,
  onClose,
}: {
  chapterId: string;
  chapterTitle: string;
  onClose: () => void;
}) {
  const [mcqs, setMcqs] = useState<Mcq[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    let active = true;
    fetch(`/api/chapters/${chapterId}/mcqs`)
      .then((r) => r.json())
      .then((d) => {
        if (active) setMcqs(Array.isArray(d) ? d : []);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [chapterId]);

  function choose(id: string, idx: number) {
    if (revealed) return;
    setAnswers((a) => ({ ...a, [id]: idx }));
  }

  function submit() {
    let s = 0;
    for (const m of mcqs) {
      if (answers[m.id] === m.correctIndex) s += m.marks;
    }
    setScore(s);
    setRevealed(true);
  }

  const totalMarks = mcqs.reduce((s, m) => s + m.marks, 0);
  const answered = Object.keys(answers).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background z-10">
          <h2 className="font-semibold flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" /> Practice MCQs — {chapterTitle}
          </h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {loading && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </p>
          )}
          {!loading && mcqs.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Is chapter ke liye abhi MCQs nahi hain.
            </p>
          )}

          {!loading &&
            mcqs.map((m, i) => {
              const chosen = answers[m.id];
              const isCorrect = chosen === m.correctIndex;
              return (
                <div key={m.id} className="rounded-lg border p-3">
                  <p className="font-medium mb-2">
                    {i + 1}. {m.question}
                  </p>
                  <div className="space-y-1.5">
                    {m.options.map((o, oi) => {
                      const selected = chosen === oi;
                      const correct = m.correctIndex === oi;
                      let cls =
                        "border rounded-md px-3 py-2 text-sm flex items-center gap-2 cursor-pointer transition-colors";
                      if (revealed) {
                        if (correct)
                          cls +=
                            " bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
                        else if (selected)
                          cls +=
                            " bg-red-50 border-red-500 text-red-700 dark:bg-red-950 dark:text-red-300";
                        else cls += " border-border";
                      } else {
                        cls += selected
                          ? " border-primary bg-primary/5"
                          : " border-border hover:bg-accent";
                      }
                      return (
                        <div key={oi} className={cls} onClick={() => choose(m.id, oi)}>
                          <span className="flex h-5 w-5 items-center justify-center rounded-full border text-xs font-semibold">
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <span className="flex-1">{o}</span>
                          {revealed && correct && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          )}
                          {revealed && selected && !correct && (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {revealed && m.explanation && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <b>Explanation:</b> {m.explanation}
                    </p>
                  )}
                </div>
              );
            })}

          {!loading && mcqs.length > 0 && !revealed && (
            <Button
              onClick={submit}
              disabled={answered < mcqs.length}
              className="w-full"
            >
              Submit ({answered}/{mcqs.length})
            </Button>
          )}

          {revealed && (
            <div className="rounded-lg bg-primary/10 p-4 text-center">
              <p className="text-lg font-bold">
                Score: {score} / {totalMarks}
              </p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => {
                  setRevealed(false);
                  setAnswers({});
                }}
              >
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
