import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Read-only verification of the VMC 506 Veterinary Mycology content:
//   - 15 ChapterSection rows (one per book chapter, order 0..14)
//   - 300 ChapterMcq rows (flat practice bank, order 0..299)
//   - 15 MockTest rows + 300 Question rows (one test per book chapter)
// Safe to run any number of times; never writes.
//
// Usage: node scripts/verify-vmc506.mjs

const CHAPTER_ID = "cmsr043o10005t8k5ani3vfap"; // VMC 506 | Veterinary Mycology
const SUBJECT_ID = "cmsqtshkn00bcwwk5cqcqk5d0"; // M.V.Sc | Veterinary Microbiology
const TRACK = "veterinary-microbiology-vmc506";

const N_CHAPTERS = 15;
const PER_CHAPTER = 20;
const N_MCQ = N_CHAPTERS * PER_CHAPTER;

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

  console.log("\n=== VMC 506 CONTENT VERIFICATION (read-only) ===\n");

  const chapter = await prisma.chapter.findUnique({
    where: { id: CHAPTER_ID },
    include: { subject: { include: { programme: true } } },
  });
  check(!!chapter, "Course chapter VMC 506 exists");
  if (!chapter) {
    await prisma.$disconnect();
    process.exit(1);
  }
  check(chapter.courseCode === "VMC 506", "courseCode is 'VMC 506'", chapter.courseCode);
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
  check(sections.length === N_CHAPTERS, `exactly ${N_CHAPTERS} sections`, `found ${sections.length}`);

  const orders = sections.map((s) => s.order);
  check(
    JSON.stringify(orders) === JSON.stringify([...Array(sections.length).keys()]),
    `orders are contiguous 0..${N_CHAPTERS - 1}`,
    orders.join(",")
  );
  check(
    sections.every((s) => s.title && /^Chapter \d+:/.test(s.title)),
    "all titles match /^Chapter N: .../",
    sections.slice(0, 2).map((s) => s.title).join(" | ") + " ..."
  );
  const seqBad = sections.filter((s, i) => Number((s.title.match(/^Chapter (\d+):/) || [])[1]) !== i + 1);
  check(seqBad.length === 0, "chapter numbers are sequential 1..15", seqBad.map((s) => s.title).join(", ") || "all sequential");

  const shortOnes = sections.filter((s) => s.content.length < 500);
  check(shortOnes.length === 0, "no content shorter than 500 chars", shortOnes.map((s) => s.title).join(", ") || `${sections.length} ok`);

  const imgCount = sections.reduce((n, s) => n + (s.content.match(/<img /g) || []).length, 0);
  const tableCount = sections.reduce((n, s) => n + (s.content.match(/<table/g) || []).length, 0);
  const h2Count = sections.reduce((n, s) => n + (s.content.match(/<h2[ >]/g) || []).length, 0);
  const h1Count = sections.reduce((n, s) => n + (s.content.match(/<h1[ >]/g) || []).length, 0);
  const pendingB64 = sections.reduce((n, s) => n + (s.content.match(/data:image\//g) || []).length, 0);
  const blobUrls = sections.reduce((n, s) => n + (s.content.match(/blob\.vercel-storage\.com/g) || []).length, 0);
  console.log(`      chars=${sections.reduce((s, x) => s + x.content.length, 0)}  h2=${h2Count}  tables=${tableCount}  <img>=${imgCount}`);
  check(h1Count === 0, "no leftover <h1> (reader renders the section title as h1)", `found ${h1Count}`);
  check(blobUrls === imgCount, "every <img> points at Vercel Blob", `blob=${blobUrls} img=${imgCount}`);
  check(pendingB64 === 0, "no leftover base64 data: URIs", `found ${pendingB64}`);
  check(
    sections.every((s) => !s.content.includes("Multiple Choice Questions") && !s.content.includes("Answer Key")),
    "no in-chapter MCQ/Answer-Key blocks (MCQs live only in bank + mock tests, per user decision)"
  );

  for (const s of sections) {
    console.log(`      [${String(s.order).padStart(2, "0")}] ${s.title.padEnd(64)} ${String(s.content.length).padStart(6)} chars`);
  }

  // ---------- 2) ChapterMcq (practice bank) ----------
  console.log("\n--- ChapterMcq (practice bank -> /reader/.../practice) ---");
  const mcqs = await prisma.chapterMcq.findMany({
    where: { chapterId: CHAPTER_ID },
    orderBy: { order: "asc" },
  });
  check(mcqs.length === N_MCQ, `exactly ${N_MCQ} MCQs (${N_CHAPTERS} chapters x ${PER_CHAPTER})`, `found ${mcqs.length}`);
  check(
    JSON.stringify(mcqs.map((m) => m.order)) === JSON.stringify([...Array(mcqs.length).keys()]),
    `orders are contiguous 0..${N_MCQ - 1}`
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

  // practice mode groups by order slices of PER_CHAPTER per book chapter
  const perChapter = {};
  mcqs.forEach((m) => {
    const idx = Math.floor(m.order / PER_CHAPTER);
    perChapter[idx] = (perChapter[idx] || 0) + 1;
  });
  const slicesOk =
    Object.keys(perChapter).length === N_CHAPTERS &&
    Object.values(perChapter).every((n) => n === PER_CHAPTER);
  check(slicesOk, `order slices map cleanly to ${N_CHAPTERS} chapters x ${PER_CHAPTER} MCQs`, JSON.stringify(perChapter));

  // ---------- 3) MockTest + Question ----------
  console.log("\n--- MockTest / Question (one test per book chapter) ---");
  const tests = await prisma.mockTest.findMany({
    where: { track: TRACK },
    include: { questions: true, subject: true },
    orderBy: { createdAt: "asc" },
  });
  check(tests.length === N_CHAPTERS, `exactly ${N_CHAPTERS} mock tests`, `found ${tests.length}`);
  check(tests.every((t) => t.exam === null), "exam is null on every test (gating)", `non-null: ${tests.filter((t) => t.exam !== null).length}`);
  check(tests.every((t) => t.subjectId === SUBJECT_ID), "subjectId set on every test");
  check(tests.every((t) => t.kind === "MOCK"), "kind is MOCK");
  check(tests.every((t) => t.isDemo === false), "isDemo false (not open to anonymous users)");
  check(
    tests.every((t) => t.questions.length === PER_CHAPTER),
    `each test has ${PER_CHAPTER} questions`,
    tests.map((t) => t.questions.length).join(",")
  );

  const totalQ = tests.reduce((n, t) => n + t.questions.length, 0);
  check(totalQ === N_MCQ, `total questions = ${N_MCQ}`, `found ${totalQ}`);

  let badQ = 0;
  for (const t of tests) {
    if (t.duration !== PER_CHAPTER || t.totalMarks !== PER_CHAPTER) badQ++;
    for (const q of t.questions) {
      const o = parseOptions(q.options);
      if (!o || o.length !== 4) badQ++;
      if (!Number.isInteger(q.correctAnswer) || q.correctAnswer < 0 || q.correctAnswer > 3) badQ++;
      if (!q.text || !q.text.trim()) badQ++;
    }
  }
  check(badQ === 0, `duration/totalMarks=${PER_CHAPTER} and every question valid`, `${badQ} problems`);

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
    console.log(`      ${t.title.padEnd(74)} exam=${t.exam ?? "null"} q=${t.questions.length} dur=${t.duration}`);
  }

  // ---------- 4) Cross-check MCQ bank vs mock tests ----------
  console.log("\n--- cross-check ---");
  const bankFirst = mcqs.slice(0, PER_CHAPTER).map((m) => m.question).join("|");
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
