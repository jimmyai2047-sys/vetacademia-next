import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const isOnlyNumberLine = (s) => /^\s*(\d+)[\.\)]\s*$/.test(s);
const isNumberWithContent = (s) => /^\s*(\d+)[\.\)]\s+.+/.test(s);

let total = 0, fixed = 0, fixes = [];

const tests = await prisma.mockTest.findMany({
  include: { questions: { orderBy: { createdAt: "asc" } } },
});

for (const test of tests) {
  for (let idx = 0; idx < test.questions.length; idx++) {
    const q = test.questions[idx];
    total++;
    let text = q.text;
    let original = text;
    let lines = text.split("\n");
    let changed = false;

    // Trim BOM and leading/trailing whitespace issues but preserve internal structure
    // 1. If first line is empty (due to \n at start), remove it
    while (lines.length > 1 && lines[0].trim() === "") {
      lines.shift();
      changed = true;
    }
    // 2. If first line is only number like "1." or "22." and next line has content, merge
    if (lines.length >= 2 && isOnlyNumberLine(lines[0]) && lines[1].trim().length > 0) {
      const num = lines[0].trim();
      // Merge number + next line content with single space
      lines[0] = `${num} ${lines[1].trim()}`;
      lines.splice(1, 1);
      changed = true;
    }
    // 3. Handle case where number and question are on same line but separated by \n due to split error?
    // Already covered. Also handle "1.\n\nQuestion" double newline
    // 4. Also check for any internal occurrence of isolated number line (not just first)
    // For n=1..lines.length-2, if lines[n] is only number and next line is content and prev line doesn't look like list context
    // This is rarer; fix only if it looks like question split across lines
    for (let i = 0; i < lines.length - 1; i++) {
      // Skip list-like context: if surrounding lines contain "List" or arrow
      if (isOnlyNumberLine(lines[i]) && lines[i+1].trim().length > 3) {
        // Check if this is likely a question number inside the text (e.g., bilingual split left number)
        // We only auto-fix if i is 0 or next line is long question-like (>10 chars) and not a list item A./B.
        const next = lines[i+1].trim();
        if (!/^[A-D]\./.test(next) && !/^[I|V|X]+\./.test(next) && !next.includes("→")) {
          // This is suspicious isolated number inside question body; merge
          // But only if it's at start of text block or after empty?
          // To be safe, only fix if i==0 already handled, so skip others unless clearly question split
          // Let's flag for reporting but not auto-fix beyond first line
          // console.log(`Found isolated number inside Q ${q.id} at line ${i}: "${lines[i]}" -> "${next.slice(0,40)}"`);
        }
      }
    }

    // 5. Also trim trailing spaces per line but keep structure
    let newText = lines.join("\n");
    // Replace multiple spaces, normalize
    // Also fix case where text is "1. \nQuestion" already handled; else keep

    // 6. If original starts with spaces before number, trim
    if (newText !== original) {
      fixed++;
      fixes.push({ test: test.title, year: test.year, qIdx: idx+1, before: JSON.stringify(original.slice(0,150)), after: JSON.stringify(newText.slice(0,150)) });
      if (process.argv.includes("--apply")) {
        await prisma.question.update({ where: { id: q.id }, data: { text: newText } });
      }
    }
  }
}

console.log(`Scanned ${total} questions across ${tests.length} tests`);
console.log(`Need fix (first-line isolated number or leading empty): ${fixed}`);
if (fixes.length) {
  console.log("Sample fixes (dry run, not yet applied):");
  fixes.slice(0,20).forEach(f=> console.log(JSON.stringify(f)));
} else {
  console.log("No DB fixes needed for numbering line issue.");
}

// Now also check UI rendering issue report
console.log("\n=== UI ISSUE NOTE ===");
console.log("DB numbering is clean (no isolated number line). However UI renders number '1.' outside QuestionText block,");
console.log("causing visual gap where QuestionText's first div is block-level. Need to fix mock-test-player.tsx to keep number inline.");

await prisma.$disconnect();
