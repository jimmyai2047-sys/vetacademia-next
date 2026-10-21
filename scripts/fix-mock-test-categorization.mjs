import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function inferCategory(t) {
  if (t.track === "veterinary-officer") return { track: "veterinary-officer", exam: "psc", examSubjectSlug: null };
  if (t.track === "livestock-assistant") return { track: "livestock-assistant", exam: "psc", examSubjectSlug: null };
  if (t.exam === "icar-entrance" || /ICAR/i.test(t.title)) {
    const isVet = /veterinary/i.test(t.title);
    const isAnimal = /animal/i.test(t.title);
    if (isVet && !isAnimal) return { exam: "icar-entrance", track: t.track || "icar-jrf", examSubjectSlug: "veterinary-science" };
    if (isAnimal) return { exam: "icar-entrance", track: t.track || "icar-jrf", examSubjectSlug: "animal-science" };
  }
  return null;
}

const tests = await prisma.mockTest.findMany();
console.log(`Found ${tests.length} mock tests`);
let updated = 0;
for (const t of tests) {
  const inferred = inferCategory(t);
  if (!inferred) continue;
  const needsUpdate =
    (inferred.exam && t.exam !== inferred.exam) ||
    (inferred.track && t.track !== inferred.track) ||
    (inferred.examSubjectSlug && t.examSubjectSlug !== inferred.examSubjectSlug);
  if (!needsUpdate) continue;
  console.log(`Updating "${t.title}" [${t.year}] exam:${t.exam}->${inferred.exam} track:${t.track}->${inferred.track} slug:${t.examSubjectSlug}->${inferred.examSubjectSlug}`);
  await prisma.mockTest.update({
    where: { id: t.id },
    data: {
      exam: inferred.exam ?? t.exam,
      track: inferred.track ?? t.track,
      examSubjectSlug: inferred.examSubjectSlug ?? t.examSubjectSlug,
    },
  });
  updated++;
}

// Also normalize duplicate ICAR track: icar-jrf-srf vs icar-jrf — keep as is but ensure examSubjectSlug distinguishes
// For V.O./LSA ensure correct exam=psc
const voCount = await prisma.mockTest.count({ where: { track: "veterinary-officer" } });
const lsaCount = await prisma.mockTest.count({ where: { track: "livestock-assistant" } });
const icarVet = await prisma.mockTest.count({ where: { exam: "icar-entrance", examSubjectSlug: "veterinary-science" } });
const icarAnimal = await prisma.mockTest.count({ where: { exam: "icar-entrance", examSubjectSlug: "animal-science" } });
console.log(`Done. Updated ${updated}. Counts -> VO:${voCount} LSA:${lsaCount} ICAR-Vet:${icarVet} ICAR-Animal:${icarAnimal}`);
await prisma.$disconnect();
