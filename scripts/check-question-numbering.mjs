import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const tests = await prisma.mockTest.findMany({
  include: { questions: { orderBy: { createdAt: "asc" } } },
  orderBy: { createdAt: "asc" },
});

console.log(`Total mock tests: ${tests.length}`);
let totalQuestions = 0;
let badQuestions = 0;
let report = [];

for (const test of tests) {
  console.log(`\n=== ${test.title} [${test.year || '?'}] (${test.id}) - ${test.questions.length} Qs ===`);
  totalQuestions += test.questions.length;
  for (let i = 0; i < test.questions.length; i++) {
    const q = test.questions[i];
    const text = q.text || "";
    const firstLine = text.split("\n")[0] || "";
    const trimmed = text.trimStart();
    const firstChar = trimmed[0] || "";
    // Check if numbering is on separate line or question starts from next line
    // Good: text starts with digit or number. Bad: first line is just number or empty or number with dot but no content
    // We need to detect cases where first line is like "1." or "1. " or "Q1." or empty
    const lines = text.split("\n");
    const l0 = (lines[0] || "").trim();
    const l1 = (lines[1] || "").trim();
    // patterns for bad: l0 matches only number patterns without substantive content
    const isOnlyNumber = /^(\d+)[\.\)]\s*$/.test(l0);
    const isNumberWithVeryShort = /^(\d+)[\.\)]\s*.{0,3}$/.test(l0) && l1.length > 5;
    // Also check if text starts with newline or spaces then number
    const startsWithNewline = text.startsWith("\n") || text.startsWith("\r");
    const firstLineIsShortNumber = isOnlyNumber || isNumberWithVeryShort;

    // Also detect if question text does NOT start with number at all (maybe numbering stripped)
    const startsWithNumber = /^\s*\d+[\.\)]/.test(trimmed);

    let status = "OK";
    let issue = "";
    if (firstLineIsShortNumber) {
      status = "BAD";
      issue = `First line is only numbering: "${l0}" -> next line: "${l1.slice(0,80)}"`;
    } else if (!startsWithNumber) {
      // Question does not start with number; but maybe it should? Check expected index
      // For PREVIOUS_YEAR, numbering should be present? But some texts have Hindi+English combined without number? Let's flag
      status = "NO_NUMBER";
      issue = `Does not start with number. First 80 chars: "${trimmed.slice(0,80).replace(/\n/g,'\\n')}"`;
    } else if (startsWithNewline) {
      status = "BAD";
      issue = `Starts with newline`;
    }

    if (status !== "OK") {
      badQuestions++;
      console.log(`  Q idx ${i} (db id ${q.id.slice(0,8)}): ${status} - ${issue}`);
      console.log(`    FULL first 200: "${text.slice(0,200).replace(/\n/g,'\\n')}"`);
      report.push({ testTitle: test.title, year: test.year, qDbId: q.id, idx: i, status, issue, textPreview: text.slice(0,300) });
    }
  }
}

console.log(`\n\n=== SUMMARY ===`);
console.log(`Total tests: ${tests.length}`);
console.log(`Total questions: ${totalQuestions}`);
console.log(`Bad/No-number questions: ${badQuestions}`);
if (report.length > 0) {
  console.log(`\nDetails JSON for bad:`);
  for (const r of report.slice(0,50)) {
    console.log(JSON.stringify(r).slice(0,500));
  }
}

await prisma.$disconnect();
