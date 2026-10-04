-- Architecture hardening: native PG enums for closed value sets + VetCase table.
-- All enum value lists were audited against production data before writing.
-- Each ALTER uses an explicit USING cast: if an unexpected value exists the
-- statement fails WITHOUT changing anything (safe abort, no data loss).

-- 1) Create enum types (idempotent DO blocks)
DO $$ BEGIN CREATE TYPE "Role" AS ENUM ('STUDENT', 'ANIMAL_OWNER', 'ADMIN', 'GUEST', 'EXPERT', 'TEACHING_ASSOCIATE', 'ASSISTANT_PROFESSOR', 'ASSOCIATE_PROFESSOR', 'PROFESSOR', 'SCIENTIST', 'SENIOR_SCIENTIST', 'PRINCIPAL_SCIENTIST', 'VETERINARY_OFFICER', 'SENIOR_VETERINARY_OFFICER', 'DEPUTY_DIRECTOR', 'JOINT_DIRECTOR', 'ADDITIONAL_DIRECTOR', 'DIRECTOR'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ConsultationStatus" AS ENUM ('PENDING', 'CANCELLED', 'COMPLETED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "DoubtStatus" AS ENUM ('OPEN', 'ANSWERED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "LiveClassStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PlanType" AS ENUM ('COURSE', 'EXAM'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ReportAnimalType" AS ENUM ('GOAT', 'SHEEP', 'PIG', 'POULTRY', 'DAIRY', 'CATTLE', 'BUFFALO'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'PAID'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ExpertApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "MockTestKind" AS ENUM ('MOCK', 'ADAPTIVE', 'PREVIOUS_YEAR'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "VetCaseStatus" AS ENUM ('OPEN', 'REVIEWED', 'CLOSED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Convert columns (drop text defaults first — PG cannot auto-cast a
-- DEFAULT expression; re-set them as enum defaults right after).
-- Each USING cast aborts safely on unexpected values (no data loss).
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING ("role"::"Role");
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'STUDENT'::"Role";
ALTER TABLE "Payment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Payment" ALTER COLUMN "status" TYPE "PaymentStatus" USING ("status"::"PaymentStatus");
ALTER TABLE "Payment" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"PaymentStatus";
ALTER TABLE "Consultation" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Consultation" ALTER COLUMN "status" TYPE "ConsultationStatus" USING ("status"::"ConsultationStatus");
ALTER TABLE "Consultation" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"ConsultationStatus";
ALTER TABLE "Doubt" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Doubt" ALTER COLUMN "status" TYPE "DoubtStatus" USING ("status"::"DoubtStatus");
ALTER TABLE "Doubt" ALTER COLUMN "status" SET DEFAULT 'OPEN'::"DoubtStatus";
ALTER TABLE "LiveClass" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "LiveClass" ALTER COLUMN "status" TYPE "LiveClassStatus" USING ("status"::"LiveClassStatus");
ALTER TABLE "LiveClass" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED'::"LiveClassStatus";
ALTER TABLE "Plan" ALTER COLUMN "type" TYPE "PlanType" USING ("type"::"PlanType");
ALTER TABLE "GeneratedReport" ALTER COLUMN "animalType" TYPE "ReportAnimalType" USING ("animalType"::"ReportAnimalType");
ALTER TABLE "GeneratedReport" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "GeneratedReport" ALTER COLUMN "status" TYPE "ReportStatus" USING ("status"::"ReportStatus");
ALTER TABLE "GeneratedReport" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"ReportStatus";
ALTER TABLE "ExpertApplication" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ExpertApplication" ALTER COLUMN "status" TYPE "ExpertApplicationStatus" USING ("status"::"ExpertApplicationStatus");
ALTER TABLE "ExpertApplication" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"ExpertApplicationStatus";
ALTER TABLE "MockTest" ALTER COLUMN "kind" DROP DEFAULT;
ALTER TABLE "MockTest" ALTER COLUMN "kind" TYPE "MockTestKind" USING ("kind"::"MockTestKind");
ALTER TABLE "MockTest" ALTER COLUMN "kind" SET DEFAULT 'MOCK'::"MockTestKind";

-- 3) VetCase table (clinical cases submitted for expert review)
CREATE TABLE "VetCase" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "species" TEXT NOT NULL,
  "age" TEXT,
  "contact" TEXT NOT NULL,
  "history" TEXT NOT NULL,
  "photoUrls" TEXT[] NOT NULL DEFAULT '{}',
  "status" "VetCaseStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VetCase_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "VetCase" ADD CONSTRAINT "VetCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "VetCase_userId_idx" ON "VetCase"("userId");
CREATE INDEX "VetCase_status_idx" ON "VetCase"("status");
