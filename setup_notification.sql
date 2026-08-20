CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'GENERAL',
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Notification" ("id","userId","title","body","type","read","createdAt") VALUES
('ntf_welcome', NULL, 'Welcome to VetAcademia!', 'Start with Flashcards to revise key concepts.', 'GENERAL', false, now()),
('ntf_live', NULL, 'Live Class Scheduled', 'Join the Veterinary Officer crash course - check the Live tab.', 'LIVE', false, now()),
('ntf_doubt', NULL, 'Ask an Expert', 'Stuck on a topic? Post your doubt in the Ask tab.', 'DOUBT', false, now());
