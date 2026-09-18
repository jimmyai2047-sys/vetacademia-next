-- GovtScheme: admin-managed yojana/bima cards (additive only, idempotent).
-- CreateTable
CREATE TABLE IF NOT EXISTS "GovtScheme" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "summary" TEXT,
    "details" TEXT,
    "linkUrl" TEXT,
    "linkLabel" TEXT,
    "lastDate" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GovtScheme_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX IF NOT EXISTS "GovtScheme_published_idx" ON "GovtScheme"("published");
