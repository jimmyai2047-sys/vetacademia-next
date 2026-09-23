-- Add free-preview flag to Chapter (mirrors MockTest/ExamMaterial/StudyMaterial isDemo).
-- Idempotent so it is safe if the column was applied out-of-band.
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "isDemo" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "Chapter_isDemo_idx" ON "Chapter"("isDemo");
