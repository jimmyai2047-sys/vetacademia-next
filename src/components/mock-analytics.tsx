import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Target,
  AlertCircle,
  UserPlus,
  LogIn,
  BarChart3,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import type { MockAnalyticsData } from "@/lib/mock-analytics-core";

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className={`rounded-xl border p-3 text-center ${tone}`}>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export default function MockAnalytics({ data }: { data: MockAnalyticsData }) {
  if (!data.signedIn) {
    return (
      <Card className="rounded-[1.25rem] border-primary/10 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary to-[#d4a843]" />
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BarChart3 className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <h3 className="font-bold text-base">Track your own performance</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Create a free account to see attempt history, subject-wise accuracy and score trend —
              computed from the tests you actually take.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/signup">
              <Button size="sm" className="rounded-full gap-1.5">
                <UserPlus className="h-4 w-4" /> Sign up free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" variant="outline" className="rounded-full gap-1.5">
                <LogIn className="h-4 w-4" /> Log in
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.attempts === 0) {
    return (
      <Card className="rounded-[1.25rem] border-primary/10 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary to-[#d4a843]" />
        <CardContent className="p-6 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BarChart3 className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-semibold">No attempts yet</p>
          <p className="text-sm text-muted-foreground">
            Attempt any mock test or previous-year paper below — your accuracy and trend appear here
            automatically.
          </p>
        </CardContent>
      </Card>
    );
  }

  const trend =
    data.trendDelta === null ? null : data.trendDelta > 0 ? "up" : data.trendDelta < 0 ? "down" : "flat";

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card className="md:col-span-2 rounded-[1.25rem] border-primary/5 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" /> Your Analytics
            <Badge variant="outline" className="ml-auto rounded-full text-xs">
              {data.attempts} attempt{data.attempts === 1 ? "" : "s"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Metric
              label="Avg score"
              value={`${data.avgScore}%`}
              tone="bg-emerald-50 border-emerald-100"
            />
            <Metric
              label="Best score"
              value={`${data.bestScore}%`}
              tone="bg-blue-50 border-blue-100"
            />
            <Metric
              label="Recent avg"
              value={data.recentAvg === null ? "—" : `${data.recentAvg}%`}
              tone="bg-amber-50 border-amber-100"
            />
          </div>

          <div className="rounded-xl border px-3 py-2.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Last 5 vs previous 5 attempts</span>
            {trend === null ? (
              <span className="text-xs text-muted-foreground">Needs more attempts</span>
            ) : (
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  trend === "up"
                    ? "text-emerald-700"
                    : trend === "down"
                    ? "text-red-600"
                    : "text-muted-foreground"
                }`}
              >
                {trend === "up" && <ArrowUp className="h-4 w-4" />}
                {trend === "down" && <ArrowDown className="h-4 w-4" />}
                {data.trendDelta! > 0 ? "+" : ""}
                {data.trendDelta!} points
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold mb-1.5">
              <Target className="h-3.5 w-3.5 text-red-600" /> Focus areas — lowest accuracy first
            </div>
            {data.focusAreas.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nothing to flag: either none of your attempts are linked to a subject, or every subject
                you have attempted is already at 100%.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {data.focusAreas.map((f) => (
                  <Badge
                    key={f.subject}
                    variant="outline"
                    className="rounded-full bg-red-50 text-red-700 border-red-200 text-xs gap-1"
                  >
                    <AlertCircle className="h-3 w-3" /> {f.subject} — {f.accuracy}% over{" "}
                    {f.attempts}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[1.25rem] border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-amber-600" /> How this is measured
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 text-xs text-muted-foreground">
          <p className="rounded-xl bg-white border border-amber-100 p-3">
            <b className="text-amber-700">Scores</b> — recalculated on our server from the stored answer
            key on every submission, so they cannot be inflated.
          </p>
          <p className="rounded-xl bg-white border border-amber-100 p-3">
            <b className="text-amber-700">Focus areas</b> — average accuracy grouped by the subject of
            each test you attempted.
          </p>
          <p className="rounded-xl bg-white border border-amber-100 p-3">
            <b className="text-amber-700">Not shown</b> — per-question timing and all-India rank, because
            we do not yet collect that data. We only display figures we can actually compute.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
