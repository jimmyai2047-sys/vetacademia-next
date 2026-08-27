"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, CheckCircle2 } from "lucide-react";

type Doubt = {
  id: string;
  question: string;
  subject: string | null;
  status: string;
  answer: string | null;
  createdAt: string | Date;
  user?: { name: string | null } | null;
};

export default function CommunityQa({
  initialDoubts,
  isAuthed,
}: {
  initialDoubts: Doubt[];
  isAuthed: boolean;
}) {
  const router = useRouter();
  const [doubts, setDoubts] = useState<Doubt[]>(initialDoubts);
  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/community/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), subject: subject.trim() || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not post question");
        return;
      }
      setDoubts((prev) => [data.doubt as Doubt, ...prev]);
      setQuestion("");
      setSubject("");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[1.25rem] border border-purple-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="h-4 w-4 text-purple-600" />
        <span className="text-sm font-bold">Community Q&amp;A</span>
        <Badge className="ml-auto rounded-full bg-purple-600 text-white text-xs">Live</Badge>
      </div>

      {isAuthed ? (
        <form onSubmit={submit} className="space-y-2 mb-4">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a veterinary question…"
            rows={2}
            className="w-full rounded-lg border border-input bg-muted/30 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
          />
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (optional)"
            className="w-full rounded-lg border border-input bg-muted/30 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button type="submit" size="sm" disabled={busy} className="gap-1.5">
            <Send className="h-3.5 w-3.5" /> {busy ? "Posting…" : "Ask Question"}
          </Button>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground mb-4">
          <Link href="/login" className="underline text-primary">
            Login
          </Link>{" "}
          to ask a question and get expert replies.
        </p>
      )}

      <div className="space-y-3 max-h-80 overflow-auto">
        {doubts.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No questions yet. Be the first to ask!
          </p>
        ) : (
          doubts.map((d) => (
            <div key={d.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{d.question}</p>
                {d.status === "ANSWERED" ? (
                  <Badge variant="secondary" className="shrink-0 gap-1 text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Answered
                  </Badge>
                ) : (
                  <Badge variant="outline" className="shrink-0">
                    Open
                  </Badge>
                )}
              </div>
              {d.subject && (
                <p className="text-[11px] text-muted-foreground mt-0.5">{d.subject}</p>
              )}
              {d.answer && (
                <p className="mt-2 rounded-md bg-emerald-50 p-2 text-xs text-emerald-800">
                  {d.answer}
                </p>
              )}
              <p className="mt-1 text-[11px] text-muted-foreground/70">
                {d.user?.name || "Member"} ·{" "}
                {new Date(d.createdAt).toLocaleDateString("en-IN")}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
