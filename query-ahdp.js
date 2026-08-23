const { PrismaClient } = require("D:/VetAcademia (VA)/vetacademia-next/node_modules/.prisma/client");
const { PrismaPg } = require("D:/VetAcademia (VA)/vetacademia-next/node_modules/@prisma/adapter-pg");
require("D:/VetAcademia (VA)/vetacademia-next/node_modules/dotenv/config");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

async function main() {
  const programmes = await p.programme.findMany({ where: { name: { contains: "AHDP", mode: "insensitive" } } });
  console.log("=== AHDP PROGRAMMES ===");
  console.log(JSON.stringify(programmes, null, 2));

  for (const prog of programmes) {
    const subjects = await p.subject.findMany({
      where: {
        programmeId: prog.id,
        OR: [
          { name: { contains: "Extension", mode: "insensitive" } },
          { name: { contains: "Husbandry", mode: "insensitive" } },
        ],
      },
      include: { chapters: true },
    });
    console.log("=== SUBJECTS in " + prog.name + " ===");
    for (const sub of subjects) {
      console.log("Subject: " + sub.name + " (ID: " + sub.id + ", Code: " + sub.code + ")");
      console.log("  Year: " + sub.year + ", Semester: " + sub.semester);
      console.log("  Chapters (" + sub.chapters.length + "):");
      for (const ch of sub.chapters) {
        console.log("    - [" + ch.id + "] Unit " + ch.unitNumber + ": " + ch.title);
        console.log("      Content length: " + (ch.content || "").length + " chars");
        const contents = await p.chapterContent.findMany({ where: { chapterId: ch.id } });
        if (contents.length > 0) {
          console.log("      ChapterContent files:");
          for (const c of contents) console.log("        - " + c.fileName + " (" + c.fileType + ", " + (c.size || 0) + " bytes) URL: " + c.url);
        }
        const materials = await p.studyMaterial.findMany({ where: { chapterId: ch.id } });
        if (materials.length > 0) {
          console.log("      StudyMaterials:");
          for (const m of materials) console.log("        - " + m.title + " (" + m.type + ") file: " + (m.fileName || "none") + " url: " + (m.url || "none"));
        }
      }
      const subMaterials = await p.studyMaterial.findMany({ where: { subjectId: sub.id, chapterId: null } });
      if (subMaterials.length > 0) {
        console.log("    Subject-level StudyMaterials:");
        for (const m of subMaterials) console.log("      - " + m.title + " (" + m.type + ") file: " + (m.fileName || "none") + " url: " + (m.url || "none"));
      }
    }
  }

  const examMats = await p.examMaterial.findMany({
    where: { OR: [{ subject: { contains: "Extension", mode: "insensitive" } }, { subject: { contains: "Husbandry", mode: "insensitive" } }] },
  });
  console.log("=== ExamMaterials (Extension/Husbandry) ===");
  console.log(JSON.stringify(examMats, null, 2));
}

main().catch(e => console.error(e)).finally(() => p.$disconnect());