import "dotenv/config";
import mammoth from "mammoth";
import { readFileSync } from "fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import sanitizeHtml from "sanitize-html";

// Imports the VMC 509 Techniques in Molecular Microbiology end-of-chapter
// question banks (read out of the Publication-Ready Final .docx) into the DB:
//   1) 240 ChapterMcq rows -> course chapter VMC 509 (flat bank, order 0..239)
//      Powers /reader/[chapterId]/practice
//   2) 12 MockTest rows x 20 Question rows -> subject Veterinary Microbiology (M.V.Sc)
//      One mock test per book chapter.
//
// Source layout inside the book (split at "<p><strong>CHAPTER N</strong></p>"):
//   <h1>N.M Multiple Choice Questions</h1>
//   <p><strong>1.</strong>Question text</p>
//   <p>(a) Opt A (b) Opt B (c) Opt C (d) Opt D</p>
//   ... x20 ...
//   <h3>Answer Key</h3>
//   <p>1–(b) 2–(b) … 20–(x)</p>   (single paragraph, en-dash separators)
//   <h1>N.(M+1) Short Answer Questions</h1>
//
// Gating decision (same as scripts/import-vmc502-tests.mjs / import-vmc503.mjs /
// import-vmc504-tests.mjs / import-vmc506-tests.mjs / import-vmc507-tests.mjs):
// MockTest.exam is stored as NULL. "mvsc" is not a valid exam key
// (ALL_EXAM_KEYS = psc/icar-entrance/net/ars), so exam="mvsc" would fail
// access.examKeys.has() for everyone -- including admins -- and lock the tests.
// With exam=null + subjectId set, gating follows the MVSc programme plan
// (slug "mvsc") or the Veterinary Microbiology subject plan.
//
// Usage:
//   node scripts/import-vmc509-tests.mjs --dry-run   # parse + validate, no DB writes
//   node scripts/import-vmc509-tests.mjs             # insert (aborts if already imported)
//   node scripts/import-vmc509-tests.mjs --force     # delete + rebuild

const SRC =
  "D:\\Preparation for Competitive Examinations\\Academic Programmes\\M.V.Sc\\Veterinary Microbiology (M.V.Sc)\\VMC 509 (Techniques in Molecular Microbiology)\\VMC509_Techniques_in_Molecular_Microbiology_Publication_Ready_Final.docx";
const CHAPTER_ID = "cmsr044em0008t8k5xx4fecp3"; // VMC 509 | Techniques in Molecular Microbiology
const SUBJECT_ID = "cmsqtshkn00bcwwk5cqcqk5d0"; // M.V.Sc | Veterinary Microbiology
const TRACK = "veterinary-microbiology-vmc509";

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");

const EXPECTED_CHAPTERS = 12;
const EXPECTED_PER_CHAPTER = 20;

const OPENER_RE = /<p[^>]*>\s*<strong>\s*CHAPTER\s*(\d{1,2})\s*<\/strong>\s*<\/p>/gi;
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

// The practice/test players render question text and options as PLAIN text, so
// <sup>/<sub> cannot be stored as HTML — but stripping them silently corrupts
// science (book Ch4 Q3: "(a) 2n … (c) 2<sup>n</sup>" would collapse both to
// "2n"). Convert to Unicode superscripts/subscripts instead; caret/underscore
// fallback when a character has no Unicode counterpart (e.g. 2^(−ΔΔCq)).
const SUP_MAP = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻", "–": "⁻", "—": "⁻", "−": "⁻", "=": "⁼", "(": "⁽", ")": "⁾",
  "n": "ⁿ", "a": "ᵃ", "b": "ᵇ", "c": "ᶜ", "d": "ᵈ", "e": "ᵉ", "f": "ᶠ", "g": "ᵍ",
  "h": "ʰ", "i": "ⁱ", "j": "ʲ", "k": "ᵏ", "l": "ˡ", "m": "ᵐ", "o": "ᵒ", "p": "ᵖ",
  "r": "ʳ", "s": "ˢ", "t": "ᵗ", "u": "ᵘ", "v": "ᵛ", "w": "ʷ", "x": "ˣ", "y": "ʸ", "z": "ᶻ",
  "A": "ᴬ", "B": "ᴮ", "D": "ᴰ", "E": "ᴱ", "G": "ᴳ", "H": "ᴴ", "I": "ᴵ", "J": "ᴶ",
  "K": "ᴷ", "L": "ᴸ", "M": "ᴹ", "N": "ᴺ", "O": "ᴼ", "P": "ᴾ", "R": "ᴿ", "T": "ᵀ",
  "U": "ᵁ", "V": "ⱽ", "W": "ᵂ",
};
const SUB_MAP = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎",
  "a": "ₐ", "e": "ₑ", "h": "ₕ", "i": "ᵢ", "j": "ⱼ", "k": "ₖ", "l": "ₗ", "m": "ₘ",
  "n": "ₙ", "o": "ₒ", "p": "ₚ", "r": "ᵣ", "s": "ₛ", "t": "ₜ", "u": "ᵤ", "v": "ᵥ", "x": "ₓ",
};
function scriptToUnicode(inner, map, marker) {
  const text = sanitizeHtml(inner, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, "").trim();
  if (!text) return "";
  const chars = [...text];
  if (chars.every((ch) => map[ch])) return chars.map((ch) => map[ch]).join("");
  return `${marker}(${text})`;
}
function convertScripts(html) {
  return html
    .replace(/<sup[^>]*>([\s\S]*?)<\/sup\s*>/gi, (_, inner) => scriptToUnicode(inner, SUP_MAP, "^"))
    .replace(/<sub[^>]*>([\s\S]*?)<\/sub\s*>/gi, (_, inner) => scriptToUnicode(inner, SUB_MAP, "_"));
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
  const txt = decode(plain(convertScripts(optsHtml)));
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

// Book key is a single paragraph "1–(b) 2–(b) …" (en-dash separators).
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
    const text = decode(plain(convertScripts(ps[i]))).replace(/^\s*\d+\s*[.)]\s*/, "");
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

// Same strict splitter as scripts/upload-vmc509-chapters.mjs (the book's many
// in-text "(Chapter N)" cross-references must not split). Last chapter runs to
// the end of the book (no Index back-matter in this book).
function splitChapters(book) {
  const openers = [...book.matchAll(OPENER_RE)].map((m) => ({
    n: Number(m[1]),
    pStart: m.index,
  }));
  const nums = openers.map((o) => o.n);
  const expected = Array.from({ length: EXPECTED_CHAPTERS }, (_, i) => i + 1);
  if (JSON.stringify(nums) !== JSON.stringify(expected)) fail(`chapter openers out of sequence: ${JSON.stringify(nums)}`);
  return openers.map((o, i) => {
    const end = i + 1 < openers.length ? openers[i + 1].pStart : book.length;
    return book.slice(o.pStart, end);
  });
}

async function main() {
  console.log(`\nVMC 509 mock-test / MCQ import${DRY_RUN ? " [DRY RUN]" : ""}`);
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
  if (chapter.courseCode !== "VMC 509") fail(`courseCode mismatch: ${chapter.courseCode}`);
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
            title: `VMC 509 Ch-${nn}: ${c.family} - Mock Test (${c.questions.length} MCQs)`,
            description:
              `VMC 509 Techniques in Molecular Microbiology - Chapter ${c.num} ${c.family}` +
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
    { timeout: 180_000, maxWait: 30_000 }
  );

  console.log(`\nInserted ${mcqCount} ChapterMcq rows (order 0..${mcqCount - 1}).`);
  console.log(`Inserted ${testCount} MockTest rows + ${questionCount} Question rows.`);
  console.log(`\nVerify with: node scripts/verify-vmc509.mjs`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("\nFAILED:", e.message || e);
  process.exit(1);
});
