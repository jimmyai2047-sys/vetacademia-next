"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";

const exams = [
  { id: "psc", name: "PSC — VO/LSA", date: "2026-11-15" },
  { id: "icar-entrance", name: "ICAR JRF", date: "2026-06-20" },
  { id: "net", name: "NET", date: "2026-06-25" },
  { id: "ars", name: "ARS", date: "2026-09-10" },
];

function daysLeft(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function ExamCountdown() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);
  // trigger re-render every minute via now
  void now;

  return (
    <div className="grid md:grid-cols-4 gap-4">
      {exams.map((e) => {
        const d = daysLeft(e.date);
        return (
          <Card key={e.id} className="rounded-[1.25rem] border-primary/5 bg-white shadow-sm text-center overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary to-blue-500" />
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </div>
              <div className="mt-1 text-sm font-bold">{e.name}</div>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <Clock className="h-3.5 w-3.5" /> {d} days left
              </div>
              <Badge variant="outline" className="mt-2 rounded-full text-[10px]">{d < 30 ? "Upcoming" : d < 90 ? "Prepare" : "Plan"}</Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
