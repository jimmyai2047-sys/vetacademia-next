-- Storefront listing flag so full-course rows can be retired from sale
-- while existing (grandfathered lifetime) buyers keep access.
-- Idempotent so it is safe if applied out-of-band.
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "isListed" BOOLEAN NOT NULL DEFAULT true;
-- Retire full-course bundles: slices only from here on.
UPDATE "Plan" SET "isListed" = false WHERE slug IN ('ahdp', 'bvsc', 'mvsc', 'phd');
