// VetProforma lifecycle (finding 13 of the 20 Oct 2026 admin review).
// The column is a plain string (legacy rows already carry real values;
// the migration backfilled title/description "(Draft)" rows to DRAFT).

export const PROFORMA_STATUSES = [
  "DRAFT",
  "APPROVED",
  "SUPERSEDED",
  "ARCHIVED",
] as const;

export type ProformaStatus = (typeof PROFORMA_STATUSES)[number];

export const PROFORMA_STATUS_LABELS: Record<ProformaStatus, string> = {
  DRAFT: "Draft",
  APPROVED: "Approved",
  SUPERSEDED: "Superseded",
  ARCHIVED: "Archived",
};

export function isProformaStatus(value: unknown): value is ProformaStatus {
  return (
    typeof value === "string" &&
    (PROFORMA_STATUSES as readonly string[]).includes(value)
  );
}

// Never shown on the public site regardless of the `published` flag.
export const PUBLIC_HIDDEN_STATUSES: readonly ProformaStatus[] = [
  "SUPERSEDED",
  "ARCHIVED",
];
