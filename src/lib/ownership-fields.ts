// Governance columns added by finding 13 of the 20 Oct 2026 admin review
// (owner / sourceUrl / reviewedBy / reviewedAt on the four farmer-content
// models). Shared parser so every admin route accepts them consistently:
//  - absent key  → field untouched (PUT semantics) / omitted (POST default)
//  - null / ""   → clears the field
//  - string      → trimmed value; setting reviewedBy re-stamps reviewedAt

export function ownershipInput(body: Record<string, unknown>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const str = (v: unknown): string | null | undefined => {
    if (typeof v === "string") return v.trim() || null;
    if (v === null) return null;
    return undefined;
  };
  const owner = str(body.owner);
  if (owner !== undefined) data.owner = owner;
  const sourceUrl = str(body.sourceUrl);
  if (sourceUrl !== undefined) data.sourceUrl = sourceUrl;
  const reviewedBy = str(body.reviewedBy);
  if (reviewedBy !== undefined) {
    data.reviewedBy = reviewedBy;
    data.reviewedAt = reviewedBy ? new Date() : null;
  }
  return data;
}
