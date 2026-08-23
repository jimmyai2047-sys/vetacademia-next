const { PrismaClient } = require("D:/VetAcademia (VA)/vetacademia-next/node_modules/.prisma/client");
const { PrismaPg } = require("D:/VetAcademia (VA)/vetacademia-next/node_modules/@prisma/adapter-pg");
require("D:/VetAcademia (VA)/vetacademia-next/node_modules/dotenv/config");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

async function main() {
  const subId = "cmsqtqg23001gwwk55wd4sqdc";

  // Check all chapters with content preview
  const chapters = await p.chapter.findMany({
    where: { subjectId: subId },
    select: { id: true, title: true, unitNumber: true, type: true, createdAt: true, updatedAt: true },
    orderBy: { unitNumber: "asc" },
  });
  console.log("Total chapters in subject:", chapters.length);
  for (const ch of chapters) {
    console.log("  [" + ch.id + "] Unit " + ch.unitNumber + ": " + ch.title + " (" + (ch.type||"THEORY") + ")");
    console.log("    Created: " + ch.createdAt + " Updated: " + ch.updatedAt);
  }

  // Check ALL ChapterContent in the system for this subject
  const chapIds = chapters.map(c => c.id);
  if (chapIds.length > 0) {
    const allCC = await p.chapterContent.findMany({
      where: { chapterId: { in: chapIds } },
      orderBy: { createdAt: "desc" },
    });
    console.log("\\nAll ChapterContent files:", allCC.length);
    for (const c of allCC) console.log("  -", c.fileName, c.fileType, (c.size||0) + "bytes", "ch:" + c.chapterId);
  }

  // Check ALL StudyMaterials for this subject
  const allSM = await p.studyMaterial.findMany({
    where: { subjectId: subId },
    orderBy: { createdAt: "desc" },
  });
  console.log("\\nAll StudyMaterials:", allSM.length);
  for (const m of allSM) console.log("  -", m.title, m.type, m.fileName || "no-file", m.url ? "has-url" : "no-url");

  // Check ChapterSections for content
  if (chapIds.length > 0) {
    const sections = await p.chapterSection.findMany({
      where: { chapterId: { in: chapIds } },
      orderBy: { order: "asc" },
    });
    console.log("\\nChapterSections:", sections.length);
    for (const s of sections) console.log("  -", s.title, "ch:" + s.chapterId, "len:" + (s.content||"").length);
  }

  // Check ExamMaterials with AHDP/Extension in subject
  const examMats = await p.examMaterial.findMany({
    where: { OR: [
      { subject: { contains: "Extension", mode: "insensitive" } },
      { subject: { contains: "Husbandry", mode: "insensitive" } },
    ]},
    orderBy: { createdAt: "desc" },
  });
  console.log("\\nExamMaterials:", examMats.length);
  for (const e of examMats) console.log("  -", e.title, e.subject, e.topic || "no-topic", e.fileUrl ? "has-file" : "no-file");
}

main().catch(e => console.error(e)).finally(() => p.$disconnect());