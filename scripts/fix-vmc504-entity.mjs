import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Targeted fix (user-approved): Ch-18 Q15 option stored as "&lt; 5%" must be "< 5%".
// Touches exactly 2 rows: ChapterMcq (order 354) + the matching Question row.
// Aborts without writing unless the DB matches the expected shape exactly.
//
// Usage: node scripts/fix-vmc504-entity.mjs --dry-run   # preview only
//        node scripts/fix-vmc504-entity.mjs             # apply

const CHAPTER_ID = "cmsr043670003t8k52qcws78m";
const TRACK = "veterinary-microbiology-vmc504";
const DRY_RUN = process.argv.includes("--dry-run");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const mcqs = await prisma.chapterMcq.findMany({
  where: { chapterId: CHAPTER_ID, options: { contains: "&lt;" } },
});
const tests = await prisma.mockTest.findMany({ where: { track: TRACK }, select: { id: true } });
const qs = await prisma.question.findMany({
  where: { mockTestId: { in: tests.map((t) => t.id) }, options: { contains: "&lt;" } },
});

console.log(`ChapterMcq rows with entity: ${mcqs.length} | Question rows with entity: ${qs.length}`);
if (mcqs.length !== 1 || qs.length !== 1) {
  console.error("ABORT: expected exactly 1+1 rows. No writes performed.");
  await prisma.$disconnect();
  process.exit(1);
}
const [m] = mcqs;
const [q] = qs;
if (m.order !== 354) {
  console.error(`ABORT: expected ChapterMcq order 354, found ${m.order}. No writes performed.`);
  await prisma.$disconnect();
  process.exit(1);
}
console.log("BEFORE mcq :", JSON.stringify(JSON.parse(m.options)));
console.log("BEFORE q   :", JSON.stringify(JSON.parse(q.options)));

const fixed = JSON.stringify(JSON.parse(m.options).map((o) => o.replaceAll("&lt;", "<")));
console.log("AFTER      :", fixed);
if (JSON.stringify(JSON.parse(q.options)) !== JSON.stringify(JSON.parse(m.options))) {
  console.error("ABORT: bank and test rows differ — investigate first. No writes performed.");
  await prisma.$disconnect();
  process.exit(1);
}

if (DRY_RUN) {
  console.log("DRY RUN — nothing written.");
} else {
  await prisma.chapterMcq.update({ where: { id: m.id }, data: { options: fixed } });
  await prisma.question.update({ where: { id: q.id }, data: { options: fixed } });
  console.log("WROTE 2 rows.");
}
await prisma.$disconnect();
