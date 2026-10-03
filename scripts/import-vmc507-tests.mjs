import "dotenv/config";
import mammoth from "mammoth";
import { readFileSync } from "fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import sanitizeHtml from "sanitize-html";

// Imports the VMC 507 Vaccinology end-of-chapter question banks (read
// out of the Complete Book .docx) into the DB:
//   1) 380 ChapterMcq rows -> course chapter VMC 507 (flat bank, order 0..379)
//      Powers /reader/[chapterId]/practice
//   2) 19 MockTest rows x 20 Question rows -> subject Veterinary Microbiology (M.V.Sc)
//      One mock test per book chapter.
//
// Source layout inside the Complete Book (split at "<p><strong>CHAPTER N</strong></p>"):
//   <h1>N.M Multiple Choice Questions</h1>
//   <p><strong>1.\t</strong>Question text</p>
//   <p>(a) Opt A (b) Opt B (c) Opt C (d) Opt D</p>
//   ... x20 ...
//   <h3>Answer Key</h3>
//   <table>... 1. (b) ... 20. (d) ...</table>
//   <h1>N.(M+1) Short Answer Questions</h1>
//
// Gating decision (same as scripts/import-vmc502-tests.mjs / import-vmc503.mjs /
// import-vmc504-tests.mjs): MockTest.exam is stored as NULL. "mvsc" is not a
// valid exam key (ALL_EXAM_KEYS = psc/icar-entrance/net/ars), so exam="mvsc"
// would fail access.examKeys.has() for everyone -- including admins -- and lock
// the tests. With exam=null + subjectId set, gating follows the MVSc programme
// plan (slug "mvsc") or the Veterinary Microbiology subject plan.
//
// Usage:
//   node scripts/import-vmc507-tests.mjs --dry-run   # parse + validate, no DB writes
//   node scripts/import-vmc507-tests.mjs             # insert (aborts if already imported)
//   node scripts/import-vmc507-tests.mjs --force     # delete + rebuild

const SRC =
  "D:\\Preparation for Competitive Examinations\\Academic Programmes\\M.V.Sc\\Veterinary Microbiology (M.V.Sc)\\VMC 507 (Vaccinology)\\VMC507_Vaccinology_Complete_Book.docx";
const CHAPTER_ID = "cmsr043wx0006t8k5tqgdvsuk"; // VMC 507 | Vaccinology
const SUBJECT_ID = "cmsqtshkn00bcwwk5cqcqk5d0"; // M.V.Sc | Veterinary Microbiology
const TRACK = "veterinary-microbiology-vmc507";

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");

const EXPECTED_CHAPTERS = 19;
const EXPECTED_PER_CHAPTER = 20;

const OPENER_RE = /CHAPTER\s*(\d{1,2})/g;
const MCQ_RE = /<h[1-4][^>]*>\s*\d+\.\d+\s+Multiple Choice Questions\s*<\/h[1-4]>/i;
const SHORT_RE = /<h[1-4][^>]*>\s*\d+\.\d+\s+Short Answer Questions\s*<\/h[1-4]>/i;
const KEY_RE = /<h[1-4][^>]*>\s*Answer Key\s*<\/h[1-4]>/i;

function fail(msg) {
  throw new Error(msg);
}

function plain(html) {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}

// Question text and options are rendered as PLAIN text by the practice player /
// test player, so HTML entities would show up literally ("&gt; 1 mm"). Decode
// after stripping tags. (&amp; last, so "&amp;lt;" -> "&lt;" not "<".)
function decode(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&");
}

function deriveTitle(html, label) {
  const paras = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].slice(0, 12).map((m) => m[1]);
  for (let i = 0; i < paras.length; i++) {
    const num = plain(paras[i]).match(/^CHAPTER\s*(\d+)$/i);
    if (num && paras[i + 1]) {
      const family = plain(paras[i + 1]);
      if (family) return { num: Number(num[1]), family, title: `Chapter ${Number(num[1])}: ${family}` };
    }
  }
  fail(`Cannot derive chapter title from ${label}`);
}

function parseOptions(optsHtml) {
  const txt = decode(plain(optsHtml));
  // Option markers look like "(a) ...". Sequences such as "V(D)J recombination"
  // are terms, not markers: they have a word character on BOTH sides of the
  // parenthesis, while real markers are attached on at most one side.
  const marks = [...txt.matchAll(/\(\s*([a-dA-D])\s*\)/g)].filter((m) => {
    const before = m.index > 0 ? txt[m.index - 1] : "";
    const after = txt[m.index + m[0].length] || "";
    return !(/[A-Za-z0-9]/.test(before) && /[A-Za-z0-9]/.test(after));
  });
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

// Book key cells read "1. (b)" (dot, no dash) -- VMC 502/503/504 used "1-(b)".
function parseAnswerKey(keyRegion) {
  const txt = plain(keyRegion);
  const map = new Map();
  for (const m of txt.matchAll(/(\d{1,2})\s*[.\-–—]*\s*\(\s*([a-dA-D])\s*\)/g)) {
    map.set(Number(m[1]), m[2].toLowerCase());
  }
  if (map.size !== EXPECTED_PER_CHAPTER) fail(`answer key has ${map.size} entries, expected ${EXPECTED_PER_CHAPTER}: ${txt}`);
  for (let n = 1; n <= EXPECTED_PER_CHAPTER; n++) {
    if (!map.has(n)) fail(`answer key missing entry for question ${n}`);
  }
  return map;
}

// MCQ heading -> Short Answer heading; Answer Key splits questions from key.
// (Heading levels differ across the book, so the span is cut by heading text,
// never by assumed levels.)
function parseChapterQuestions(html, label) {
  const mcqHit = html.match(MCQ_RE);
  if (!mcqHit) fail(`${label}: no "Multiple Choice Questions" heading found`);
  const start = mcqHit.index + mcqHit[0].length;

  const rest = html.slice(start);
  const shortHit = rest.match(SHORT_RE);
  if (!shortHit) fail(`${label}: no "Short Answer Questions" heading after the MCQ block`);
  const span = rest.slice(0, shortHit.index);

  const keyHit = span.match(KEY_RE);
  if (!keyHit) fail(`${label}: no "Answer Key" heading inside the MCQ block`);

  const qRegion = span.slice(0, keyHit.index);
  const keyRegion = span.slice(keyHit.index + keyHit[0].length);

  const ps = [...qRegion.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
  if (ps.length !== EXPECTED_PER_CHAPTER * 2) {
    console.error(`\n--- diagnostic: ${label} found ${ps.length} paragraphs (expected ${EXPECTED_PER_CHAPTER * 2}) ---`);
    ps.forEach((p, i) => console.error(`  [${String(i).padStart(2, "0")}] ${plain(p).slice(0, 120)}`));
    fail(`${label}: expected ${EXPECTED_PER_CHAPTER * 2} paragraphs (Q+opts pairs), got ${ps.length}`);
  }

  const key = parseAnswerKey(keyRegion);
  const questions = [];
  for (let i = 0; i < ps.length; i += 2) {
    const n = i / 2 + 1;
    const text = decode(plain(ps[i])).replace(/^\s*\d+\s*[.)]\s*/, "");
    if (!text) fail(`${label}: question ${n} text is empty`);
    const options = parseOptions(ps[i + 1]);
    const letter = key.get(n);
    const correctIndex = "abcd".indexOf(letter);
    if (correctIndex < 0) fail(`${label}: question ${n} has bad answer "${letter}"`);
    questions.push({ text, options, correctIndex, marks: 1, explanation: null, difficulty: 2 });
  }
  return questions;
}

function lecturesOf(html) {
  const m = plain(html).match(/Lectures?\s*[\d\s\u2013\u2014,-]+/i);
  return m ? m[0].replace(/\s+/g, " ").trim() : null;
}

// Same splitter as scripts/upload-vmc507-chapters.mjs.
function splitChapters(book) {
  const openers = [...book.matchAll(OPENER_RE)].map((m) => ({
    n: Number(m[1]),
    idx: m.index,
    pStart: book.lastIndexOf("<p", m.index),
  }));
  const nums = openers.map((o) => o.n);
  const expected = Array.from({ length: EXPECTED_CHAPTERS }, (_, i) => i + 1);
  if (JSON.stringify(nums) !== JSON.stringify(expected)) fail(`chapter openers out of sequence: ${JSON.stringify(nums)}`);
  const indexHeading = book.indexOf("<h1>Index</h1>", openers[openers.length - 1].idx);
  if (indexHeading < 0) fail("back-matter <h1>Index</h1> not found after chapter 19");
  return openers.map((o, i) => {
    const end = i + 1 < openers.length ? book.lastIndexOf("<p", openers[i + 1].idx) : indexHeading;
    return book.slice(o.pStart, end);
  });
}

async function main() {
  console.log(`\nVMC 507 mock-test / MCQ import${DRY_RUN ? " [DRY RUN]" : ""}`);
  console.log("source:", SRC);
  console.log("chapterId:", CHAPTER_ID, "| subjectId:", SUBJECT_ID, "| track:", TRACK, FORCE ? "(--force)" : "");

  const buffer = readFileSync(SRC);
  const { value: book } = await mammoth.convertToHtml({ buffer }, { convertImage: mammoth.images.dataUri });
  const segments = splitChapters(book);
  if (segments.length !== EXPECTED_CHAPTERS) fail(`expected ${EXPECTED_CHAPTERS} chapters, found ${segments.length}`);

  const chapters = [];
  segments.forEach((html, i) => {
    const { num, family, title } = deriveTitle(html, `segment ${i + 1}`);
    if (num !== i + 1) fail(`segment ${i + 1}: chapter number ${num} out of sequence`);
    const questions = parseChapterQuestions(html, title);
    chapters.push({ num, family, title, questions, lectures: lecturesOf(html), source: `book ch${num}` });
  });

  // Report
  let grandA = 0, grandB = 0, grandC = 0, grandD = 0;
  for (const c of chapters) {
    const hist = [0, 0, 0, 0];
    c.questions.forEach((q) => hist[q.correctIndex]++);
    grandA += hist[0]; grandB += hist[1]; grandC += hist[2]; grandD += hist[3];
    console.log(
      `  Ch-${String(c.num).padStart(2, "0")} ${c.family.padEnd(46)} ` +
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
    console.log("  NOTE: answer key is heavily skewed toward (b) -- a book-wide authoring artifact,");
    console.log("        not a parse bug (VMC 503 was 79.7% b, VMC 504 similar).");
  }

  // Spot-check sample so a bad parse is visible before anything is written.
  const s1 = chapters[0].questions[0];
  const s2 = chapters[0].questions[19];
  const withEntities = chapters.flatMap((c) => c.questions).filter((q) => /&[a-z#0-9]+;/i.test(q.text + q.options.join("")));
  console.log("\n  sample parse (Ch-01):");
  console.log(`    Q1  ${s1.text}`);
  console.log(`        options=${JSON.stringify(s1.options)} correct=${s1.correctIndex} [${"abcd"[s1.correctIndex]}]`);
  console.log(`    Q20 ${s2.text}`);
  console.log(`        options=${JSON.stringify(s2.options)} correct=${s2.correctIndex} [${"abcd"[s2.correctIndex]}]`);
  console.log(`  questions still holding HTML entities: ${withEntities.length}`);

  if (DRY_RUN) {
    console.log("\nDRY RUN complete -- nothing written.");
    return;
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

  const chapter = await prisma.chapter.findUnique({ where: { id: CHAPTER_ID }, select: { id: true, courseCode: true, subjectId: true } });
  if (!chapter) fail(`Chapter ${CHAPTER_ID} not found`);
  if (chapter.courseCode !== "VMC 507") fail(`courseCode mismatch: ${chapter.courseCode}`);
  if (chapter.subjectId !== SUBJECT_ID) fail(`subjectId mismatch: ${chapter.subjectId}`);

  const existingMcq = await prisma.chapterMcq.count({ where: { chapterId: CHAPTER_ID } });
  const existingTest = await prisma.mockTest.count({ where: { track: TRACK } });
  if ((existingMcq > 0 || existingTest > 0) && !FORCE) {
    console.error(`\nABORT: already imported -- ChapterMcq=${existingMcq}, MockTest(track)=${existingTest}.`);
    console.error("       Re-run with --force to delete and rebuild.");
    await prisma.$disconnect();
    process.exit(1);
  }

  // Neon is remote: sequential queries blow past Prisma's 5s interactive-transaction
  // default. Nested create collapses test+questions to one query each, and the timeout
  // is raised so a slow network never leaves a half-written batch behind.
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
      // nondeterministic on ties (seen live on VMC 504 ch7/9/13/15).
      const stampBase = Date.now();
      let stampTick = 0;
      for (const c of chapters) {
        const nn = String(c.num).padStart(2, "0");
        await tx.mockTest.create({
          data: {
            title: `VMC 507 Ch-${nn}: ${c.family} - Mock Test (${c.questions.length} MCQs)`,
            description:
              `VMC 507 Vaccinology - Chapter ${c.num} ${c.family}` +
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
    { timeout: 180_000, maxWait: 20_000 }
  );

  console.log(`\nInserted ${mcqCount} ChapterMcq rows (order 0..${mcqCount - 1}).`);
  console.log(`Inserted ${testCount} MockTest rows + ${questionCount} Question rows.`);
  console.log(`\nVerify with: node scripts/verify-vmc507.mjs`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("\nFAILED:", e.message || e);
  process.exit(1);
});
