import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Deep QA (read-only) for the VMC 504 book-chapter + mock-test structure.
// Goes beyond verify-vmc504.mjs: HTML integrity, image reachability,
// MCQ hygiene, and a FULL 20-chapter practice-bank vs mock-test cross-check.
//
// Usage: node scripts/qa-vmc504-deep.mjs   (exit 1 on any FAIL)

const CHAPTER_ID = "cmsr043670003t8k52qcws78m";
const SUBJECT_ID = "cmsqtshkn00bcwwk5cqcqk5d0";
const TRACK = "veterinary-microbiology-vmc504";

let failures = 0;
let warnings = 0;
function check(ok, label, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? "  -- " + detail : ""}`);
  if (!ok) failures++;
}
function warn(label, detail = "") {
  warnings++;
  console.log(`WARN  ${label}${detail ? "  -- " + detail : ""}`);
}

function countOpen(html, tag) {
  const open = (html.match(new RegExp(`<${tag}(?=[\\s>])`, "gi")) || []).length;
  const close = (html.match(new RegExp(`</${tag}>`, "gi")) || []).length;
  return { open, close };
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
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  // ============ A. ChapterSection HTML ============
  console.log("\n=== A. Chapter HTML integrity ===");
  const sections = await prisma.chapterSection.findMany({
    where: { chapterId: CHAPTER_ID },
    orderBy: { order: "asc" },
  });
  check(sections.length === 20, "20 sections", `found ${sections.length}`);

  // In-chapter MCQ + Answer Key were removed by user decision (mock test at the
  // end of each chapter is the single home for MCQs) — they must be ABSENT.
  const REQUIRED = [
    "Short Answer Questions",
    "Long Answer Questions",
    "Summary",
    "Glossary",
    "Suggested Readings",
  ];
  const FORBIDDEN = ["Multiple Choice Questions", "Answer Key"];
  const TAGS = ["table", "thead", "tbody", "tr", "td", "th", "ul", "ol", "li", "h2", "h3", "h4", "p"];
  const ARTIFACTS = ["data:image/", "HYPERLINK", "mso-", "MERGEFORMAT", "PAGEREF", " TOC ", "\\o("];
  let allImgs = [];
  const missingBlocks = [];
  const forbiddenPresent = [];
  const unbalanced = [];
  const artifacts = [];
  let minLen = Infinity;
  let maxLen = 0;
  for (const s of sections) {
    minLen = Math.min(minLen, s.content.length);
    maxLen = Math.max(maxLen, s.content.length);
    for (const b of REQUIRED) {
      if (!s.content.toLowerCase().includes(b.toLowerCase())) missingBlocks.push(`${s.title} lacks "${b}"`);
    }
    for (const b of FORBIDDEN) {
      if (s.content.includes(b)) forbiddenPresent.push(`${s.title} still contains "${b}"`);
    }
    for (const t of TAGS) {
      const { open, close } = countOpen(s.content, t);
      if (open !== close) unbalanced.push(`${s.title} <${t}> ${open} vs </${t}> ${close}`);
    }
    for (const a of ARTIFACTS) {
      if (s.content.includes(a)) artifacts.push(`${s.title} contains "${a.trim()}"`);
    }
    for (const m of s.content.matchAll(/<img\b[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi)) allImgs.push(m[1]);
  }
  check(minLen > 5000, "all chapters substantial", `min=${minLen} max=${maxLen}`);
  check(missingBlocks.length === 0, "all chapters keep Short/Long/Summary/Glossary/Readings", missingBlocks.slice(0, 5).join(" | ") || "all present");
  check(forbiddenPresent.length === 0, "no in-chapter MCQ/Answer-Key blocks (user decision)", forbiddenPresent.slice(0, 5).join(" | ") || "all stripped");
  check(unbalanced.length === 0, "balanced tags (table/tr/td/ul/li/h2-h4/p)", unbalanced.slice(0, 5).join(" | ") || "all balanced");
  check(artifacts.length === 0, "no conversion artifacts (base64/HYPERLINK/mso-/field codes)", artifacts.slice(0, 5).join(" | ") || "clean");

  // ============ B. Images reachable ============
  console.log("\n=== B. Figure reachability (HEAD) ===");
  const uniqImgs = [...new Set(allImgs)];
  check(uniqImgs.length === 30, "30 unique figure URLs", `found ${uniqImgs.length}`);
  const nonBlob = uniqImgs.filter((u) => !u.includes("blob.vercel-storage.com"));
  check(nonBlob.length === 0, "all figures on Vercel Blob", nonBlob.slice(0, 3).join(", ") || "all blob");
  const dead = [];
  const priv = [];
  for (const u of uniqImgs) {
    try {
      const r = await fetch(u, { method: "HEAD", signal: AbortSignal.timeout(20000) });
      if (r.status === 200) continue;
      else if (r.status === 403) priv.push(u);
      else dead.push(`${r.status} ${u.slice(0, 80)}`);
    } catch (e) {
      dead.push(`ERR ${String(e).slice(0, 60)} ${u.slice(0, 80)}`);
    }
  }
  check(dead.length === 0, "no dead figures (200 ok, 403 = private-but-present)", dead.slice(0, 5).join(" | ") || `${uniqImgs.length - priv.length} public + ${priv.length} private`);
  if (priv.length) warn("private blob figures (expected — app re-signs at render)", `${priv.length}`);

  // ============ C. ChapterMcq hygiene ============
  console.log("\n=== C. MCQ hygiene (400) ===");
  const mcqs = await prisma.chapterMcq.findMany({
    where: { chapterId: CHAPTER_ID },
    orderBy: { order: "asc" },
  });
  check(mcqs.length === 400, "400 MCQs", `found ${mcqs.length}`);
  const bad = { opts: 0, dup: 0, html: 0, ent: 0, len: 0, idx: 0 };
  const seenPerSlice = Array.from({ length: 20 }, () => new Set());
  const dist = [0, 0, 0, 0];
  mcqs.forEach((m, i) => {
    const slice = Math.floor(i / 20);
    const o = parseOptions(m.options);
    if (!o || o.length !== 4 || o.some((x) => typeof x !== "string" || !x.trim())) bad.opts++;
    else if (new Set(o.map((x) => x.trim().toLowerCase())).size !== 4) bad.dup++;
    if (/<[a-z][^>]*>/i.test(m.question)) bad.html++;
    if (/&(amp|lt|gt|quot|#\d+);/.test(m.question) || (o || []).some((x) => /&(amp|lt|gt|quot|#\d+);/.test(x))) bad.ent++;
    if (!m.question || m.question.trim().length < 10 || m.question.length > 600) bad.len++;
    if (!(m.correctIndex >= 0 && m.correctIndex <= 3)) bad.idx++;
    else dist[m.correctIndex]++;
    const key = m.question.trim().toLowerCase();
    if (seenPerSlice[slice].has(key)) bad.dup++;
    seenPerSlice[slice].add(key);
  });
  check(bad.opts === 0, "all options valid (4 non-empty strings)", `${bad.opts} bad`);
  check(bad.dup === 0, "options distinct + no duplicate questions within a chapter", `${bad.dup} bad`);
  check(bad.html === 0, "no HTML tags leaking into question text", `${bad.html} bad`);
  check(bad.ent === 0, "no HTML entities leaking (&amp; etc.)", `${bad.ent} bad`);
  check(bad.len === 0, "question length sane (10..600 chars)", `${bad.len} bad`);
  check(bad.idx === 0, "all correctIndex in 0..3", `${bad.idx} bad`);
  console.log(`      answer distribution: a=${dist[0]} b=${dist[1]} c=${dist[2]} d=${dist[3]} (book-faithful, ship as-is per user)`);

  // ============ D. Full 20-chapter cross-check ============
  console.log("\n=== D. Practice bank vs mock tests (all 20 chapters) ===");
  const tests = await prisma.mockTest.findMany({
    where: { track: TRACK },
    orderBy: { title: "asc" },
    // App renders questions with orderBy createdAt asc (see mock-tests/[id]/page.tsx),
    // so the QA must compare in exactly that order too.
    include: { questions: { orderBy: { createdAt: "asc" } } },
  });
  check(tests.length === 20, "20 mock tests on track", `found ${tests.length}`);
  const titleBad = tests.filter((t) => !/^VMC 504 Ch-\d{2}: .+ - Mock Test \(20 MCQs\)$/.test(t.title));
  check(titleBad.length === 0, "all titles match convention", titleBad.map((t) => t.title).join(" | ") || "all match");
  const metaBad = tests.filter(
    (t) => t.exam !== null || t.subjectId !== SUBJECT_ID || t.kind !== "MOCK" || t.isDemo !== false || t.duration !== 20 || t.totalMarks !== 20 || t.questions.length !== 20
  );
  check(metaBad.length === 0, "all meta correct (exam=null, subject, MOCK, non-demo, 20min/20marks/20Qs)", metaBad.map((t) => t.title).join(" | ") || "all correct");
  const orderBad = [];
  tests.forEach((t) => {
    if (t.questions.length !== 20) orderBad.push(`${t.title} (n=${t.questions.length})`);
    const stamps = new Set(t.questions.map((q) => q.createdAt.getTime()));
    if (stamps.size !== t.questions.length)
      warn("identical createdAt stamps inside a test (display order relies on insertion order)", `${t.title}: ${stamps.size}/${t.questions.length} distinct`);
    const marksSum = t.questions.reduce((n, q) => n + (q.marks || 0), 0);
    if (marksSum !== t.totalMarks) orderBad.push(`${t.title} (marks sum ${marksSum} != ${t.totalMarks})`);
  });
  check(orderBad.length === 0, "20 questions per test and marks sum == totalMarks", orderBad.join(" | ") || "all correct");

  let mism = 0;
  const mismDetail = [];
  tests.forEach((t, i) => {
    const slice = mcqs.slice(i * 20, i * 20 + 20);
    t.questions.forEach((q, j) => {
      const m = slice[j];
      const qo = parseOptions(q.options);
      const mo = parseOptions(m.options);
      if (
        !m ||
        q.text.trim() !== m.question.trim() ||
        JSON.stringify(qo) !== JSON.stringify(mo) ||
        q.correctAnswer !== m.correctIndex
      ) {
        mism++;
        if (mismDetail.length < 5) mismDetail.push(`ch${i + 1} q${j + 1}`);
      }
    });
  });
  check(mism === 0, "all 400 mock questions identical to practice bank (text+options+key)", mismDetail.join(", ") || "400/400 identical");

  // ============ E. Mapping (independent re-implementation) ============
  console.log("\n=== E. Chapter <-> mock test mapping ===");
  const secNo = (s) => {
    const m = s.match(/^\s*chapter\s*[-–—]?\s*0*(\d+)/i);
    return m ? Number(m[1]) : null;
  };
  const testNo = (s) => {
    const m = s.match(/\bch\s*[-–—]?\s*0*(\d+)/i);
    return m ? Number(m[1]) : null;
  };
  const mapFails = [];
  sections.forEach((s, i) => {
    const n = secNo(s.title);
    const t = tests.find((x) => testNo(x.title) === n);
    if (n !== i + 1) mapFails.push(`${s.title}: parsed as ch${n}`);
    if (!t) mapFails.push(`${s.title}: no test found`);
  });
  check(mapFails.length === 0, "20/20 sections map 1:1 to tests by chapter number", mapFails.slice(0, 5).join(" | ") || "20/20");

  console.log(`\n=== RESULT: ${failures === 0 ? "ALL DEEP CHECKS PASSED" : failures + " FAILURES"} (${warnings} warnings) ===`);
  await prisma.$disconnect();
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(2);
});
