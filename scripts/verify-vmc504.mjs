import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Read-only verification of the VMC 504 Systematic Veterinary Virology content:
//   - 20 ChapterSection rows (one per book chapter, order 0..19)
//   - 400 ChapterMcq rows (flat practice bank, order 0..399)
//   - 20 MockTest rows + 400 Question rows (one test per book chapter)
// Safe to run any number of times; never writes.
//
// Usage: node scripts/verify-vmc504.mjs

const CHAPTER_ID = "cmsr043670003t8k52qcws78m"; // VMC 504 | Systematic Veterinary Virology
const SUBJECT_ID = "cmsqtshkn00bcwwk5cqcqk5d0"; // M.V.Sc | Veterinary Microbiology
const TRACK = "veterinary-microbiology-vmc504";

let failures = 0;
function check(ok, label, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? "  -- " + detail : ""}`);
  if (!ok) failures++;
}

function parseOptions(raw) {
  try {
    const o = JSON.parse(raw);
    return Array.isArray(o) ? o : null;
  } catch {
    return null;
  }
}

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

  console.log("\n=== VMC 504 CONTENT VERIFICATION (read-only) ===\n");

  const chapter = await prisma.chapter.findUnique({
    where: { id: CHAPTER_ID },
    include: { subject: { include: { programme: true } } },
  });
  check(!!chapter, "Course chapter VMC 504 exists");
  if (!chapter) {
    await prisma.$disconnect();
    process.exit(1);
  }
  check(chapter.courseCode === "VMC 504", "courseCode is 'VMC 504'", chapter.courseCode);
  check(chapter.subjectId === SUBJECT_ID, "subjectId matches Veterinary Microbiology", chapter.subjectId);
  check(
    chapter.subject.programme.name === "M.V.Sc",
    "programme is M.V.Sc",
    `${chapter.subject.programme.name} (slug mvsc)`
  );
  console.log(`      route: /syllabus/mvsc/${SUBJECT_ID}/${CHAPTER_ID}`);

  // ---------- 1) ChapterSections (book chapters) ----------
  console.log("\n--- ChapterSection (book chapters) ---");
  const sections = await prisma.chapterSection.findMany({
    where: { chapterId: CHAPTER_ID },
    orderBy: { order: "asc" },
  });
  check(sections.length === 20, "exactly 20 sections", `found ${sections.length}`);

  const orders = sections.map((s) => s.order);
  check(
    JSON.stringify(orders) === JSON.stringify([...Array(sections.length).keys()]),
    "orders are contiguous 0..19",
    orders.join(",")
  );
  check(
    sections.every((s) => s.title && /^Chapter \d+:/.test(s.title)),
    "all titles match /^Chapter N: .../",
    sections.slice(0, 2).map((s) => s.title).join(" | ") + " ..."
  );
  const shortOnes = sections.filter((s) => s.content.length < 500);
  check(shortOnes.length === 0, "no content shorter than 500 chars", shortOnes.map((s) => s.title).join(", ") || `${sections.length} ok`);

  const imgCount = sections.reduce((n, s) => n + (s.content.match(/<img /g) || []).length, 0);
  const tableCount = sections.reduce((n, s) => n + (s.content.match(/<table/g) || []).length, 0);
  const h2Count = sections.reduce((n, s) => n + (s.content.match(/<h2[ >]/g) || []).length, 0);
  const pendingB64 = sections.reduce((n, s) => n + (s.content.match(/data:image\//g) || []).length, 0);
  const blobUrls = sections.reduce((n, s) => n + (s.content.match(/blob\.vercel-storage\.com/g) || []).length, 0);
  console.log(`      chars=${sections.reduce((s, x) => s + x.content.length, 0)}  h2=${h2Count}  tables=${tableCount}  <img>=${imgCount}`);
  check(blobUrls === imgCount, "every <img> points at Vercel Blob", `blob=${blobUrls} img=${imgCount}`);
  check(pendingB64 === 0, "no leftover base64 data: URIs", `found ${pendingB64}`);
  check(
    sections.every((s) => !s.content.includes("Multiple Choice Questions") && !s.content.includes("Answer Key")),
    "no in-chapter MCQ/Answer-Key blocks (MCQs live only in bank + mock tests, per user decision)"
  );

  for (const s of sections) {
    console.log(`      [${String(s.order).padStart(2, "0")}] ${s.title.padEnd(46)} ${String(s.content.length).padStart(6)} chars`);
  }

  // ---------- 2) ChapterMcq (practice bank) ----------
  console.log("\n--- ChapterMcq (practice bank -> /reader/.../practice) ---");
  const mcqs = await prisma.chapterMcq.findMany({
    where: { chapterId: CHAPTER_ID },
    orderBy: { order: "asc" },
  });
  check(mcqs.length === 400, "exactly 400 MCQs (20 chapters x 20)", `found ${mcqs.length}`);
  check(
    JSON.stringify(mcqs.map((m) => m.order)) === JSON.stringify([...Array(mcqs.length).keys()]),
    "orders are contiguous 0..399"
  );
  let badOpts = 0, badIdx = 0, badText = 0;
  for (const m of mcqs) {
    const o = parseOptions(m.options);
    if (!o || o.length !== 4 || o.some((x) => typeof x !== "string" || !x.trim())) badOpts++;
    if (!Number.isInteger(m.correctIndex) || m.correctIndex < 0 || m.correctIndex > 3) badIdx++;
    if (!m.question || !m.question.trim()) badText++;
  }
  check(badOpts === 0, "all options are 4 non-empty strings", `${badOpts} bad`);
  check(badIdx === 0, "all correctIndex in 0..3", `${badIdx} bad`);
  check(badText === 0, "no empty question text", `${badText} bad`);

  const hist = [0, 0, 0, 0];
  mcqs.forEach((m) => hist[m.correctIndex]++);
  const pct = hist.map((n) => (100 * n / (mcqs.length || 1)).toFixed(1) + "%");
  console.log(`      answer distribution: a=${hist[0]} (${pct[0]})  b=${hist[1]} (${pct[1]})  c=${hist[2]} (${pct[2]})  d=${hist[3]} (${pct[3]})`);

  // practice mode groups by order slices of 20 per book chapter
  const perChapter = {};
  mcqs.forEach((m) => {
    const idx = Math.floor(m.order / 20);
    perChapter[idx] = (perChapter[idx] || 0) + 1;
  });
  const slicesOk = Object.keys(perChapter).length === 20 && Object.values(perChapter).every((n) => n === 20);
  check(slicesOk, "order slices map cleanly to 20 chapters x 20 MCQs", JSON.stringify(perChapter));

  // ---------- 3) MockTest + Question ----------
  console.log("\n--- MockTest / Question (one test per book chapter) ---");
  const tests = await prisma.mockTest.findMany({
    where: { track: TRACK },
    include: { questions: true, subject: true },
    orderBy: { createdAt: "asc" },
  });
  check(tests.length === 20, "exactly 20 mock tests", `found ${tests.length}`);
  check(tests.every((t) => t.exam === null), "exam is null on every test (gating)", `non-null: ${tests.filter((t) => t.exam !== null).length}`);
  check(tests.every((t) => t.subjectId === SUBJECT_ID), "subjectId set on every test");
  check(tests.every((t) => t.kind === "MOCK"), "kind is MOCK");
  check(tests.every((t) => t.isDemo === false), "isDemo false (not open to anonymous users)");
  check(tests.every((t) => t.questions.length === 20), "each test has 20 questions", tests.map((t) => t.questions.length).join(","));

  const totalQ = tests.reduce((n, t) => n + t.questions.length, 0);
  check(totalQ === 400, "total questions = 400", `found ${totalQ}`);

  let badQ = 0;
  for (const t of tests) {
    if (t.duration !== 20 || t.totalMarks !== 20) badQ++;
    for (const q of t.questions) {
      const o = parseOptions(q.options);
      if (!o || o.length !== 4) badQ++;
      if (!Number.isInteger(q.correctAnswer) || q.correctAnswer < 0 || q.correctAnswer > 3) badQ++;
      if (!q.text || !q.text.trim()) badQ++;
    }
  }
  check(badQ === 0, "duration/totalMarks=20 and every question valid", `${badQ} problems`);

  // Gating: mvsc programme plan / subject plan must exist
  const plans = await prisma.plan.findMany({
    where: { slug: { in: ["mvsc", "mvsc-subject-veterinary-microbiology"] } },
    select: { slug: true, name: true, isListed: true, programmeSlug: true, subjectId: true },
  });
  const slugs = new Set(plans.map((p) => p.slug));
  check(slugs.has("mvsc") && slugs.has("mvsc-subject-veterinary-microbiology"),
    "gating plans exist (mvsc + subject plan)",
    plans.map((p) => `${p.slug}${p.isListed ? "" : " (unlisted)"}`).join(", "));

  for (const t of tests) {
    console.log(`      ${t.title.padEnd(62)} exam=${t.exam ?? "null"} q=${t.questions.length} dur=${t.duration}`);
  }

  // ---------- 4) Cross-check MCQ bank vs mock tests ----------
  console.log("\n--- cross-check ---");
  const bankFirst = mcqs.slice(0, 20).map((m) => m.question).join("|");
  const testFirst = tests.length ? tests[0].questions.map((q) => q.text).join("|") : "";
  check(bankFirst === testFirst, "practice bank chapter 1 matches mock test 1 question-for-question");

  console.log(`\n=== ${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"} ===\n`);
  await prisma.$disconnect();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("\nFAILED:", e.message || e);
  process.exit(1);
});
