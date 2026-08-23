const { PrismaClient } = require("D:/VetAcademia (VA)/vetacademia-next/node_modules/.prisma/client");
const { PrismaPg } = require("D:/VetAcademia (VA)/vetacademia-next/node_modules/@prisma/adapter-pg");
require("D:/VetAcademia (VA)/vetacademia-next/node_modules/dotenv/config");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

async function main() {
  // List ALL AHDP subjects
  const subs = await p.subject.findMany({
    where: { programmeId: "cmsqtq5c90000wwk5zf459l7m" },
    include: { _count: { select: { chapters: true } } },
  });
  console.log("ALL AHDP SUBJECTS:");
  for (const s of subs) console.log("  -", s.id, s.code, s.name, "chapters:", s._count.chapters);

  // Check StudyMaterials across ALL AHDP subjects
  const allSM = await p.studyMaterial.findMany({
    where: { subject: { programmeId: "cmsqtq5c90000wwk5zf459l7m" } },
  });
  console.log("\\nStudyMaterials across ALL AHDP subjects:", allSM.length);
  for (const m of allSM) console.log("  -", m.title, "subject:", m.subjectId, "file:", m.fileName || "none");
}

main().catch(e => console.error(e)).finally(() => p.$disconnect());