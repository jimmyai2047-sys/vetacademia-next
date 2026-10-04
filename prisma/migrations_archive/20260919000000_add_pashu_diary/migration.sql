-- Pashu Diary: per-user animal records (additive only, idempotent).
-- IF NOT EXISTS guards keep this safe on databases with drifted history.
-- CreateTable
CREATE TABLE IF NOT EXISTS "MyAnimal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagNo" TEXT,
    "species" TEXT NOT NULL,
    "breed" TEXT,
    "gender" TEXT,
    "dob" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MyAnimal_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE IF NOT EXISTS "MilkLog" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "morning" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "evening" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MilkLog_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE IF NOT EXISTS "AnimalEvent" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "eventDate" DATE NOT NULL,
    "nextDue" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnimalEvent_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MilkLog_animalId_date_key" ON "MilkLog"("animalId", "date");
-- CreateIndex
CREATE INDEX IF NOT EXISTS "MyAnimal_userId_idx" ON "MyAnimal"("userId");
-- CreateIndex
CREATE INDEX IF NOT EXISTS "MilkLog_animalId_date_idx" ON "MilkLog"("animalId", "date");
-- CreateIndex
CREATE INDEX IF NOT EXISTS "AnimalEvent_animalId_eventDate_idx" ON "AnimalEvent"("animalId", "eventDate");
-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MilkLog_animalId_fkey') THEN
        ALTER TABLE "MilkLog" ADD CONSTRAINT "MilkLog_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "MyAnimal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AnimalEvent_animalId_fkey') THEN
        ALTER TABLE "AnimalEvent" ADD CONSTRAINT "AnimalEvent_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "MyAnimal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;
