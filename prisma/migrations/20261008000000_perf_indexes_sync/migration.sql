-- Sync migration: these 3 indexes were created out-of-band with
-- CREATE INDEX CONCURRENTLY (production-safe, no locking) and verified
-- in pg_indexes. This file exists only to keep migration history in sync
-- with schema.prisma @@index entries. Resolve with:
--   npx prisma migrate resolve --applied 20261008000000_perf_indexes_sync
CREATE INDEX "MockTest_kind_idx" ON "MockTest"("kind");
CREATE INDEX "Payment_userId_planSlug_status_idx" ON "Payment"("userId", "planSlug", "status");
CREATE INDEX "Post_category_published_idx" ON "Post"("category", "published");
