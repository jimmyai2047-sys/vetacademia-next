// Derived live-class status.
//
// The stored `LiveClass.status` is a manual admin dropdown, so rows go stale:
// a session scheduled for August still shows LIVE in October. Every read path
// decorates rows through this helper so the UI reports what is actually true,
// while the stored column stays under admin control (a deliberate override is
// surfaced, never silently hidden).
//
// Rules:
//   CANCELLED        → always CANCELLED (never auto-promoted)
//   ENDED            → ENDED
//   LIVE   past end  → ENDED     (fixes indefinitely-LIVE rows)
//   LIVE   in window → LIVE
//   SCHED. past end  → ENDED
//   SCHED. in window → LIVE only when there is something to watch (youtubeUrl)
//   SCHED. otherwise → SCHEDULED

export type EffectiveStatus = "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";

export type LiveClassLike = {
  status: string;
  scheduledAt: Date | string;
  duration: number;
  youtubeUrl?: string | null;
  recordingUrl?: string | null;
  isDemo?: boolean;
};

export function classEndsAt(c: LiveClassLike): Date {
  const start = new Date(c.scheduledAt);
  return new Date(start.getTime() + Math.max(0, c.duration) * 60_000);
}

export function effectiveStatus(c: LiveClassLike, now: Date = new Date()): EffectiveStatus {
  const start = new Date(c.scheduledAt);
  const end = classEndsAt(c);
  const status = c.status as EffectiveStatus;

  if (status === "CANCELLED") return "CANCELLED";
  if (status === "ENDED") return "ENDED";

  if (now.getTime() > end.getTime()) return "ENDED"; // stale LIVE or SCHEDULED
  if (now.getTime() >= start.getTime()) {
    // Inside the window. Promote to LIVE only if there is a stream to show;
    // otherwise leave the admin's SCHEDULED label alone.
    if (status === "LIVE") return "LIVE";
    return c.youtubeUrl ? "LIVE" : "SCHEDULED";
  }
  return status === "LIVE" ? "LIVE" : "SCHEDULED"; // future-dated (admin set LIVE early)
}

export type DecoratedLiveClass<T extends LiveClassLike> = T & {
  effectiveStatus: EffectiveStatus;
  /** true when the derived status disagrees with the stored one */
  statusStale: boolean;
  /** set when the class is past its end but still stored as SCHEDULED/LIVE */
  needsAttention: boolean;
};

export function decorateLiveClass<T extends LiveClassLike>(
  c: T,
  now: Date = new Date()
): DecoratedLiveClass<T> {
  const status = effectiveStatus(c, now);
  const stored = c.status as EffectiveStatus;
  return {
    ...c,
    effectiveStatus: status,
    statusStale: stored !== status,
    needsAttention: status === "ENDED" && (stored === "LIVE" || stored === "SCHEDULED"),
  };
}

export function decorateLiveClasses<T extends LiveClassLike>(
  rows: T[],
  now: Date = new Date()
): DecoratedLiveClass<T>[] {
  return rows.map((r) => decorateLiveClass(r, now));
}
