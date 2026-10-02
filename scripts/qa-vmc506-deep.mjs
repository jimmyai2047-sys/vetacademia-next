import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Deep QA (read-only) for the VMC 506 book-chapter + mock-test structure.
// Goes beyond verify-vmc506.mjs: HTML integrity, image reachability,
// MCQ hygiene, and a FULL 15-chapter practice-bank vs mock-test cross-check.
//
// Usage: node scripts/qa-vmc506-deep.mjs   (exit 1 on any FAIL)

const CHAPTER_ID = "cmsr043o10005t8k5ani3vfap";
const SUBJECT_ID = "cmsqtshkn00bcwwk5cqcqk5d0";
const TRACK = "veterinary-microbiology-vmc506";

const N_CHAPTERS = 15;
const PER_CHAPTER = 20;
const N_MCQ = N_CHAPTERS * PER_CHAPTER;

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
  check(sections.length === N_CHAPTERS, `${N_CHAPTERS} sections`, `found ${sections.length}`);

  // In-chapter MCQ + Answer Key were removed by user decision (mock test at the
  // end of each chapter is the single home for MCQs) — they must be ABSENT.
  // The book gives the Glossary section to chapters 1-4 only (ch. 5 has
  // "Glossary of Mycological Terms" as a content heading, ch. 6+ have none).
  const REQUIRED = [
    "Short Answer Questions",
    "Long Answer Questions",
    "Summary",
    "Suggested Readings",
  ];
  const FORBIDDEN = ["Multiple Choice Questions", "Answer Key"];
  const TAGS = ["table", "thead", "tbody", "tr", "td", "th", "ul", "ol", "li", "h1", "h2", "h3", "h4", "p"];
  const ARTIFACTS = ["data:image/", "HYPERLINK", "mso-", "MERGEFORMAT", "PAGEREF", " TOC ", "\\o("];
  let allImgs = [];
  const missingBlocks = [];
  const forbiddenPresent = [];
  const unbalanced = [];
  const artifacts = [];
  const editorialNotes = [];
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
    if (/Revision Note|verification note|Editorial Revision/i.test(s.content)) {
      editorialNotes.push(s.title);
    }
    for (const m of s.content.matchAll(/<img\b[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi)) allImgs.push(m[1]);
  }
  check(minLen > 5000, "all chapters substantial", `min=${minLen} max=${maxLen}`);
  check(missingBlocks.length === 0, "all chapters keep Short/Long/Summary/Readings", missingBlocks.slice(0, 5).join(" | ") || "all present");
  // Glossary: book-consistent (chapters 1-4 only).
  const glossaryMissing = sections
    .filter((s) => Number((s.title.match(/^Chapter (\d+):/) || [])[1]) <= 4 && !/Glossary/i.test(s.content))
    .map((s) => s.title);
  check(glossaryMissing.length === 0, "chapters 1-4 keep their Glossary section", glossaryMissing.join(" | ") || "all present");
  check(forbiddenPresent.length === 0, "no in-chapter MCQ/Answer-Key blocks (user decision)", forbiddenPresent.slice(0, 5).join(" | ") || "all stripped");
  check(unbalanced.length === 0, "balanced tags (table/tr/td/ul/li/h1-h4/p)", unbalanced.slice(0, 5).join(" | ") || "all balanced");
  check(artifacts.length === 0, "no conversion artifacts (base64/HYPERLINK/mso-/field codes)", artifacts.slice(0, 5).join(" | ") || "clean");
  if (editorialNotes.length)
    warn(
      "manuscript-internal editorial notes present in chapter body (see report)",
      `${editorialNotes.length}: ${editorialNotes.join(", ")}`
    );

  // ============ B. Images reachable ============
  console.log("\n=== B. Figure reachability (HEAD) ===");
  const uniqImgs = [...new Set(allImgs)];
  check(uniqImgs.length > 0, "figures referenced", `${uniqImgs.length} unique URL(s)`);
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
  console.log(`\n=== C. MCQ hygiene (${N_MCQ}) ===`);
  const mcqs = await prisma.chapterMcq.findMany({
    where: { chapterId: CHAPTER_ID },
    orderBy: { order: "asc" },
  });
  check(mcqs.length === N_MCQ, `${N_MCQ} MCQs`, `found ${mcqs.length}`);
  const bad = { opts: 0, dup: 0, html: 0, ent: 0, len: 0, idx: 0 };
  const seenPerSlice = Array.from({ length: N_CHAPTERS }, () => new Set());
  const dist = [0, 0, 0, 0];
  mcqs.forEach((m, i) => {
    const slice = Math.floor(i / PER_CHAPTER);
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

  // ============ D. Full 15-chapter cross-check ============
  console.log(`\n=== D. Practice bank vs mock tests (all ${N_CHAPTERS} chapters) ===`);
  const tests = await prisma.mockTest.findMany({
    where: { track: TRACK },
    orderBy: { title: "asc" },
    // App renders questions with orderBy createdAt asc (see mock-tests/[id]/page.tsx),
    // so the QA must compare in exactly that order too.
    include: { questions: { orderBy: { createdAt: "asc" } } },
  });
  check(tests.length === N_CHAPTERS, `${N_CHAPTERS} mock tests on track`, `found ${tests.length}`);
  const titleBad = tests.filter((t) => !/^VMC 506 Ch-\d{2}: .+ - Mock Test \(20 MCQs\)$/.test(t.title));
  check(titleBad.length === 0, "all titles match convention", titleBad.map((t) => t.title).join(" | ") || "all match");
  const metaBad = tests.filter(
    (t) => t.exam !== null || t.subjectId !== SUBJECT_ID || t.kind !== "MOCK" || t.isDemo !== false || t.duration !== PER_CHAPTER || t.totalMarks !== PER_CHAPTER || t.questions.length !== PER_CHAPTER
  );
  check(metaBad.length === 0, `all meta correct (exam=null, subject, MOCK, non-demo, ${PER_CHAPTER}min/${PER_CHAPTER}marks/${PER_CHAPTER}Qs)`, metaBad.map((t) => t.title).join(" | ") || "all correct");
  const orderBad = [];
  tests.forEach((t) => {
    if (t.questions.length !== PER_CHAPTER) orderBad.push(`${t.title} (n=${t.questions.length})`);
    const stamps = new Set(t.questions.map((q) => q.createdAt.getTime()));
    if (stamps.size !== t.questions.length)
      warn("identical createdAt stamps inside a test (display order relies on insertion order)", `${t.title}: ${stamps.size}/${t.questions.length} distinct`);
    const marksSum = t.questions.reduce((n, q) => n + (q.marks || 0), 0);
    if (marksSum !== t.totalMarks) orderBad.push(`${t.title} (marks sum ${marksSum} != ${t.totalMarks})`);
  });
  check(orderBad.length === 0, `${PER_CHAPTER} questions per test and marks sum == totalMarks`, orderBad.join(" | ") || "all correct");

  let mism = 0;
  const mismDetail = [];
  tests.forEach((t, i) => {
    const slice = mcqs.slice(i * PER_CHAPTER, i * PER_CHAPTER + PER_CHAPTER);
    t.questions.forEach((q, j) => {
      const m = slice[j];
      const qo = parseOptions(q.options);
      const mo = parseOptions(m && m.options);
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
  check(mism === 0, `all ${N_MCQ} mock questions identical to practice bank (text+options+key)`, mismDetail.join(", ") || `${N_MCQ}/${N_MCQ} identical`);

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
  check(mapFails.length === 0, `${N_CHAPTERS}/${N_CHAPTERS} sections map 1:1 to tests by chapter number`, mapFails.slice(0, 5).join(" | ") || `${N_CHAPTERS}/${N_CHAPTERS}`);

  // ============ F. Content hygiene (text-level bugs) ============
  console.log("\n=== F. Content hygiene ===");
  const hy = {
    dblEnt: [], mojibake: [], ctrl: [], placeholder: [], emptyP: [],
    tableCols: [], noAlt: [], headPunct: [], dblWord: [],
  };
  for (const s of sections) {
    const t = s.content;
    if (/&amp;(lt|gt|quot|amp|#)/i.test(t)) hy.dblEnt.push(s.title);
    if (/â€|Ã[ -ÿ]|â€™|â€œ|â€\x9d|\ufffd/.test(t)) hy.mojibake.push(s.title);
    if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(t)) hy.ctrl.push(s.title);
    if (/\b(TODO|TBD|FIXME|Lorem ipsum|\{\{|\[object Object\]|undefined\s+is not)\b/i.test(t)) hy.placeholder.push(s.title);
    const empties = (t.match(/<p[^>]*>\s*(?:<br\s*\/?>)?\s*<\/p>/gi) || []).length;
    if (empties) hy.emptyP.push(`${s.title} x${empties}`);
    // tables: every row should match the header/first row's cell count
    for (const tbl of t.matchAll(/<table[\s\S]*?<\/table>/gi)) {
      const rows = [...tbl[0].matchAll(/<tr[\s\S]*?<\/tr>/gi)];
      if (rows.length < 2) continue;
      const widths = rows.map((r) => (r[0].match(/<t[dh][\s>]/gi) || []).length);
      const ref = widths[0];
      const badRows = widths.filter((w) => w !== ref).length;
      if (badRows) hy.tableCols.push(`${s.title}: ${badRows}/${widths.length} rows differ from first row (${ref})`);
    }
    if (/<img(?![^>]*\salt=)/i.test(t)) hy.noAlt.push(s.title);
    for (const h of t.matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi)) {
      const txt = h[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (!txt || /[:;,.]$/.test(txt)) hy.headPunct.push(`${s.title}: "${txt.slice(0, 60)}"`);
    }
    const words = t.replace(/<[^>]+>/g, " ");
    for (const m of words.matchAll(/\b([A-Za-z]{3,})\s+\1\b/gi)) hy.dblWord.push(`${s.title}: "${m[0]}"`);
  }
  check(hy.dblEnt.length === 0, "no double-encoded entities", hy.dblEnt.slice(0, 3).join(" | ") || "clean");
  check(hy.mojibake.length === 0, "no mojibake / replacement chars", hy.mojibake.slice(0, 3).join(" | ") || "clean");
  check(hy.ctrl.length === 0, "no control characters", hy.ctrl.slice(0, 3).join(" | ") || "clean");
  check(hy.placeholder.length === 0, "no placeholder text (TODO/FIXME/{{/undefined)", hy.placeholder.slice(0, 3).join(" | ") || "clean");
  check(hy.emptyP.length === 0, "no empty paragraphs", hy.emptyP.slice(0, 3).join(" | ") || "none");
  const nTables = sections.reduce((n, s) => n + (s.content.match(/<table/gi) || []).length, 0);
  check(hy.tableCols.length === 0, "every table row matches its column count", hy.tableCols.slice(0, 3).join(" | ") || `${nTables} tables consistent`);
  if (hy.noAlt.length) warn("some <img> lack alt text", `${hy.noAlt.length} chapter(s)`);
  if (hy.headPunct.length) warn("headings that are empty or end with punctuation", hy.headPunct.slice(0, 4).join(" | "));
  if (hy.dblWord.length) warn("repeated adjacent words (review wording)", `${hy.dblWord.length}: ${hy.dblWord.slice(0, 6).join(" | ")}`);

  console.log(`\n=== RESULT: ${failures === 0 ? "ALL DEEP CHECKS PASSED" : failures + " FAILURES"} (${warnings} warnings) ===`);
  await prisma.$disconnect();
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(2);
});
