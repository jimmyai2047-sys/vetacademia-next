export type AuditEvent = {
  action: string;
  actor?: string | null;
  target?: string;
  meta?: Record<string, unknown>;
};

// Lightweight structured audit log. This is a hook for a real audit sink
// (an AuditLog table, queue, or external log pipeline) — swap the body when
// one is available. Kept dependency-free so it is safe to call anywhere.
export function logAudit(event: AuditEvent): void {
  const entry = {
    ts: new Date().toISOString(),
    action: event.action,
    actor: event.actor ?? null,
    target: event.target ?? null,
    ...(event.meta ? { meta: event.meta } : {}),
  };
  if (process.env.NODE_ENV === "production") {
    console.log("[audit]", JSON.stringify(entry));
  } else {
    console.log(
      "[audit]",
      entry.action,
      entry.actor ?? "-",
      entry.target ?? "-",
      entry.meta ? JSON.stringify(entry.meta) : ""
    );
  }
}
