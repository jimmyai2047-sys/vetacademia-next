import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const CHAPTER_ID = "cmsr042xn0002t8k57r9j7s10";
const SUBJECT_ID = "cmsqtshkn00bcwwk5cqcqk5d0";
const CONTENT_DIR = join(process.cwd(), "content-vmc503");

// Independent answer-key transcription from the book's official key
// (recorded during extraction; re-verified in session summary).
const KEYS = {
  "01": "1,1,1,1,1,1,1,1,0,1,1,0,2,1,1,0,2,2,1,1",
  "02": "1,1,1,2,2,1,2,1,1,1,1,2,0,2,1,1,2,1,1,1",
  "03": "1,1,1,1,1,1,1,1,0,1,2,1,1,1,1,1,0,1,1,2",
  "04": "0,2,1,1,0,2,0,2,2,2,2,1,1,3,1,0,2,1,1,1",
  "05": "1,1,1,1,1,1,0,0,0,1,1,1,0,1,1,1,2,0,2,1",
  "06": "1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1",
  "07": "1,0,2,1,1,1,1,1,1,1,0,1,1,1,2,1,2,2,2,1",
  "08": "1,1,2,1,2,1,1,1,1,1,1,1,2,1,1,1,1,1,1,2",
  "09": "1,2,1,1,0,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1",
  "10": "1,1,1,2,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1",
  "11": "1,1,1,1,1,1,1,1,1,1,0,1,2,1,2,0,1,1,1,1",
  "12": "1,1,1,1,1,1,1,0,1,1,1,1,0,1,1,1,1,1,0,1",
  "13": "1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,1",
  "14": "1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1",
  "15": "1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1",
  "16": "1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1",
  "17": "1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,0,1",
  "18": "1,0,1,1,1,2,1,2,1,1,1,1,0,1,1,1,1,1,0,1",
};

const problems = [];
const check = (cond, msg) => { if (!cond) problems.push(msg); };

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

try {
  const chapter = await prisma.chapter.findUnique({
    where: { id: CHAPTER_ID },
    include: { mcqs: { orderBy: { order: "asc" } }, subject: { include: { programme: true } } },
  });
  check(!!chapter, "chapter not found");
  check(chapter?.courseCode === "VMC 503", `courseCode=${chapter?.courseCode}`);
  check(chapter?.subject.id === SUBJECT_ID, "subject mismatch");

  // --- Chapter MCQs ---
  const mcqs = chapter.mcqs;
  console.log(`Chapter MCQs: ${mcqs.length}`);
  check(mcqs.length === 360, `expected 360 MCQs, got ${mcqs.length}`);
  check(new Set(mcqs.map((m) => m.order)).size === mcqs.length, "duplicate order values");
  check(mcqs[0]?.order === 0 && mcqs[mcqs.length - 1]?.order === 359, "order range not 0..359");

  for (let n = 1; n <= 18; n++) {
    const nn = String(n).padStart(2, "0");
    const bulk = JSON.parse(readFileSync(join(CONTENT_DIR, `chapter-${nn}-mcqs-bulk.json`), "utf8"));
    const slice = mcqs.slice((n - 1) * 20, n * 20);
    check(slice.length === 20, `ch${nn}: slice length ${slice.length}`);
    const keyArr = KEYS[nn].split(",").map(Number);
    slice.forEach((m, i) => {
      const b = bulk[i];
      const at = `ch${nn} q${i + 1}`;
      check(m.question === b.question, `${at}: question differs from file`);
      let opts = [];
      try { opts = JSON.parse(m.options); } catch { problems.push(`${at}: options not parseable JSON`); }
      check(Array.isArray(opts) && opts.length === 4, `${at}: options not a 4-array`);
      check(JSON.stringify(opts) === JSON.stringify(b.options), `${at}: options differ from file`);
      check(m.correctIndex === b.correctIndex, `${at}: correctIndex ${m.correctIndex} != file ${b.correctIndex}`);
      check(m.correctIndex === keyArr[i], `${at}: correctIndex ${m.correctIndex} != book key ${keyArr[i]}`);
      check(m.marks === b.marks, `${at}: marks differ`);
      check(m.difficulty === b.difficulty, `${at}: difficulty differs`);
      check((m.explanation ?? null) === (b.explanation ?? null), `${at}: explanation differs`);
      check(typeof m.question === "string" && m.question.trim().length > 0, `${at}: empty question`);
    });
  }

  // --- Mock tests ---
  const tests = await prisma.mockTest.findMany({
    where: { title: { startsWith: "VMC 503 Ch-" } },
    include: { questions: { orderBy: { createdAt: "asc" } } },
  });
  console.log(`Mock tests: ${tests.length}`);
  check(tests.length === 18, `expected 18 mock tests, got ${tests.length}`);

  for (let n = 1; n <= 18; n++) {
    const nn = String(n).padStart(2, "0");
    const file = JSON.parse(readFileSync(join(CONTENT_DIR, `chapter-${nn}-mocktest.json`), "utf8"));
    const t = tests.find((x) => x.title === file.title);
    if (!t) { problems.push(`ch${nn}: mock test with file title not found in DB`); continue; }
    const at = `ch${nn} test`;
    check(t.duration === file.duration, `${at}: duration`);
    check(t.totalMarks === file.totalMarks, `${at}: totalMarks`);
    check(t.kind === "MOCK", `${at}: kind=${t.kind}`);
    check(t.isAdaptive === false, `${at}: isAdaptive`);
    check(t.isDemo === false, `${at}: isDemo`);
    check(t.subjectId === SUBJECT_ID, `${at}: subjectId=${t.subjectId}`);
    check(t.exam === null, `${at}: exam=${t.exam} (expected null for MVSc gating)`);
    check(t.track === "veterinary-microbiology-vmc503", `${at}: track=${t.track}`);
    check(t.description === file.description, `${at}: description differs`);
    check(t.questions.length === 20, `${at}: ${t.questions.length} questions`);

    const keyArr = KEYS[nn].split(",").map(Number);
    t.questions.forEach((q, i) => {
      const fq = file.questions[i];
      const qa = `${at} q${i + 1}`;
      if (!fq) { problems.push(`${qa}: missing in file`); return; }
      check(q.text === fq.text, `${qa}: text differs`);
      let opts = [];
      try { opts = JSON.parse(q.options); } catch { problems.push(`${qa}: options not parseable`); }
      check(JSON.stringify(opts) === JSON.stringify(fq.options), `${qa}: options differ`);
      check(q.correctAnswer === fq.correctAnswer, `${qa}: correctAnswer differs`);
      check(q.correctAnswer === keyArr[i], `${qa}: correctAnswer ${q.correctAnswer} != book key ${keyArr[i]}`);
      check(q.marks === fq.marks, `${qa}: marks differ`);
      check((q.explanation ?? null) === (fq.explanation ?? null), `${qa}: explanation differs`);
      check(q.options.length > 0, `${qa}: empty options`);
    });
  }

  // Access gating sanity: subject plan exists for Veterinary Microbiology
  const plan = await prisma.plan.findFirst({ where: { subjectId: SUBJECT_ID, programmeSlug: "mvsc" }, select: { slug: true } });
  console.log(`Subject plan: ${plan?.slug ?? "NONE"}`);
  check(!!plan, "no MVSc subject plan gates this subject");

  const mcqCount = await prisma.chapterMcq.count();
  const testCount = await prisma.mockTest.count();
  console.log(`Totals -> ChapterMcq: ${mcqCount} (was 200, expect 560) | MockTest: ${testCount} (was 50, expect 68)`);
  check(mcqCount === 560, `ChapterMcq total ${mcqCount} != 560`);
  check(testCount === 68, `MockTest total ${testCount} != 68`);

  if (problems.length) {
    console.log(`\nFAIL: ${problems.length} problem(s)`);
    problems.slice(0, 50).forEach((p) => console.log("  - " + p));
    process.exitCode = 1;
  } else {
    console.log("\nALL VERIFICATIONS PASS");
  }
} finally {
  await prisma.$disconnect();
}
