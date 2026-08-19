export type AuditEvent = {
  action: string;
  actor?: string | null;
  target?: string | null;
  meta?: Record<string, unknown>;
};

export type AuditEntry = AuditEvent & { ts: string };

const MAX_ENTRIES = 500;
const auditBuffer: AuditEntry[] = [];

export function logAudit(event: AuditEvent): void {
  const entry = {
    ts: new Date().toISOString(),
    action: event.action,
    actor: event.actor ?? null,
    target: event.target ?? null,
    ...(event.meta ? { meta: event.meta } : {}),
  } as AuditEntry;

  auditBuffer.unshift(entry);
  if (auditBuffer.length > MAX_ENTRIES) {
    auditBuffer.length = MAX_ENTRIES;
  }

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

export function getAuditLog(limit = 100): AuditEntry[] {
  return auditBuffer.slice(0, limit);
}
