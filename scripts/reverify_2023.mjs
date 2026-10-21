import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const test = await prisma.mockTest.findFirst({
  where: { title: "ICAR AIEEA PG 2023 Veterinary Science" },
  include: { questions: { orderBy: { createdAt: "asc" } } }
});
if (!test) { console.log("Not found"); process.exit(1); }
console.log(`=== Recheck: ${test.title} (${test.year}) ${test.questions.length} Qs ===`);
console.log(`Track=${test.track} Exam=${test.exam} Kind=${test.kind}`);

let issues = [];
let listQs = [3,6,11,14,27,33,37,51,52,53,71,72,73,90,97,104,107,111];
let passCount = 0;

for (let idx=0; idx<test.questions.length; idx++) {
  const q = test.questions[idx];
  const qno = idx+1;
  const text = q.text;
  const opts = JSON.parse(q.options);
  const lines = text.split("\n").map(l=>l.trim()).filter(Boolean);

  // Check 1: Options count 4
  if (opts.length !== 4) issues.push(`Q${qno}: opts length ${opts.length} !=4`);

  // Check 2: options should be clean without "1)." prefix (normalize removes)
  for (const o of opts) {
    if (/^[1-4]\)\./.test(o) || /^[1-4]\.\s/.test(o)) issues.push(`Q${qno}: option still has numbering ${o.slice(0,20)}`);
  }

  // Check 3: Text should not contain "1). " as question part (should be options only)
  if (/^\s*[1-4]\)\./.test(text)) issues.push(`Q${qno}: text starts with option numbering`);

  // Check 4: List questions must have List I and List II separate blocks
  if (listQs.includes(qno)) {
    if (!text.includes("List I") || !text.includes("List II")) issues.push(`Q${qno}: List missing header`);
    // Should have A. and I. lines separate
    if (!text.includes("\nA. ") && !text.includes("A. ")) issues.push(`Q${qno}: List A not separate`);
    // Check that A-D items are each on separate lines (look for "\nB. ")
    const hasSeparate = text.includes("\nA. ") || text.includes("\nB. ") || text.split("\n").some(l=>l.trim().startsWith("A. "));
    if (!hasSeparate) issues.push(`Q${qno}: List items not on separate lines`);
    // Ensure Choose line present
    if (!text.includes("Choose the correct")) issues.push(`Q${qno}: Choose line missing`);
  }

  // Check 5: A/B/C/D stems should be on individual lines if original had (A) (B) etc
  // Detect if text contains "\nA. " etc or combined "(A) "
  if (text.includes("(A)") && !text.includes("\nA.") && !text.includes("\nA. ") ) {
    // If still contains "(A)" on same line with "(B)", it's not split
    if (text.match(/\(A\).*\(B\)/s)) {
      issues.push(`Q${qno}: A/B/C/D not split into individual lines (still contains "(A) ... (B)" on same line)`);
    }
  }
  // Also check that if text has "A. " but not newline before, maybe still okay
  // We'll flag if text contains "A. " and "B. " on same line
  for (const l of lines) {
    if (l.includes("A. ") && l.includes("B. ") && l.includes("C. ")) {
      issues.push(`Q${qno}: line contains multiple A/B/C on same line: ${l.slice(0,80)}`);
    }
  }

  // Check 6: Statement I/II must be on separate lines
  if (text.includes("Statement (I):") || text.includes("Statement (I)")) {
    if (text.includes("Statement (I):") && text.includes("Statement (II):")) {
      if (!text.includes("\nStatement (II)")) issues.push(`Q${qno}: Statement I/II not on separate lines`);
    }
    // Ensure not combined in one line like "Statement (I): ... Statement (II): ..."
    const firstLineWithBoth = lines.find(l=> l.includes("Statement (I):") && l.includes("Statement (II):"));
    if (firstLineWithBoth) issues.push(`Q${qno}: Statement I/II combined in same line`);
  }

  // Check 7: Assertion/Reason separate
  if (text.includes("Assertion (A):")) {
    if (!text.includes("\nReason (R)")) issues.push(`Q${qno}: Assertion/Reason not separate`);
    const combinedLine = lines.find(l=> l.includes("Assertion (A):") && l.includes("Reason (R)"));
    if (combinedLine) issues.push(`Q${qno}: Assertion/Reason combined in same line`);
    if (!text.includes("\nAssertion (A):") && qno!==1) {
      // first line after intro should be Assertion
      // Check that text has newline before Assertion
      if (text.match(/Assertion \(A\):.*Reason \(R\)/s) && !text.includes("\nAssertion")) {
        // already flagged
      }
    }
  }

  // Check 8: Q should start with question number line? In DB text doesn't include Q.No., frontend adds it, so skip

  // Check 9: Explanation exists
  if (!q.explanation || q.explanation.trim().length < 10) issues.push(`Q${qno}: explanation missing/short`);

  // Check 10: correctAnswer in range
  if (q.correctAnswer <0 || q.correctAnswer>3) issues.push(`Q${qno}: correctAnswer out of range ${q.correctAnswer}`);

  if (issues.filter(m=>m.startsWith(`Q${qno}:`)).length===0) passCount++;
}

// Summary
console.log(`\n=== Summary ===`);
console.log(`Total Qs: ${test.questions.length}`);
console.log(`Passed: ${passCount}/${test.questions.length}`);
console.log(`Issues found: ${issues.length}`);
if (issues.length>0) {
  console.log("\n--- Issues detail ---");
  for (const iss of issues) console.log(iss);
} else {
  console.log("All checks passed!");
}

// Show sample of each type for manual verification
function showQ(n){
  const q = test.questions[n-1];
  console.log(`\n===== Q${n} =====`);
  console.log(q.text);
  console.log("--- Options ---");
  const opts = JSON.parse(q.options);
  opts.forEach((o,i)=>console.log(`${i+1}). ${o}`));
  console.log(`Correct: ${q.correctAnswer+1} Explanation: ${(q.explanation||'').slice(0,120)}`);
}
console.log("\n=== Sample List Q3 ==="); showQ(3);
console.log("\n=== Sample Assertion Q4 ==="); showQ(4);
console.log("\n=== Sample Statement Q28 ==="); showQ(28);
console.log("\n=== Sample Arrange Q54 (with E) ==="); showQ(54);
console.log("\n=== Sample Simple Q1 ==="); showQ(1);

await prisma.$disconnect();
