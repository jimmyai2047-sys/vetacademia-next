// Convert VMC 501 end-of-chapter MCQs + answer keys into chapter mock tests
// (same format as VMC 502+), then remove the MCQ text blocks from lectures.
// Usage: node scripts/mcq-to-mocks-vmc501.mjs [--dry-run]
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const CHAPTER_ID = "cmsr042fe0000t8k5pnn4twox";
const SUBJECT_ID = "cmsqtshkn00bcwwk5cqcqk5d0";
const DRY_RUN = process.argv.includes("--dry-run");

function stripTags(s) { return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(); }

function parseMCQs(html) {
  const start = html.search(/<h1[^>]*>\d+\.\d+ Multiple Choice Questions<\/h1>/i);
  if (start < 0) return { error: "MCQ heading not found" };
  const afterMCQ = html.slice(start);
  // Answer key block: <h3>Answer Key</h3><table>...1. (b)...</table>
  const keyMatch = afterMCQ.match(/<h3[^>]*>Answer Key<\/h3>\s*(<table>[\s\S]*?<\/table>)/i);
  if (!keyMatch) return { error: "Answer Key table not found" };
  const keyText = stripTags(keyMatch[1]);
  const answers = {};
  for (const m of keyText.matchAll(/(\d+)\.\s*\(([a-d])\)/gi)) answers[Number(m[1])] = "abcd".indexOf(m[2].toLowerCase());
  const mcqRegion = afterMCQ.slice(0, keyMatch.index);
  // Question stems: <p><strong>N.</strong>TEXT</p>
  const stems = [...mcqRegion.matchAll(/<p><strong>(\d+)\.\s*<\/strong>([\s\S]*?)<\/p>/gi)];
  // Options paras: <p>(a) ...</p> (contain at least (a) and (d))
  const optParas = [...mcqRegion.matchAll(/<p>\(a\)([\s\S]*?)<\/p>/gi)];
  if (stems.length !== 20) return { error: `stems=${stems.length}` };
  if (optParas.length !== 20) return { error: `option paras=${optParas.length}` };
  const questions = [];
  for (let i = 0; i < 20; i++) {
    const n = Number(stems[i][1]);
    if (n !== i + 1) return { error: `stem order broken at ${stems[i][1]}` };
    const text = stripTags(stems[i][2]);
    const raw = "(a)" + optParas[i][1].replace(/<br\s*\/?>/gi, " ");
    const parts = raw.split(/\(([a-d])\)/gi);
    // parts: ["", "a", "optA", "b", "optB", ...]
    const opts = [];
    for (let k = 1; k < parts.length; k += 2) {
      const label = parts[k].toLowerCase();
      const val = stripTags(parts[k + 1] ?? "");
      if (label !== "abcd"[opts.length]) return { error: `Q${n}: option label order broken` };
      opts.push(val);
    }
    if (opts.length !== 4 || opts.some(o => !o)) return { error: `Q${n}: options parsed=${opts.length}` };
    if (!(n in answers)) return { error: `Q${n}: answer missing` };
    questions.push({ n, text, options: opts, correct: answers[n] });
  }
  // Removal span: from MCQ h1 through end of answer-key </p>
  const removeEnd = start + keyMatch.index + keyMatch[0].length;
  return { questions, removeStart: start, removeEnd };
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  const sections = await prisma.chapterSection.findMany({ where: { chapterId: CHAPTER_ID }, orderBy: { order: "asc" } });
  console.log("sections:", sections.length);

  // Dry parse all first
  const parsed = [];
  let ok = true;
  for (const s of sections) {
    const chNo = s.order + 1;
    const r = parseMCQs(s.content);
    if (r.error) { console.log(` Ch${chNo}: PARSE FAIL ${r.error} :: ${s.title.slice(0, 60)}`); ok = false; continue; }
    parsed.push({ s, chNo, ...r });
    console.log(` Ch${chNo}: 20 Qs OK :: ${s.title.slice(0, 60)}`);
  }
  if (!ok) { console.log("Fix parser before writing."); await prisma.$disconnect(); return; }
  // Show sample
  console.log("--- SAMPLE Ch1 Q1 ---");
  console.log(JSON.stringify(parsed[0].questions[0], null, 1).slice(0, 500));

  if (DRY_RUN) { console.log("DRY RUN - no writes"); await prisma.$disconnect(); return; }

  for (const p of parsed) {
    const topic = p.s.title.replace(/^\s*chapter\s+\d+\s*[:\-–—]\s*/i, "").trim();
    const nn = String(p.chNo).padStart(2, "0");
    const testTitle = `VMC 501 Ch-${nn}: ${topic} - Mock Test (20 MCQs)`;
    const existing = await prisma.mockTest.findFirst({ where: { title: testTitle } });
    if (existing) {
      const qc = await prisma.question.count({ where: { mockTestId: existing.id } });
      console.log(` Ch${p.chNo}: test exists (${qc} Qs) — skipping creation`);
    } else {
      const t = await prisma.mockTest.create({
        data: {
          title: testTitle,
          description: `Chapter ${p.chNo} mock test for VMC 501 General Bacteriology: ${topic}.`,
          duration: 20, totalMarks: 20, subjectId: SUBJECT_ID,
          track: "veterinary-microbiology-vmc501", kind: "MOCK", isDemo: false,
          questions: {
            create: p.questions.map(q => ({ text: q.text, options: JSON.stringify(q.options), correctAnswer: q.correct, marks: 1 })),
          },
        },
      });
      console.log(` Ch${p.chNo}: created test ${t.id} with 20 Qs`);
    }
    // Remove MCQ + answer-key block from lecture
    const newContent = p.s.content.slice(0, p.removeStart) + p.s.content.slice(p.removeEnd);
    if (newContent.includes("Multiple Choice Questions") || newContent.includes("Answer Key")) {
      console.log(` Ch${p.chNo}: WARNING leftover MCQ text after removal`);
    } else {
      await prisma.chapterSection.update({ where: { id: p.s.id }, data: { content: newContent } });
      console.log(` Ch${p.chNo}: MCQ block removed from lecture (len ${p.s.content.length} -> ${newContent.length})`);
    }
  }
  await prisma.$disconnect();
  console.log("Done!");
}
main().catch(e => { console.error(e); process.exit(1); });
