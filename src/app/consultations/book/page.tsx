"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function BookForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { status } = useSession();

  const expertId = params.get("expert") || "";
  const expertNameParam = params.get("name") || "";

  const [expertName, setExpertName] = useState(expertNameParam);
  const [scheduledAt, setScheduledAt] = useState("");
  const [mode, setMode] = useState("CHAT");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (expertNameParam) {
      setExpertName(expertNameParam);
      return;
    }
    if (!expertId) return;
    let active = true;
    fetch("/api/experts")
      .then((r) => r.json())
      .then((list: { id: string; user?: { name?: string }; name?: string }[]) => {
        if (!active) return;
        const found = list.find((e) => e.id === expertId);
        if (found) setExpertName(found.user?.name || found.name || expertId);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [expertId, expertNameParam]);

  if (status === "loading") {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  if (status === "unauthenticated") {
    const search = params.toString();
    const redirect = `/consultations/book${search ? `?${search}` : ""}`;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sign in to book</CardTitle>
          <CardDescription>
            You need an account to book a consultation with an expert.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/login?redirect=${encodeURIComponent(redirect)}`}>
            <Button>Log in to continue</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (status === "authenticated" && !expertId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Choose an expert</CardTitle>
          <CardDescription>
            Select a veterinary expert to book a consultation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/experts">
            <Button>Browse Experts</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!expertId) {
      setError("No expert selected. Please choose an expert first.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expertId,
          scheduledAt: scheduledAt || undefined,
          mode,
          topic: topic || undefined,
          message: message || undefined,
        }),
      });
      if (res.status === 401) {
        const search = params.toString();
        router.push(
          `/login?redirect=${encodeURIComponent(
            `/consultations/book${search ? `?${search}` : ""}`
          )}`
        );
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to book consultation");
        return;
      }
      setDone(true);
      router.push("/consultations?booked=1");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Redirecting to your consultations…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book a Consultation</CardTitle>
        <CardDescription>
          {expertName ? `With ${expertName}` : "Choose your expert and time"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expert">Expert</Label>
            <Input id="expert" value={expertName || expertId} readOnly disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Preferred date &amp; time</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mode">Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v ?? "CHAT")}>
              <SelectTrigger id="mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIDEO">Video</SelectItem>
                <SelectItem value="CHAT">Chat</SelectItem>
                <SelectItem value="CALL">Call</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Bovine respiratory disease"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe what you'd like to discuss"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Booking…" : "Book Consultation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function BookConsultationPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-xl">
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <BookForm />
      </Suspense>
    </div>
  );
}
