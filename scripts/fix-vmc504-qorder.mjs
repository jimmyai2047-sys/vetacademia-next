import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Data rebuild (user-approved): mock-test questions stored out of book order AND
// sharing one identical createdAt per question, so `orderBy: { createdAt: "asc" }`
// (what the player uses) is nondeterministic on ties — ch7/9/13/15 read scrambled,
// and ch8 was observed flapping between runs. This script deletes + re-inserts the
// questions of EVERY affected test (tied stamps) in exact practice-bank order with
// distinct, increasing createdAt stamps (1s apart). No schema change.
// Aborts if any attempts already reference these tests.
//
// Usage: node scripts/fix-vmc504-qorder.mjs --dry-run   # preview, no writes
//        node scripts/fix-vmc504-qorder.mjs             # apply + re-verify

const CHAPTER_ID = "cmsr043670003t8k52qcws78m";
const TRACK = "veterinary-microbiology-vmc504";
const DRY_RUN = process.argv.includes("--dry-run");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const bank = await prisma.chapterMcq.findMany({ where: { chapterId: CHAPTER_ID }, orderBy: { order: "asc" } });
const tests = await prisma.mockTest.findMany({
  where: { track: TRACK },
  orderBy: { title: "asc" },
  include: { questions: { orderBy: { createdAt: "asc" } } },
});
if (tests.length !== 20) throw new Error(`expected 20 tests, found ${tests.length}`);

const targets = [];
for (let i = 0; i < tests.length; i++) {
  const qs = tests[i].questions;
  if (qs.length !== 20) throw new Error(`ch${i + 1}: ${qs.length} questions, expected 20`);
  const distinct = new Set(qs.map((q) => q.createdAt.getTime())).size;
  if (distinct !== qs.length) targets.push({ n: i + 1, test: tests[i], slice: bank.slice(i * 20, i * 20 + 20) });
}
if (targets.length === 0) console.log("No tied-stamp tests — nothing to do.");
const ids = targets.map((t) => t.test.id);
const attempts = await prisma.mockTestAttempt.count({ where: { mockTestId: { in: ids } } });
console.log(`targets: ${targets.map((t) => `ch${t.n}`).join(", ")} | existing attempts on them: ${attempts}`);
if (attempts > 0) throw new Error("ABORT: attempts exist — re-insert would orphan their answer keys.");

for (const { n, test, slice } of targets) {
  const read = test.questions.map((q) => q.text.trim());
  const want = slice.map((m) => m.question.trim());
  const diff = read.filter((r, j) => r !== want[j]).length;
  console.log(`ch${n} ${test.title.slice(0, 44)}: read-vs-bank mismatches now = ${diff}/20 ${DRY_RUN ? "(would rebuild)" : ""}`);
}

if (DRY_RUN) {
  console.log("DRY RUN — nothing written.");
} else {
  const base = Date.now();
  await prisma.$transaction(
    async (tx) => {
      for (let k = 0; k < targets.length; k++) {
        const { test, slice } = targets[k];
        await tx.question.deleteMany({ where: { mockTestId: test.id } });
        // Sequential creates in bank order with distinct stamps (deterministic read order).
        for (let j = 0; j < slice.length; j++) {
          const m = slice[j];
          await tx.question.create({
            data: {
              mockTestId: test.id,
              text: m.question,
              options: m.options,
              correctAnswer: m.correctIndex,
              marks: m.marks,
              explanation: m.explanation,
              difficulty: m.difficulty,
              createdAt: new Date(base + (k * 20 + j) * 1000),
            },
          });
        }
      }
    },
    { timeout: 120_000, maxWait: 15_000 }
  );
  console.log(`REBUILT ${targets.length} x 20 questions.`);

  // Re-verify from DB in exactly the app's read order.
  let bad = 0;
  for (const { n, test, slice } of targets) {
    const re = await prisma.question.findMany({ where: { mockTestId: test.id }, orderBy: { createdAt: "asc" } });
    const want = slice.map((m) => m.question.trim());
    const diff = re.filter((q, j) => q.text.trim() !== want[j]).length;
    const stamps = new Set(re.map((q) => q.createdAt.getTime())).size;
    console.log(`  ch${n}: mismatches=${diff}/20 distinctStamps=${stamps}/20`);
    if (diff !== 0 || stamps !== 20) bad++;
  }
  if (bad) throw new Error("RE-VERIFY FAILED");
  console.log(`RE-VERIFY: all ${targets.length} rebuilt tests read back in exact bank order with distinct stamps.`);
}
await prisma.$disconnect();
