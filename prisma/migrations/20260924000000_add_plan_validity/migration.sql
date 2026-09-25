-- Add plan validity durations and payment expiry.
-- Policy: purchases made up to 24.09.2026 20:40 IST (2026-09-24T15:10:00Z)
-- keep lifetime access. New nullable columns default to NULL (= lifetime),
-- so all existing rows are grandfathered automatically with no data rewrite.
-- Idempotent so it is safe if the columns were applied out-of-band.
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "validityDays" INTEGER;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Payment_expiresAt_idx" ON "Payment"("expiresAt");
