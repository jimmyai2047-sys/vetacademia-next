const { PrismaClient } = require("D:/VetAcademia (VA)/vetacademia-next/node_modules/.prisma/client");
const { PrismaPg } = require("D:/VetAcademia (VA)/vetacademia-next/node_modules/@prisma/adapter-pg");
require("D:/VetAcademia (VA)/vetacademia-next/node_modules/dotenv/config");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

async function main() {
  // Get AHDP programme
  const prog = await p.programme.findFirst({ where: { name: { contains: "AHDP", mode: "insensitive" } } });
  console.log("AHDP Programme ID:", prog.id);

  // Get the Animal Husbandry Extension subject
  const sub = await p.subject.findFirst({
    where: { programmeId: prog.id, name: { contains: "Extension", mode: "insensitive" } },
  });
  console.log("Subject:", JSON.stringify(sub, null, 2));

  // Get chapters with minimal content
  const chapters = await p.chapter.findMany({
    where: { subjectId: sub.id },
    select: { id: true, title: true, unitNumber: true, content: true, author: true, reviewer: true, createdAt: true, updatedAt: true },
  });
  console.log("Chapters (" + chapters.length + "):");
  for (const ch of chapters) {
    console.log("  - [" + ch.id + "] Unit " + ch.unitNumber + ": " + ch.title);
    console.log("    Content length:", (ch.content || "").length, "chars");
    console.log("    Author:", ch.author || "none", " Reviewer:", ch.reviewer || "none");
    console.log("    Created:", ch.createdAt, " Updated:", ch.updatedAt);
  }

  // Get ChapterContent for each chapter
  for (const ch of chapters) {
    const cc = await p.chapterContent.findMany({ where: { chapterId: ch.id } });
    console.log("  ChapterContent for", ch.title + ":", cc.length, "files");
    for (const c of cc) console.log("    -", c.fileName, c.fileType, (c.size||0) + "bytes");
  }

  // Get StudyMaterials for subject
  const sm = await p.studyMaterial.findMany({ where: { subjectId: sub.id } });
  console.log("StudyMaterials for subject:", sm.length);
  for (const m of sm) console.log("  -", m.title, m.type, m.fileName || "no-file");
}

main().catch(e => console.error(e)).finally(() => p.$disconnect());