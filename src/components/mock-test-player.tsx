"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowLeft, RotateCcw } from "lucide-react";

type Q = {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  marks: number;
  explanation: string | null;
};

export default function MockTestPlayer({
  testId,
  title,
  duration,
  totalMarks,
  questions,
}: {
  testId: string;
  title: string;
  duration: number;
  totalMarks: number;
  questions: Q[];
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  function select(qid: string, idx: number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qid]: idx }));
  }

  function submit() {
    let s = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) s += q.marks;
    });
    setScore(s);
    setSubmitted(true);
  }

  function reset() {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/mock-tests"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Mock Tests
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">
            {duration} min &middot; {questions.length} questions &middot; {totalMarks} marks
          </p>
        </div>
        {submitted && (
          <Button variant="outline" onClick={reset}>
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
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {questions.map((q, i) => {
          const chosen = answers[q.id];
          const isCorrect = submitted && chosen === q.correctAnswer;
          const isWrong = submitted && chosen !== undefined && chosen !== q.correctAnswer;
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
                  const showCorrect = submitted && oi === q.correctAnswer;
                  const showWrong = submitted && chosen === oi && oi !== q.correctAnswer;
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
                      {showWrong && <XCircle className="h-4 w-4 text-red-500 ml-auto" />}
                    </label>
                  );
                })}
                {submitted && q.explanation && (
                  <p className="text-xs text-muted-foreground mt-2">
                    <strong>Explanation:</strong> {q.explanation}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!submitted && (
        <div className="mt-6">
          <Button size="lg" onClick={submit} disabled={Object.keys(answers).length < questions.length}>
            Submit Test
          </Button>
          {Object.keys(answers).length < questions.length && (
            <span className="ml-3 text-xs text-muted-foreground">
              Answer all questions to submit ({Object.keys(answers).length}/
              {questions.length})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
