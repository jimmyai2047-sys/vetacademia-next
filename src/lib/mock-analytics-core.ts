export type AttemptRow = {
  score: number;
  totalMarks: number;
  subjectName?: string | null;
};

export type SubjectAccuracy = {
  subject: string;
  accuracy: number;
  attempts: number;
};

export type MockAnalyticsData = {
  signedIn: boolean;
  attempts: number;
  avgScore: number;
  bestScore: number;
  focusAreas: SubjectAccuracy[];
  recentAvg: number | null;
  trendDelta: number | null;
};

const mean = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / xs.length;

export function computeAnalytics(rows: AttemptRow[], signedIn: boolean): MockAnalyticsData {
  const idle: MockAnalyticsData = {
    signedIn,
    attempts: rows.length,
    avgScore: 0,
    bestScore: 0,
    focusAreas: [],
    recentAvg: null,
    trendDelta: null,
  };
  if (!signedIn || rows.length === 0) return idle;

  // Rows arrive newest-first. Attempts with no marks cannot be scored, so they
  // are counted but excluded from every percentage.
  const scored = rows.filter((r) => r.totalMarks > 0);
  if (scored.length === 0) return idle;

  const pct = (r: AttemptRow) => Math.round((r.score / r.totalMarks) * 100);
  const values = scored.map(pct);

  const recent = values.slice(0, 5);
  const prior = values.slice(5, 10);
  const recentAvg = Math.round(mean(recent));
  const trendDelta = prior.length ? recentAvg - Math.round(mean(prior)) : null;

  const bySubject = new Map<string, { total: number; count: number }>();
  for (const r of scored) {
    const name = (r.subjectName ?? "").trim();
    if (!name) continue;
    const g = bySubject.get(name) ?? { total: 0, count: 0 };
    g.total += pct(r);
    g.count += 1;
    bySubject.set(name, g);
  }
  const focusAreas = [...bySubject.entries()]
    .map(([subject, g]) => ({ subject, accuracy: Math.round(g.total / g.count), attempts: g.count }))
    .filter((f) => f.accuracy < 100)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts)
    .slice(0, 4);

  return {
    signedIn: true,
    attempts: rows.length,
    avgScore: Math.round(mean(values)),
    bestScore: Math.max(...values),
    focusAreas,
    recentAvg,
    trendDelta,
  };
}
