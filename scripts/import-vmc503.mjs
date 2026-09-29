import "dotenv/config";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Imports the VMC 503 General Virology deliverables (content-vmc503/) into the DB:
//   1) 18 x 20 ChapterMcq rows -> course chapter VMC 503 (flat bank, order 0..359)
//   2) 18 MockTest rows (20 Questions each) -> subject Veterinary Microbiology (M.V.Sc)
//
// Gating decision: MockTest.exam is stored as NULL (not "mvsc"). "mvsc" is not a
// valid exam key (ALL_EXAM_KEYS = psc/icar-entrance/net/ars), so exam="mvsc" would
// fail access.examKeys.has() for everyone — including admins — and lock the tests.
// With exam=null + subjectId set, gating correctly follows the MVSc programme plan
// (slug "mvsc") or the Veterinary Microbiology subject plan.

const DIR = process.cwd();
const CONTENT_DIR = join(DIR, "content-vmc503");
const CHAPTER_ID = "cmsr042xn0002t8k57r9j7s10"; // VMC 503 | General Virology*
const SUBJECT_ID = "cmsqtshkn00bcwwk5cqcqk5d0"; // M.V.Sc | Veterinary Microbiology
const TRACK = "veterinary-microbiology-vmc503";
const FORCE = process.argv.includes("--force");

const BULK_KEYS = ["correctIndex", "difficulty", "explanation", "marks", "options", "question"];
const MOCK_Q_KEYS = ["correctAnswer", "explanation", "marks", "options", "text"];

function fail(msg) {
  throw new Error(msg);
}

function loadJson(name) {
  const p = join(CONTENT_DIR, name);
  if (!existsSync(p)) fail(`Missing file: ${name}`);
  return JSON.parse(readFileSync(p, "utf8"));
}

function validateBulk(bulk, nn) {
  if (!Array.isArray(bulk) || bulk.length !== 20) fail(`ch${nn}: bulk must have 20 items`);
  bulk.forEach((b, i) => {
    const keys = Object.keys(b).sort().join(",");
    if (keys !== [...BULK_KEYS].sort().join(",")) fail(`ch${nn} q${i + 1}: bad keys ${keys}`);
    if (!Array.isArray(b.options) || b.options.length !== 4) fail(`ch${nn} q${i + 1}: options must be 4`);
    b.options.forEach((o, j) => {
      if (typeof o !== "string" || !o.trim()) fail(`ch${nn} q${i + 1}: option ${j} not a non-empty string`);
    });
    if (!Number.isInteger(b.correctIndex) || b.correctIndex < 0 || b.correctIndex > 3)
      fail(`ch${nn} q${i + 1}: correctIndex out of range`);
    if (!Number.isInteger(b.marks) || b.marks < 1) fail(`ch${nn} q${i + 1}: bad marks`);
    if (!Number.isInteger(b.difficulty) || b.difficulty < 1 || b.difficulty > 3)
      fail(`ch${nn} q${i + 1}: bad difficulty`);
    if (typeof b.question !== "string" || !b.question.trim()) fail(`ch${nn} q${i + 1}: empty question`);
    if (b.explanation != null && typeof b.explanation !== "string")
      fail(`ch${nn} q${i + 1}: explanation not a string`);
  });
}

function validateMock(mock, bulk, nn) {
  const keys = Object.keys(mock).sort().join(",");
  const expected = ["createdFrom", "description", "duration", "exam", "kind", "questions", "title", "totalMarks", "track"].sort().join(",");
  if (keys !== expected) fail(`ch${nn}: bad mocktest keys ${keys}`);
  if (mock.kind !== "MOCK") fail(`ch${nn}: kind must be MOCK`);
  if (mock.duration !== 20 || mock.totalMarks !== 20) fail(`ch${nn}: duration/totalMarks must be 20`);
  if (mock.track !== TRACK) fail(`ch${nn}: track must be ${TRACK}`);
  if (!Array.isArray(mock.questions) || mock.questions.length !== 20) fail(`ch${nn}: mock must have 20 questions`);
  mock.questions.forEach((q, i) => {
    const qk = Object.keys(q).sort().join(",");
    if (qk !== [...MOCK_Q_KEYS].sort().join(",")) fail(`ch${nn} mock q${i + 1}: bad keys ${qk}`);
    if (typeof q.text !== "string" || !q.text.trim()) fail(`ch${nn} mock q${i + 1}: empty text`);
    if (!Array.isArray(q.options) || q.options.length !== 4) fail(`ch${nn} mock q${i + 1}: options must be 4`);
    if (!Number.isInteger(q.correctAnswer) || q.correctAnswer < 0 || q.correctAnswer > 3)
      fail(`ch${nn} mock q${i + 1}: correctAnswer out of range`);
    if (!Number.isInteger(q.marks) || q.marks < 1) fail(`ch${nn} mock q${i + 1}: bad marks`);
    // mock and bulk must describe the identical question
    if (q.text !== bulk[i].question) fail(`ch${nn} q${i + 1}: text != bulk question`);
    if (JSON.stringify(q.options) !== JSON.stringify(bulk[i].options))
      fail(`ch${nn} q${i + 1}: mock options != bulk options`);
    if (q.correctAnswer !== bulk[i].correctIndex) fail(`ch${nn} q${i + 1}: mock answer != bulk correctIndex`);
    if (q.explanation !== bulk[i].explanation) fail(`ch${nn} q${i + 1}: mock explanation != bulk explanation`);
  });
}

async function main() {
  console.log("=== VMC 503 import ===");
  const chapters = [];
  for (let n = 1; n <= 18; n++) {
    const nn = String(n).padStart(2, "0");
    const bulk = loadJson(`chapter-${nn}-mcqs-bulk.json`);
    const mock = loadJson(`chapter-${nn}-mocktest.json`);
    const meta = loadJson(`chapter-${nn}-meta.json`);
    validateBulk(bulk, nn);
    validateMock(mock, bulk, nn);
    if (meta.insertionStatus !== "All 18 chapters inserted") fail(`ch${nn}: meta insertionStatus unexpected`);
    chapters.push({ nn, bulk, mock });
    console.log(`  ch${nn} validated: 20 MCQs + 20-question mock (${mock.title})`);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const chapter = await prisma.chapter.findUnique({ where: { id: CHAPTER_ID } });
    if (!chapter) fail(`Chapter ${CHAPTER_ID} not found`);
    if (chapter.courseCode !== "VMC 503") fail(`Chapter courseCode is ${chapter.courseCode}, expected VMC 503`);
    const subject = await prisma.subject.findUnique({ where: { id: SUBJECT_ID }, include: { programme: true } });
    if (!subject) fail(`Subject ${SUBJECT_ID} not found`);
    if (subject.name !== "Veterinary Microbiology" || subject.programme.name !== "M.V.Sc")
      fail(`Subject mismatch: ${subject.programme.name} / ${subject.name}`);
    console.log(`Target: ${chapter.courseCode} | ${chapter.title}  under  ${subject.programme.name} / ${subject.name}`);

    const existingMcqs = await prisma.chapterMcq.count({ where: { chapterId: CHAPTER_ID } });
    const existingTests = await prisma.mockTest.count({ where: { title: { startsWith: "VMC 503 Ch-" } } });
    console.log(`Existing: ${existingMcqs} chapter MCQs, ${existingTests} VMC 503 mock tests`);
    if ((existingMcqs > 0 || existingTests > 0) && !FORCE)
      fail(`Refusing to overwrite existing data (found ${existingMcqs} MCQs / ${existingTests} tests). Re-run with --force to replace.`);

    // 1) Chapter MCQ bank: 360 rows, order 0..359 grouped by chapter.
    let order = 0;
    const rows = [];
    for (const c of chapters) {
      for (const b of c.bulk) {
        rows.push({
          chapterId: CHAPTER_ID,
          question: b.question.trim(),
          options: JSON.stringify(b.options),
          correctIndex: b.correctIndex,
          marks: b.marks,
          explanation: b.explanation || null,
          difficulty: b.difficulty,
          order: order++,
        });
      }
    }
    if (rows.length !== 360) fail(`Expected 360 MCQ rows, built ${rows.length}`);

    // Single transaction: replace (if --force) + insert everything atomically.
    const result = await prisma.$transaction(
      async (tx) => {
      if (FORCE) {
        const delTests = await tx.mockTest.deleteMany({ where: { title: { startsWith: "VMC 503 Ch-" } } });
        const delMcqs = await tx.chapterMcq.deleteMany({ where: { chapterId: CHAPTER_ID } });
        console.log(`--force: deleted ${delTests.count} mock tests and ${delMcqs.count} MCQs`);
      }
      await tx.chapterMcq.createMany({ data: rows });

      // 2) Mock tests: one per book chapter, exam=null + subjectId for MVSc gating.
      const created = [];
      for (const c of chapters) {
        const m = c.mock;
        const test = await tx.mockTest.create({
          data: {
            title: m.title,
            description: m.description || null,
            duration: m.duration,
            totalMarks: m.totalMarks,
            subjectId: SUBJECT_ID,
            exam: null,
            track: TRACK,
            kind: "MOCK",
            isAdaptive: false,
            isDemo: false,
          },
        });
        await tx.question.createMany({
          data: m.questions.map((q, i) => ({
            mockTestId: test.id,
            text: q.text,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
            marks: q.marks,
            explanation: q.explanation || null,
            difficulty: c.bulk[i].difficulty,
          })),
        });
        const qCount = await tx.question.count({ where: { mockTestId: test.id } });
        if (qCount !== 20) fail(`ch${c.nn}: created test has ${qCount} questions`);
        created.push(test);
      }
      return created;
      },
      { maxWait: 15000, timeout: 120000 }
    );

    console.log(`Inserted ${rows.length} ChapterMcq rows (order 0..${rows.length - 1})`);
    result.forEach((t, i) => console.log(`  [${i + 1}/18] ${t.id}  ${t.title}`));
    console.log(`\nDone: 360 MCQs + ${result.length} mock tests.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("\nIMPORT FAILED:", e.message);
  process.exit(1);
});
