import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Removes the in-chapter "Multiple Choice Questions" + "Answer Key" blocks from
// all 20 VMC 504 chapter HTMLs (user decision: the end-of-chapter mock test is
// the single home for MCQs; keeping them in the body is repetition).
// The practice bank (ChapterMcq) and mock tests are untouched.
//
// Cut span per chapter: from the "<h?>N.M Multiple Choice Questions" heading
// to (not incl.) the "<h?>N.(M+1) Short Answer Questions" heading.
// Aborts a chapter (no write) unless the pattern matches exactly once.
//
// Usage: node scripts/strip-vmc504-mcq.mjs --dry-run   # preview, no writes
//        node scripts/strip-vmc504-mcq.mjs             # apply + re-verify

const CHAPTER_ID = "cmsr043670003t8k52qcws78m";
const DRY_RUN = process.argv.includes("--dry-run");

const MCQ_RE = /<h([1-4])[^>]*>\s*\d+\.\d+\s+Multiple Choice Questions\s*<\/h\1\s*>/i;
const SHORT_RE = /<h([1-4])[^>]*>\s*\d+\.\d+\s+Short Answer Questions\s*<\/h\1\s*>/i;
const KEY_RE = /<h([1-4])[^>]*>\s*Answer Key\s*<\/h\1\s*>/i;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const sections = await prisma.chapterSection.findMany({
  where: { chapterId: CHAPTER_ID },
  orderBy: { order: "asc" },
});
if (sections.length !== 20) throw new Error(`expected 20 sections, found ${sections.length}`);

let failures = 0;
for (const s of sections) {
  const mcqHits = [...s.content.matchAll(new RegExp(MCQ_RE, "gi"))];
  const shortHits = [...s.content.matchAll(new RegExp(SHORT_RE, "gi"))];
  const tag = `${s.title}`;
  if (mcqHits.length !== 1 || shortHits.length !== 1) {
    console.log(`SKIP ${tag}: mcq headings=${mcqHits.length}, short headings=${shortHits.length}`);
    failures++;
    continue;
  }
  const start = mcqHits[0].index;
  const endCandidates = shortHits.map((h) => h.index).filter((i) => i > start);
  if (endCandidates.length !== 1) {
    console.log(`SKIP ${tag}: short heading not uniquely after MCQ block`);
    failures++;
    continue;
  }
  const end = endCandidates[0];
  const span = s.content.slice(start, end);
  const keyHits = [...span.matchAll(new RegExp(KEY_RE, "gi"))];
  if (keyHits.length !== 1) {
    console.log(`SKIP ${tag}: answer-key headings in span=${keyHits.length}`);
    failures++;
    continue;
  }
  if (span.length < 1500 || span.length > 12000) {
    console.log(`SKIP ${tag}: span length ${span.length} implausible`);
    failures++;
    continue;
  }
  const rest = s.content.slice(0, start) + s.content.slice(end);
  const mustRemain = ["Short Answer Questions", "Long Answer Questions", "Summary", "Glossary", "Suggested Readings"];
  const lost = mustRemain.filter((b) => !rest.toLowerCase().includes(b.toLowerCase()));
  const mustGo = ["Multiple Choice Questions", "Answer Key"];
  const left = mustGo.filter((b) => rest.includes(b));
  console.log(
    `${DRY_RUN ? "PREVIEW" : "CUT"} ${tag}: -${span.length} chars (${s.content.length} -> ${rest.length}) ` +
      `mcqTag=${mcqHits[0][0].slice(0, 40)}... lost=[${lost.join(",") || "none"}] left=[${left.join(",") || "none"}]`
  );
  if (lost.length || left.length) {
    failures++;
    continue;
  }
  if (!DRY_RUN) {
    await prisma.chapterSection.update({ where: { id: s.id }, data: { content: rest } });
  }
}

// Re-verify from DB (reads back what is actually stored)
if (!DRY_RUN && failures === 0) {
  const re = await prisma.chapterSection.findMany({ where: { chapterId: CHAPTER_ID }, orderBy: { order: "asc" } });
  const bad = re.filter((s) => s.content.includes("Multiple Choice Questions") || s.content.includes("Answer Key"));
  console.log(bad.length === 0 ? "RE-VERIFY: 0 chapters still contain MCQ/Answer-Key blocks." : `RE-VERIFY FAIL: ${bad.map((s) => s.title).join(", ")}`);
  if (bad.length) failures++;
}
await prisma.$disconnect();
console.log(failures === 0 ? (DRY_RUN ? "DRY RUN OK — no writes." : "DONE — all 20 chapters stripped.") : `${failures} PROBLEM(S) — review above.`);
process.exit(failures ? 1 : 0);
