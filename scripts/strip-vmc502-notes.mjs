import "dotenv/config";
import fs from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Removes the trailing manuscript-internal editorial/revision note block from
// each of the 21 VMC 502 chapter HTMLs (user decision: the notes are
// author/editor process metadata — they appear in neither the publication
// Complete Book nor the shipped VMC 504 course).
//
// The note is always the LAST block of the body, in one of two shapes:
//   a) <p>Editorial note / Final revision note / Final verification note …</p>
//      (sometimes wrapped as <p><em>…</em></p>)
//   b) <h2>Editorial Revision Note | Final Manuscript Revision Note</h2>
//      followed by its own paragraphs
//
// Guards per chapter (any failure = SKIP, no write):
//   - exactly one candidate block whose tail (block → end of body) is short,
//     is free of the required structural sections, and starts with the marker
//   - the kept prefix still contains every required structural section
//   - the kept prefix has balanced tags
//
// Usage: node scripts/strip-vmc502-notes.mjs --dry-run   # preview, no writes
//        node scripts/strip-vmc502-notes.mjs             # apply + re-verify

const CHAPTER_ID = "cmsr042ns0001t8k5px3qs2ap";
const N_CHAPTERS = 21;
const DRY_RUN = process.argv.includes("--dry-run");
const BACKUP = `C:\\Users\\dell\\AppData\\Local\\Temp\\opencode\\vmc502-sections-backup-${Date.now()}.json`;

const REQUIRED = [
  "Short Answer Questions",
  "Long Answer Questions",
  "Summary",
  "Glossary",
  "Suggested Readings",
];
const TAGS = ["table", "thead", "tbody", "tr", "td", "th", "ul", "ol", "li", "h1", "h2", "h3", "h4", "p"];

const NOTE_START =
  /^(?:editorial\s+note|final\s+revision\s+note|final\s+verification\s+note|editorial\s+revision\s+note|final\s+manuscript\s+revision\s+note|final\s+manuscript\s+note|revision\s+note|verification\s+note)\b/i;
const MAX_NOTE_LEN = 4000;

const BLOCK_RE = /<(p|h[1-4])\b[^>]*>([\s\S]*?)<\/\1>/gi;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const stripTags = (h) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

function balanced(html) {
  for (const t of TAGS) {
    const open = (html.match(new RegExp(`<${t}\\b`, "gi")) ?? []).length;
    const close = (html.match(new RegExp(`</${t}>`, "gi")) ?? []).length;
    if (open !== close) return `<${t}> ${open} vs ${close}`;
  }
  return null;
}

function planCut(html) {
  const passing = [];
  BLOCK_RE.lastIndex = 0;
  for (const m of html.matchAll(BLOCK_RE)) {
    const text = stripTags(m[2]);
    if (!NOTE_START.test(text)) continue;
    const start = m.index;
    const tail = html.slice(start);
    const tailLower = tail.toLowerCase();
    if (tail.length > MAX_NOTE_LEN) continue;
    if (REQUIRED.some((r) => tailLower.includes(r.toLowerCase()))) continue;
    if (!NOTE_START.test(stripTags(tail))) continue;
    const kept = html.slice(0, start).replace(/\s+$/, "");
    if (kept.length < 5000) continue;
    if (!/<\/(p|ul|ol|table|blockquote)>$/i.test(kept)) continue;
    if (REQUIRED.some((r) => !kept.includes(r))) continue;
    if (balanced(kept)) continue;
    passing.push({ start, kept, removed: tail, removedText: stripTags(tail) });
  }
  if (!passing.length) return { error: "no note block resolved" };
  // Earliest passing candidate = outermost start of the note block (heading
  // before its paragraphs, first paragraph before a later marker paragraph).
  return { ...passing[0], candidates: passing.length };
}

const sections = await prisma.chapterSection.findMany({
  where: { chapterId: CHAPTER_ID },
  orderBy: { order: "asc" },
});
if (sections.length !== N_CHAPTERS) throw new Error(`expected ${N_CHAPTERS} sections, found ${sections.length}`);

const plan = [];
const skipped = [];
for (const s of sections) {
  const cut = planCut(s.content);
  if (cut.error) {
    skipped.push(`${s.title}: ${cut.error}`);
    continue;
  }
  plan.push({ s, ...cut });
}

console.log(`planned cuts: ${plan.length}/${sections.length}`);
for (const p of plan) {
  console.log(
    `  ch${p.s.order + 1} -${p.removed.length} chars | ${p.removedText.slice(0, 110)}${p.removedText.length > 110 ? "…" : ""}`
  );
}
if (skipped.length) {
  console.log("SKIPPED (no write):");
  for (const k of skipped) console.log(`  ${k}`);
}
if (plan.length !== sections.length) {
  console.log("\nABORT: not every chapter resolved to exactly one note block — nothing written.");
  process.exit(1);
}

if (DRY_RUN) {
  console.log("\nDRY RUN — no writes performed.");
  process.exit(0);
}

fs.writeFileSync(
  BACKUP,
  JSON.stringify(sections.map((s) => ({ id: s.id, title: s.title, content: s.content })), null, 2)
);
console.log(`\nbackup written: ${BACKUP}`);

for (const p of plan) {
  await prisma.chapterSection.update({ where: { id: p.s.id }, data: { content: p.kept } });
}

// Re-read and assert the applied result against the backup.
const after = await prisma.chapterSection.findMany({
  where: { chapterId: CHAPTER_ID },
  orderBy: { order: "asc" },
});
let totalRemoved = 0;
const problems = [];
for (let i = 0; i < after.length; i++) {
  const before = plan[i];
  const now = after[i];
  totalRemoved += sections[i].content.length - now.content.length;
  if (now.content !== before.kept) problems.push(`${now.title}: content != planned kept prefix`);
  if (/Revision Note|verification note|Editorial Revision|Editorial note/i.test(now.content))
    problems.push(`${now.title}: note marker still present`);
  for (const r of REQUIRED) if (!now.content.includes(r)) problems.push(`${now.title}: lost "${r}"`);
  const b = balanced(now.content);
  if (b) problems.push(`${now.title}: unbalanced ${b}`);
  if (sections[i].content.length - now.content.length > MAX_NOTE_LEN)
    problems.push(`${now.title}: removed too much`);
}
if (problems.length) {
  console.log("\nPOST-WRITE VERIFY FAILED:");
  for (const p of problems) console.log(`  ${p}`);
  console.log(`restore from: ${BACKUP}`);
  process.exit(1);
}
console.log(`POST-WRITE VERIFY PASSED — ${after.length} sections, ${totalRemoved} chars removed total.`);
await prisma.$disconnect();
