-- Expert proforma: gender, date of birth, awards/publications (optional).
-- Idempotent so it is safe if applied out-of-band via `prisma db push`.
ALTER TABLE "Expert" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "Expert" ADD COLUMN IF NOT EXISTS "dob" TEXT;
ALTER TABLE "Expert" ADD COLUMN IF NOT EXISTS "awards" TEXT;
ALTER TABLE "ExpertApplication" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "ExpertApplication" ADD COLUMN IF NOT EXISTS "dob" TEXT;
ALTER TABLE "ExpertApplication" ADD COLUMN IF NOT EXISTS "awards" TEXT;
