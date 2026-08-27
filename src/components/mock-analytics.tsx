"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Clock, Target, Lightbulb, AlertCircle } from "lucide-react";

const mockStats = {
  attempts: 12,
  avgScore: 68,
  bestScore: 84,
  avgTime: "42 min",
  weakTopics: ["Pharmacology - NSAIDs", "Surgery - Anaesthesia", "Pathology - Blood"],
};

const suggestions = [
  { type: "Weak topic", text: "Pharmacology NSAIDs — 42% accuracy. Revise contraindications + attempt 2 quizzes." },
  { type: "Time", text: "You spend 1.8 min/Q — target 1.2 min. Practice timed mocks." },
  { type: "Streak", text: "3-day streak! Continue — 1 mock/day keeps rank up." },
];

export default function MockAnalytics() {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card className="md:col-span-2 rounded-[1.25rem] border-primary/5 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" /> Your Analytics
            <Badge variant="outline" className="ml-auto rounded-full text-xs">Live</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 text-center">
              <div className="text-2xl font-extrabold">{mockStats.attempts}</div>
              <div className="text-xs text-muted-foreground">Attempts</div>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center">
              <div className="text-2xl font-extrabold text-emerald-700">{mockStats.avgScore}%</div>
              <div className="text-xs text-muted-foreground">Avg Score</div>
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-center">
              <div className="text-2xl font-extrabold text-blue-700">{mockStats.bestScore}%</div>
              <div className="text-xs text-muted-foreground">Best</div>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-center">
              <div className="text-2xl font-extrabold text-amber-700 flex items-center justify-center gap-1">
                <Clock className="h-4 w-4" /> {mockStats.avgTime}
              </div>
              <div className="text-xs text-muted-foreground">Avg Time</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2 text-xs font-semibold mb-1.5">
              <Target className="h-3.5 w-3.5 text-red-600" /> Weak Topics
            </div>
            <div className="flex flex-wrap gap-1.5">
              {mockStats.weakTopics.map((t) => (
                <Badge key={t} variant="outline" className="rounded-full bg-red-50 text-red-700 border-red-200 text-xs gap-1">
                  <AlertCircle className="h-3 w-3" /> {t}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[1.25rem] border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-amber-600" /> AI Suggestions
            <Badge className="ml-auto rounded-full bg-amber-500 text-white text-xs gap-1">
              <Brain className="h-3 w-3" /> AI
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {suggestions.map((s) => (
            <div key={s.text} className="rounded-xl bg-white border border-amber-100 p-3">
              <div className="text-xs font-semibold text-amber-700">{s.type}</div>
              <p className="text-xs text-muted-foreground mt-1">{s.text}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
