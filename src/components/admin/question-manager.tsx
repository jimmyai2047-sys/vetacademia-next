"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Pencil,
  Loader2,
  X,
  CheckCircle2,
  FileUp,
} from "lucide-react";
import { parseQuestions, ParsedQuestion } from "@/lib/parse-questions";

type Question = {
  id: string;
  text: string;
  options: string; // JSON string
  correctAnswer: number;
  marks: number;
  explanation: string | null;
};

export default function QuestionManager({ testId }: { testId: string }) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);

  const [text, setText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [marks, setMarks] = useState(1);
  const [explanation, setExplanation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkMarks, setBulkMarks] = useState(1);
  const [bulkPreview, setBulkPreview] = useState<ParsedQuestion[] | null>(null);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/mock-tests/${testId}/questions`);
      const data = await res.json();
      setQuestions(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [testId]);

  function openNew() {
    setEditing(null);
    setText("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer(0);
    setMarks(1);
    setExplanation("");
    setError(null);
    setShowForm(true);
  }

  function openEdit(q: Question) {
    setEditing(q);
    setText(q.text);
    try {
      const parsed = JSON.parse(q.options);
      setOptions(Array.isArray(parsed) ? parsed : ["", "", "", ""]);
    } catch {
      setOptions(["", "", "", ""]);
    }
    setCorrectAnswer(q.correctAnswer);
    setMarks(q.marks);
    setExplanation(q.explanation || "");
    setError(null);
    setShowForm(true);
  }

  function setOption(i: number, val: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)));
  }

  function handleBulkPreview() {
    setBulkError(null);
    const parsed = parseQuestions(bulkText);
    if (parsed.length === 0) {
      setBulkError("No questions detected. Use the format: number, options A-D, mark the correct one with *.");
      setBulkPreview(null);
      return;
    }
    setBulkPreview(parsed);
  }

  async function handleBulkImport() {
    if (!bulkPreview) return;
    const invalid = bulkPreview.filter((q) => q.error);
    if (invalid.length > 0) {
      setBulkError(`${invalid.length} question(s) are invalid. Fix them before importing.`);
      return;
    }
    setBulkImporting(true);
    setBulkError(null);
    try {
      const res = await fetch(
        `/api/admin/mock-tests/${testId}/questions/bulk`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: bulkText, marks: bulkMarks }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setBulkError(data.error || "Import failed");
        return;
      }
      setBulkOpen(false);
      setBulkText("");
      setBulkPreview(null);
      await load();
      router.refresh();
    } catch {
      setBulkError("Import failed");
    } finally {
      setBulkImporting(false);
    }
  }

  async function handleSave() {
    if (!text.trim()) {
      setError("Question text is required");
      return;
    }
    if (options.some((o) => !o.trim())) {
      setError("All 4 options are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { text, options, correctAnswer, marks, explanation };
      const res = editing
        ? await fetch(`/api/admin/mock-tests/${testId}/questions/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/admin/mock-tests/${testId}/questions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Save failed");
        return;
      }
      setShowForm(false);
      await load();
      router.refresh();
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(q: Question) {
    if (!confirm("Delete this question?")) return;
    try {
      const res = await fetch(
        `/api/admin/mock-tests/${testId}/questions/${q.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setQuestions((prev) => prev.filter((x) => x.id !== q.id));
        router.refresh();
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          Add questions with 4 options and mark the correct one.
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={bulkOpen ? "default" : "outline"}
            onClick={() => setBulkOpen((v) => !v)}
          >
            <FileUp className="h-4 w-4 mr-1" /> Bulk Import
          </Button>
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" /> Add Question
          </Button>
        </div>
      </div>

      {bulkOpen && (
        <div className="rounded-lg border p-4 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Bulk Import Questions</h3>
            <Button variant="ghost" size="icon" onClick={() => setBulkOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Paste the whole question paper. Format: a number/&quot;Q.&quot; starts a
            question, options are &quot;A. B. C. D.&quot;, mark the correct option
            with a trailing <code>*</code> (or add <code>Answer: B</code>), and
            optionally an <code>Explanation:</code> line. Blank lines separate
            questions.
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={10}
            placeholder={
              "1. What is the largest organ in the body?\nA. Heart\nB. Skin *\nC. Liver\nD. Lung\nExplanation: The skin covers the whole body.\n\n2. ..."
            }
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Marks per question</Label>
              <Input
                type="number"
                value={bulkMarks}
                onChange={(e) => setBulkMarks(Number(e.target.value))}
              />
            </div>
          </div>

          {bulkError && <p className="text-xs text-red-500">{bulkError}</p>}

          {!bulkPreview ? (
            <Button size="sm" variant="outline" onClick={handleBulkPreview}>
              Parse &amp; Preview
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {bulkPreview.length} question(s) parsed &middot;{" "}
                {bulkPreview.filter((q) => q.error).length} invalid
              </p>
              <div className="max-h-72 overflow-auto space-y-2 rounded-md border p-2">
                {bulkPreview.map((q, i) => (
                  <div
                    key={i}
                    className={`text-xs rounded p-2 ${
                      q.error
                        ? "bg-red-50 text-red-700"
                        : "bg-muted/40"
                    }`}
                  >
                    <div className="font-medium">
                      {i + 1}. {q.text || "(no text)"}
                    </div>
                    {q.options.length > 0 && (
                      <div className="mt-0.5 text-muted-foreground">
                        {q.options.map((o, oi) => (
                          <span key={oi} className="mr-2">
                            {String.fromCharCode(65 + oi)}
                            {oi === q.correctAnswer ? "✓" : "."}
                          </span>
                        ))}
                      </div>
                    )}
                    {q.error && <div className="mt-0.5">{q.error}</div>}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleBulkImport}
                  disabled={bulkImporting || bulkPreview.some((q) => q.error)}
                >
                  {bulkImporting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    `Import ${bulkPreview.length} Questions`
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setBulkPreview(null)}>
                  Edit Text
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="rounded-lg border p-4 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editing ? "Edit" : "New"} Question</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label>Question</Label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label>Options (select the correct one)</Label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  checked={correctAnswer === i}
                  onChange={() => setCorrectAnswer(i)}
                />
                <span className="text-xs w-5 text-muted-foreground">
                  {String.fromCharCode(65 + i)}.
                </span>
                <Input
                  value={opt}
                  onChange={(e) => setOption(i, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                />
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Marks</Label>
              <Input
                type="number"
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Explanation (optional)</Label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : editing ? (
                "Update"
              ) : (
                "Add"
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : questions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No questions yet.</p>
      ) : (
        <div className="space-y-2">
          {questions.map((q, idx) => {
            let opts: string[] = [];
            try {
              opts = JSON.parse(q.options);
            } catch {
              opts = [];
            }
            return (
              <div key={q.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {idx + 1}. {q.text}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {opts.map((o, i) => (
                        <div
                          key={i}
                          className={`text-xs flex items-center gap-1 ${
                            i === q.correctAnswer
                              ? "text-green-600 font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          {i === q.correctAnswer && (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {String.fromCharCode(65 + i)}. {o}
                        </div>
                      ))}
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {q.marks} marks
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(q)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(q)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
