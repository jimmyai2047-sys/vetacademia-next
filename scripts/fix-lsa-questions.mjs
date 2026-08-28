// One-time: normalize already-ingested LSA (track=livestock-assistant) PREVIOUS_YEAR
// questions -> strip numbering, reorder Hindi-first.
// Usage: GEMINI_API_KEY=... (not needed) node scripts/fix-lsa-questions.mjs
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalize } from "./normalize.mjs";

const TRACK = process.env.TRACK || "livestock-assistant";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const tests = await prisma.mockTest.findMany({
  where: { kind: "PREVIOUS_YEAR", track: TRACK },
  select: { id: true, title: true },
});
console.log(`MockTests to fix: ${tests.map((t) => t.title).join(" | ")}`);

let count = 0;
for (const t of tests) {
  const questions = await prisma.question.findMany({
    where: { mockTestId: t.id },
  });
  for (const q of questions) {
    let opts = [];
    try {
      opts = JSON.parse(q.options || "[]");
    } catch {
      opts = [];
    }
    const newText = normalize(q.text || "", "\n");
    const newOpts = opts.map((o) => normalize(o, " / "));
    if (newText !== q.text || JSON.stringify(newOpts) !== q.options) {
      await prisma.question.update({
        where: { id: q.id },
        data: { text: newText, options: JSON.stringify(newOpts) },
      });
      count++;
    }
  }
}
console.log(`Updated ${count} questions.`);
await prisma.$disconnect();
