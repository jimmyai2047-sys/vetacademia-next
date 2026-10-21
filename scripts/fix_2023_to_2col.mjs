import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const test = await prisma.mockTest.findFirst({
  where: { title: "ICAR AIEEA PG 2023 Veterinary Science" },
  include: { questions: { orderBy: { createdAt: "asc" } } }
});
const listQs = [3,6,11,14,27,33,37,51,52,53,71,72,73,90,97,104,107,111];
console.log(`Converting ${listQs.length} List Qs to 2-column format (→ table)`);
for (const n of listQs) {
  const q = test.questions[n-1];
  const lines = q.text.split("\n").map(l=>l.trim()).filter(Boolean);
  // lines[0] = Match List I with List II
  // Find List I header, List II header, items
  // Structure currently:
  // 0: Match List I with List II
  // 1: List I (...):
  // 2: A. ...
  // 3: B. ...
  // 4: C. ...
  // 5: D. ...
  // 6: List II (...):
  // 7: I. ...
  // 8: II. ...
  // 9: III. ...
  // 10: IV. ...
  // 11: Choose...
  const matchLine = lines[0];
  // Find indices
  let listIHeaderIdx = lines.findIndex(l=> l.startsWith("List I"));
  let listIIHeaderIdx = lines.findIndex(l=> l.startsWith("List II"));
  let chooseIdx = lines.findIndex(l=> l.includes("Choose the correct"));
  if (listIHeaderIdx===-1 || listIIHeaderIdx===-1 || chooseIdx===-1) {
    console.log(`Q${n} unexpected structure`, lines.slice(0,12));
    continue;
  }
  const listIHeader = lines[listIHeaderIdx].replace(/:$/, "").trim(); // e.g. List I (Stain):
  const listIIHeader = lines[listIIHeaderIdx].replace(/:$/, "").trim();
  const listIItems = lines.slice(listIHeaderIdx+1, listIIHeaderIdx);
  const listIIItems = lines.slice(listIIHeaderIdx+1, chooseIdx);
  const chooseLine = lines[chooseIdx];
  // Validate 4 items each
  if (listIItems.length !==4 || listIIItems.length!==4) {
    console.log(`Q${n} item count mismatch I=${listIItems.length} II=${listIIItems.length}`);
    continue;
  }
  // Build new text with 2 columns using → (as QuestionText expects)
  // Header row: "List I (...) : → List II (...):"  keep colon
  // But to trigger table header, line should contain List and → and not start with (A) etc
  // So we make: "List I (Stain): → List II (Used to identify):"
  const headerRow = `${listIHeader}: → ${listIIHeader}:`;
  // Rows: "A. X → I. Y"
  let newLines = [];
  newLines.push(matchLine);
  newLines.push(headerRow);
  for(let i=0;i<4;i++){
    newLines.push(`${listIItems[i]} → ${listIIItems[i]}`);
  }
  newLines.push(chooseLine);
  // If any extra lines before match? Keep
  // Rejoin
  const newText = newLines.join("\n");
  console.log(`\n--- Q${n} BEFORE ---`);
  console.log(q.text.slice(0,300));
  console.log(`--- Q${n} AFTER ---`);
  console.log(newText);
  await prisma.question.update({ where: { id: q.id }, data: { text: newText } });
  console.log(`Updated Q${n} to 2-col`);
}
console.log("Done 2-col conversion");
await prisma.$disconnect();
