import { env } from "./env";
import { prisma } from "./prisma";

export type AuditEvent = {
  action: string;
  actor?: string | null;
  target?: string | null;
  meta?: Record<string, unknown>;
};

// Retained for call-site compatibility: entries now live in the AuditLog table,
// so this is only the shape handed to the console line below.
export type AuditEntry = AuditEvent & { ts: string };

// Credentials must never land in an audit payload, whatever a caller passes.
const SENSITIVE_KEY =
  /(pass(word)?|secret|token|otp|authorization|api[-_]?key|cookie|session|credential|hash|salt)/i;
const MAX_KEYS = 30;

function sanitizeMeta(
  meta: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  const out: Record<string, unknown> = {};
  let n = 0;
  for (const [k, v] of Object.entries(meta)) {
    if (SENSITIVE_KEY.test(k)) continue;
    if (n++ >= MAX_KEYS) break;
    if (v === null || ["string", "number", "boolean"].includes(typeof v)) {
      out[k] = v;
    } else {
      try {
        out[k] = JSON.parse(JSON.stringify(v));
      } catch {
        out[k] = String(v);
      }
    }
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * Record an administrative action durably (AuditLog table) and on the console.
 *
 * Synchronous by design — 15+ call sites use it fire-and-forget style — so the
 * DB write is launched without awaiting. A failure logs but never breaks the
 * request that triggered it.
 */
export function logAudit(event: AuditEvent): void {
  const ts = new Date();
  const meta = sanitizeMeta(event.meta);
  const actor = event.actor ?? null;
  const target = event.target ?? null;

  if (env.isProd) {
    console.log(
      "[audit]",
      JSON.stringify({ ts: ts.toISOString(), action: event.action, actor, target, ...(meta ? { meta } : {}) })
    );
  } else {
    console.log("[audit]", event.action, actor ?? "-", target ?? "-", meta ? JSON.stringify(meta) : "");
  }

  void prisma.auditLog
    .create({
      data: {
        createdAt: ts,
        action: event.action,
        actor,
        target,
        meta: (meta ?? undefined) as never,
      },
    })
    .catch((err: unknown) => {
      console.error(
        "[audit] failed to persist",
        event.action,
        err instanceof Error ? err.message : err
      );
    });
}
