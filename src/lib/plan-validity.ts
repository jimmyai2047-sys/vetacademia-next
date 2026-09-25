// Plan validity / payment expiry policy.
//
// Lifetime cutoff: purchases (Payment.createdAt) on or before 24.09.2026
// 20:40 IST (= 2026-09-24T15:10:00Z) keep lifetime access to the purchased
// course, regardless of any validityDays set on the plan later.
// Purchases after the cutoff expire per the plan's validityDays
// (null validityDays = lifetime product, e.g. project reports).

export const LIFETIME_CUTOFF = new Date("2026-09-24T15:10:00.000Z");

export function isGrandfathered(purchasedAt: Date): boolean {
  return purchasedAt.getTime() <= LIFETIME_CUTOFF.getTime();
}

// Returns the expiresAt to store when a payment is marked PAID,
// or null for lifetime access.
export function computeExpiresAt(
  purchasedAt: Date,
  validityDays: number | null | undefined,
  paidAt: Date = new Date()
): Date | null {
  if (isGrandfathered(purchasedAt)) return null;
  if (!validityDays || validityDays <= 0) return null;
  return new Date(paidAt.getTime() + validityDays * 24 * 60 * 60 * 1000);
}

export function isPaymentActive(expiresAt: Date | null | undefined, now: Date = new Date()): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() > now.getTime();
}
export function formatValidity(validityDays: number | null | undefined): string {
  if (!validityDays || validityDays <= 0) return "Lifetime access";
  if (validityDays === 180) return "6 months access";
  if (validityDays === 365) return "12 months or 1 year access";
  if (validityDays === 730) return "24 months or 2 years access";
  if (validityDays % 365 === 0) {
    const y = validityDays / 365;
    return `${y} year${y > 1 ? "s" : ""} access`;
  }
  if (validityDays % 30 === 0) {
    const m = validityDays / 30;
    return `${m} month${m > 1 ? "s" : ""} access`;
  }
  return `${validityDays} days access`;
}

// Allowed validity options for any plan: minimum 6 months.
// null (blank) = lifetime access. Each duration is priced separately
// via its own Plan row (e.g. bvsc-6mo, bvsc-12mo, bvsc-24mo, bvsc-lifetime).
export const ALLOWED_VALIDITY_DAYS = [180, 365, 730] as const;

export const VALIDITY_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Lifetime" },
  { value: "180", label: "6 months" },
  { value: "365", label: "12 months or 1 year" },
  { value: "730", label: "24 months or 2 years" },
];

// Normalises admin input to a storable validityDays value.
// Returns { value } on success or { error } when the option is not allowed.
export function parseValidityDays(input: unknown): { value: number | null; error?: string } {
  if (input === undefined || input === null || input === "") return { value: null };
  const n = Number(input);
  if (!Number.isInteger(n)) return { value: null, error: "Validity must be Lifetime, 6, 12 or 24 months" };
  if (n === 0) return { value: null };
  if ((ALLOWED_VALIDITY_DAYS as readonly number[]).includes(n)) return { value: n };
  return { value: null, error: "Validity must be Lifetime, 6, 12 or 24 months (minimum 6 months)" };
}
// Duration pricing: each validity tier is priced as a ratio of the lifetime
// anchor, snapped to 9-endings (e.g. 1874.25 -> 1869, 14999.5 -> 14999).
export const DURATION_RATIOS: { days: number; ratio: number; label: string }[] = [
  { days: 180, ratio: 0.5, label: "6 months" },
  { days: 365, ratio: 0.75, label: "12 months or 1 year" },
  { days: 730, ratio: 0.9, label: "24 months or 2 years" },
];

export function snap9(n: number): number {
  const snapped = Math.round(n / 10) * 10 - 1;
  return snapped > 0 ? snapped : Math.max(1, Math.round(n));
}

export function deriveDurationPrices(lifetimePrice: number): {
  validityDays: number | null;
  price: number;
  label: string;
}[] {
  return [
    { validityDays: null, price: lifetimePrice, label: "Lifetime" },
    ...DURATION_RATIOS.map((r) => ({
      validityDays: r.days as number | null,
      price: snap9(lifetimePrice * r.ratio),
      label: r.label,
    })),
  ];
}

// Prisma `where` fragment: only payments that currently grant access.
// Spread alongside the caller's own filters (e.g. userId + status PAID).
export function activeAccessFilter(now: Date = new Date()) {
  return { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] };
}
