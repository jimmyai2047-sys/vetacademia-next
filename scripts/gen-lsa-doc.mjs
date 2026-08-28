import "dotenv/config";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Document, Packer, Paragraph, TextRun } from "docx";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const mt = await prisma.mockTest.findFirst({
  where: { title: { contains: "2016 (7 September" } },
});
if (!mt) {
  console.error("MockTest not found");
  process.exit(1);
}
const questions = await prisma.question.findMany({
  where: { mockTestId: mt.id },
  orderBy: { createdAt: "asc" },
});
console.log(`Found ${questions.length} questions`);

const children = [];
children.push(
  new Paragraph({
    heading: "Title",
    children: [new TextRun({ text: "LSA Previous Year Paper 2016 (7 September 2016) — Questions", bold: true })],
  })
);
children.push(
  new Paragraph({ children: [new TextRun({ text: `Total questions: ${questions.length}. Answer key & explanation to be filled.`, italics: true })] })
);

questions.forEach((q, idx) => {
  children.push(
    new Paragraph({
      spacing: { before: 200 },
      children: [new TextRun({ text: `Q${idx + 1}.`, bold: true })],
    })
  );
  const lines = String(q.text || "").split("\n");
  for (const line of lines) {
    if (line.trim()) children.push(new Paragraph({ children: [new TextRun(line)] }));
  }
  let opts = [];
  try {
    opts = JSON.parse(q.options || "[]");
  } catch {
    opts = [];
  }
  opts.forEach((o, oi) => {
    children.push(
      new Paragraph({
        indent: { left: 360 },
        children: [new TextRun({ text: `${String.fromCharCode(65 + oi)}. ${o}`, size: 22 })],
      })
    );
  });
  children.push(new Paragraph({ children: [new TextRun({ text: "Answer: ____    Explanation: ________________________", italics: true, color: "888888" })] }));
});

const doc = new Document({ sections: [{ children }] });
const buf = await Packer.toBuffer(doc);
const outPath = process.env.OUT || "D:\\VetAcademia (VA)\\LSA_2016_7Sep_Questions.docx";
fs.writeFileSync(outPath, buf);
console.log(`Wrote ${outPath}`);
await prisma.$disconnect();
