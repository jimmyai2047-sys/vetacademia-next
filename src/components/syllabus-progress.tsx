"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Bookmark, BookOpen, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SyllabusProgress({ total, completed, lastSubject }: { total: number; completed: number; lastSubject?: { id: string; name: string; programme: string } | null }) {
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return (
    <Card className="rounded-[1.25rem] border-primary/10 bg-white shadow-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary to-blue-600" />
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4 text-primary" /> Your Progress
          </h3>
          <span className="text-xs font-bold text-primary">{pct}%</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{completed}/{total} subjects started</span>
          <span className="flex items-center gap-1">
            <Bookmark className="h-3 w-3" /> {completed} bookmarked
          </span>
        </div>
        {lastSubject ? (
          <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
            <div className="flex items-center gap-1 text-xs font-medium">
              <Clock className="h-3 w-3 text-primary" /> Continue reading
            </div>
            <Link href={`/syllabus/${lastSubject.programme}/${lastSubject.id}`} className="text-sm font-semibold text-primary hover:underline line-clamp-1">
              {lastSubject.name}
            </Link>
            <Link href={`/syllabus/${lastSubject.programme}/${lastSubject.id}`}>
              <Button size="sm" className="mt-2 w-full rounded-xl h-8">
                Resume
              </Button>
            </Link>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Start a subject to track progress.</p>
        )}
      </CardContent>
    </Card>
  );
}
