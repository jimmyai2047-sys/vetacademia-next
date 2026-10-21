// Publication readiness for study/exam materials.
//
// One rule, used by the admin API gates, the editor form and (later) the
// operational dashboard queue: a PUBLISHED material must actually give the
// reader something to read — a file, an external link, or body content.
// Anything else ships an empty card to signed-out demo visitors.

export type ReadableSource = {
  fileUrl?: string | null;
  externalUrl?: string | null;
  body?: string | null;
};

function nonEmpty(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

export function hasReadableSource(m: ReadableSource): boolean {
  return nonEmpty(m.fileUrl) || nonEmpty(m.externalUrl) || nonEmpty(m.body);
}

/**
 * Returns a human-readable reason when `published` would ship an empty
 * material, or null when it is safe to publish.
 */
export function readinessIssue(m: ReadableSource & { published?: boolean | null }): string | null {
  if (m.published === false) return null; // drafts may be incomplete
  if (hasReadableSource(m)) return null;
  return "Published materials need a file, an external link, or body content — this one has none, so readers would see an empty card.";
}
