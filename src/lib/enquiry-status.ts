// Admission enquiry follow-up pipeline (finding 12 of the 20 Oct 2026 admin
// review). Status stays a plain string column (existing rows only ever wrote
// "NEW") — these constants are the validated vocabulary, not a DB enum.

export const ENQUIRY_STATUSES = [
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "CONVERTED",
  "CLOSED",
] as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  FOLLOW_UP: "Follow-up",
  CONVERTED: "Converted",
  CLOSED: "Closed",
};

export function isEnquiryStatus(value: unknown): value is EnquiryStatus {
  return (
    typeof value === "string" &&
    (ENQUIRY_STATUSES as readonly string[]).includes(value)
  );
}

// Statuses where a "next action" is still meaningful.
export function isOpenEnquiryStatus(status: string): boolean {
  return status === "NEW" || status === "CONTACTED" || status === "FOLLOW_UP";
}
