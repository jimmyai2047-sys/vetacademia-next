import "dotenv/config";
import mammoth from "mammoth";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import sanitizeHtml from "sanitize-html";

// Imports the VMC 504 Systematic Veterinary Virology end-of-chapter question banks
// (read straight out of the per-chapter .docx files) into the DB:
//   1) 400 ChapterMcq rows -> course chapter VMC 504 (flat bank, order 0..399)
//      Powers /reader/[chapterId]/practice
//   2) 20 MockTest rows x 20 Question rows -> subject Veterinary Microbiology (M.V.Sc)
//      One mock test per book chapter.
//
// Source layout inside every "Individual Book Chapter in Word file/VMC504_ChapterNN_*.docx":
//   <h1>NN.M Multiple Choice Questions</h1>
//   <p>1. Question text:</p>
//   <p>(a) Opt A     (b) Opt B     (c) Opt C     (d) Opt D</p>
//   ... x20 ...
//   <h3>Answer Key</h3>
//   <p>1-(b)    2-(b)    ...    20-(b)</p>
//   <h1>NN.(M+1) Short Answer Questions</h1>
//
// Gating decision (same as scripts/import-vmc503.mjs): MockTest.exam is stored as NULL.
// "mvsc" is not a valid exam key (ALL_EXAM_KEYS = psc/icar-entrance/net/ars), so
// exam="mvsc" would fail access.examKeys.has() for everyone -- including admins -- and
// lock the tests. With exam=null + subjectId set, gating follows the MVSc programme plan
// (slug "mvsc") or the Veterinary Microbiology subject plan.
//
// Usage:
//   node scripts/import-vmc504-tests.mjs --dry-run   # parse + validate, no DB writes
//   node scripts/import-vmc504-tests.mjs             # insert (aborts if already imported)
//   node scripts/import-vmc504-tests.mjs --force     # delete + rebuild

const SRC_DIR =
  "D:\\Preparation for Competitive Examinations\\Academic Programmes\\M.V.Sc\\Veterinary Microbiology (M.V.Sc)\\VMC 504 (Systematic Veterinary Virology)\\Individual Book Chapter in Word file";
const CHAPTER_ID = "cmsr043670003t8k52qcws78m"; // VMC 504 | Systematic Veterinary Virology
const SUBJECT_ID = "cmsqtshkn00bcwwk5cqcqk5d0"; // M.V.Sc | Veterinary Microbiology
const TRACK = "veterinary-microbiology-vmc504";

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");

const EXPECTED_PER_CHAPTER = 20;

function fail(msg) {
  throw new Error(msg);
}

function plain(html) {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}

function deriveTitle(html, fileName) {
  const m = html.match(/<p[^>]*>\s*CHAPTER\s*(\d+)\s*<\/p>\s*<p[^>]*>([\s\S]{1,120}?)<\/p>/i);
  if (m) {
    const num = Number(m[1]);
    const family = plain(m[2]);
    if (num && family) return { num, family, title: `Chapter ${num}: ${family}` };
  }
  const f = fileName.replace(/\.docx$/i, "").match(/Chapter(\d+)_(.+)/i);
  if (f) {
    const num = Number(f[1]);
    const family = f[2].replace(/_/g, " ");
    return { num, family, title: `Chapter ${num}: ${family}` };
  }
  fail(`Cannot derive chapter title from ${fileName}`);
}

function parseOptions(optsHtml) {
  const txt = plain(optsHtml);
  const marks = [...txt.matchAll(/\(\s*([a-dA-D])\s*\)/g)];
  if (marks.length !== 4) fail(`expected 4 options, found ${marks.length} in: ${txt}`);
  const labels = marks.map((m) => m[1].toLowerCase());
  if (labels.join("") !== "abcd") fail(`option labels out of order: ${labels.join(",")} in: ${txt}`);
  const opts = marks.map((m, idx) => {
    const start = m.index + m[0].length;
    const end = idx + 1 < marks.length ? marks[idx + 1].index : txt.length;
    return txt.slice(start, end).replace(/\s+/g, " ").trim();
  });
  if (opts.some((o) => !o)) fail(`empty option in: ${txt}`);
  return opts;
}

function parseAnswerKey(keyRegion) {
  const txt = plain(keyRegion);
  const map = new Map();
  for (const m of txt.matchAll(/(\d+)\s*[-\u2013\u2014]?\s*\(\s*([a-dA-D])\s*\)/g)) {
    map.set(Number(m[1]), m[2].toLowerCase());
  }
  if (map.size !== EXPECTED_PER_CHAPTER) fail(`answer key has ${map.size} entries, expected ${EXPECTED_PER_CHAPTER}: ${txt}`);
  for (let n = 1; n <= EXPECTED_PER_CHAPTER; n++) {
    if (!map.has(n)) fail(`answer key missing entry for question ${n}`);
  }
  return map;
}

function parseChapterQuestions(html, fileName) {
  const parts = html.split(/(?=<h1[\s>])/i);
  const seg = parts.find((p) => /<h1[^>]*>[^<]*Multiple Choice Questions/i.test(p));
  if (!seg) fail(`${fileName}: no "Multiple Choice Questions" heading found`);

  const keyMatch = seg.match(/<h3[^>]*>\s*Answer Key\s*<\/h3>([\s\S]*)$/i);
  if (!keyMatch) fail(`${fileName}: no "<h3>Answer Key</h3>" found`);

  const keyRegion = keyMatch[1];
  // keyMatch[0] spans "<h3>Answer Key</h3>" + keyRegion up to end of seg, so slicing off
  // exactly keyMatch[0].length leaves the question block. (Slicing keyMatch[0]+keyRegion
  // would remove the tail twice and silently truncate the last questions.)
  const qRegion = seg.slice(0, seg.length - keyMatch[0].length);

  const ps = [...qRegion.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
  if (ps.length !== EXPECTED_PER_CHAPTER * 2) {
    console.error(`\n--- diagnostic: ${fileName} found ${ps.length} paragraphs (expected ${EXPECTED_PER_CHAPTER * 2}) ---`);
    ps.forEach((p, i) => console.error(`  [${String(i).padStart(2, "0")}] ${plain(p).slice(0, 120)}`));
    fail(`${fileName}: expected ${EXPECTED_PER_CHAPTER * 2} paragraphs (Q+opts pairs), got ${ps.length}`);
  }

  const key = parseAnswerKey(keyRegion);
  const questions = [];
  for (let i = 0; i < ps.length; i += 2) {
    const n = i / 2 + 1;
    const text = plain(ps[i]).replace(/^\s*\d+\s*[.)]\s*/, "");
    if (!text) fail(`${fileName}: question ${n} text is empty`);
    const options = parseOptions(ps[i + 1]);
    const letter = key.get(n);
    const correctIndex = "abcd".indexOf(letter);
    if (correctIndex < 0) fail(`${fileName}: question ${n} has bad answer "${letter}"`);
    questions.push({ text, options, correctIndex, marks: 1, explanation: null, difficulty: 2 });
  }
  return questions;
}

function lecturesOf(html) {
  const m = plain(html).match(/Lectures?\s*[\d\s\u2013\u2014-]+/i);
  return m ? m[0].replace(/\s+/g, " ").trim() : null;
}

async function main() {
  console.log(`\nVMC 504 mock-test / MCQ import${DRY_RUN ? " [DRY RUN]" : ""}`);
  console.log("source:", SRC_DIR);
  console.log("chapterId:", CHAPTER_ID, "| subjectId:", SUBJECT_ID, "| track:", TRACK, FORCE ? "(--force)" : "");

  const files = readdirSync(SRC_DIR)
    .filter((f) => /\.docx$/i.test(f) && !f.startsWith("~$"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (files.length !== 20) fail(`expected 20 chapter files, found ${files.length}`);

  const chapters = [];
  for (const file of files) {
    const buffer = readFileSync(join(SRC_DIR, file));
    const { value: html } = await mammoth.convertToHtml(
      { buffer },
      { convertImage: mammoth.images.dataUri }
    );
    const { num, family, title } = deriveTitle(html, file);
    const questions = parseChapterQuestions(html, file);
    chapters.push({ num, family, title, questions, lectures: lecturesOf(html), source: file });
  }

  // Report
  let grandA = 0, grandB = 0, grandC = 0, grandD = 0;
  for (const c of chapters) {
    const hist = [0, 0, 0, 0];
    c.questions.forEach((q) => hist[q.correctIndex]++);
    grandA += hist[0]; grandB += hist[1]; grandC += hist[2]; grandD += hist[3];
    console.log(
      `  Ch-${String(c.num).padStart(2, "0")} ${c.family.padEnd(38)} ` +
        `q=${c.questions.length}  a:${hist[0]} b:${hist[1]} c:${hist[2]} d:${hist[3]}` +
        (c.lectures ? `  ${c.lectures}` : "")
    );
  }
  const total = grandA + grandB + grandC + grandD;
  console.log(`\n  TOTAL ${total} questions  a:${grandA} (${(100 * grandA / total).toFixed(1)}%)` +
    `  b:${grandB} (${(100 * grandB / total).toFixed(1)}%)` +
    `  c:${grandC} (${(100 * grandC / total).toFixed(1)}%)` +
    `  d:${grandD} (${(100 * grandD / total).toFixed(1)}%)`);
  if (grandB / total > 0.75) {
    console.log("  NOTE: answer key is heavily skewed toward (b). This matches the already-live");
    console.log("        VMC 503 batch (79.7% b) -- a book-wide authoring artifact, not a parse bug.");
  }

  // Spot-check sample so a bad parse is visible before anything is written.
  const s1 = chapters[0].questions[0];
  const s2 = chapters[0].questions[19];
  console.log("\n  sample parse (Ch-01):");
  console.log(`    Q1  ${s1.text}`);
  console.log(`        options=${JSON.stringify(s1.options)} correct=${s1.correctIndex} [${"abcd"[s1.correctIndex]}]`);
  console.log(`    Q20 ${s2.text}`);
  console.log(`        options=${JSON.stringify(s2.options)} correct=${s2.correctIndex} [${"abcd"[s2.correctIndex]}]`);

  if (DRY_RUN) {
    console.log("\nDRY RUN complete -- nothing written.");
    return;
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

  const chapter = await prisma.chapter.findUnique({ where: { id: CHAPTER_ID }, select: { id: true, courseCode: true, subjectId: true } });
  if (!chapter) fail(`Chapter ${CHAPTER_ID} not found`);
  if (chapter.courseCode !== "VMC 504") fail(`courseCode mismatch: ${chapter.courseCode}`);
  if (chapter.subjectId !== SUBJECT_ID) fail(`subjectId mismatch: ${chapter.subjectId}`);

  const existingMcq = await prisma.chapterMcq.count({ where: { chapterId: CHAPTER_ID } });
  const existingTest = await prisma.mockTest.count({ where: { track: TRACK } });
  if ((existingMcq > 0 || existingTest > 0) && !FORCE) {
    console.error(`\nABORT: already imported -- ChapterMcq=${existingMcq}, MockTest(track)=${existingTest}.`);
    console.error("       Re-run with --force to delete and rebuild.");
    await prisma.$disconnect();
    process.exit(1);
  }

  // Neon is remote: 41 sequential queries blew past Prisma's 5s interactive-transaction
  // default. Nested create collapses test+questions to one query each, and the timeout is
  // raised so a slow network never leaves a half-written batch behind.
  const { mcqCount, testCount, questionCount } = await prisma.$transaction(
    async (tx) => {
      if (FORCE) {
        const d1 = await tx.chapterMcq.deleteMany({ where: { chapterId: CHAPTER_ID } });
        const tests = await tx.mockTest.findMany({ where: { track: TRACK }, select: { id: true } });
        if (tests.length) {
          await tx.question.deleteMany({ where: { mockTestId: { in: tests.map((t) => t.id) } } });
        }
        const d2 = await tx.mockTest.deleteMany({ where: { track: TRACK } });
        console.log(`\ndeleted ${d1.count} ChapterMcq + ${d2.count} MockTest (+ their questions)`);
      }

      // 1) flat practice bank
      const mcqData = [];
      let order = 0;
      for (const c of chapters) {
        for (const q of c.questions) {
          mcqData.push({
            chapterId: CHAPTER_ID,
            question: q.text,
            options: JSON.stringify(q.options),
            correctIndex: q.correctIndex,
            marks: q.marks,
            explanation: q.explanation,
            difficulty: q.difficulty,
            order: order++,
          });
        }
      }
      const mcqRes = await tx.chapterMcq.createMany({ data: mcqData });

      // 2) one mock test per book chapter (questions nested -> 1 query per test)
      let testCount = 0;
      let questionCount = 0;
      // Explicit staggered stamps: without them all questions of a test share one
      // createdAt and `orderBy: { createdAt: "asc" }` (player read order) is
      // nondeterministic on ties (seen live on ch7/9/13/15). See fix-vmc504-qorder.mjs.
      const stampBase = Date.now();
      let stampTick = 0;
      for (const c of chapters) {
        const nn = String(c.num).padStart(2, "0");
        await tx.mockTest.create({
          data: {
            title: `VMC 504 Ch-${nn}: ${c.family} - Mock Test (${c.questions.length} MCQs)`,
            description:
              `VMC 504 Systematic Veterinary Virology - Chapter ${c.num} ${c.family}` +
              `${c.lectures ? ` (${c.lectures})` : ""}. ${c.questions.length} MCQs from the book question bank with answer key.`,
            duration: c.questions.length,
            totalMarks: c.questions.length,
            subjectId: SUBJECT_ID,
            exam: null,          // CRITICAL: see gating note in header
            track: TRACK,
            kind: "MOCK",
            isAdaptive: false,
            isDemo: false,
            questions: {
              create: c.questions.map((q) => ({
                text: q.text,
                options: JSON.stringify(q.options),
                correctAnswer: q.correctIndex,
                marks: q.marks,
                explanation: q.explanation,
                difficulty: q.difficulty,
                createdAt: new Date(stampBase + stampTick++ * 1000),
              })),
            },
          },
        });
        testCount++;
        questionCount += c.questions.length;
      }

      return { mcqCount: mcqRes.count, testCount, questionCount };
    },
    { timeout: 120_000, maxWait: 15_000 }
  );

  console.log(`\nInserted ${mcqCount} ChapterMcq rows (order 0..${mcqCount - 1}).`);
  console.log(`Inserted ${testCount} MockTest rows + ${questionCount} Question rows.`);
  console.log(`\nVerify with: node scripts/verify-vmc504.mjs`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("\nFAILED:", e.message || e);
  process.exit(1);
});
