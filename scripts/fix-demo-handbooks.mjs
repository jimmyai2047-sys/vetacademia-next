import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Targeted repair for the three seeded "Free Study Handbook (Preview)" rows
// (admin review finding 3): published + isDemo but with no asset, so /demo
// showed an empty card.
//
// Deliberately NARROW: it only fills missing assets on rows matching that
// exact title pattern. It never changes isDemo, published, or any other
// material — unlike re-running seed-demo.mjs, which deletes every isDemo row.
//
// Dry run (default): node scripts/fix-demo-handbooks.mjs
// Apply:             CONFIRM=apply node scripts/fix-demo-handbooks.mjs

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SAMPLE = {
  fileUrl: "/samples/sample-drug-guide.pdf",
  fileName: "vetacademia-sample.pdf",
  fileType: "application/pdf",
  fileSize: 441216,
  description:
    "Sample PDF from the VetAcademia library — open it to judge the material before you enrol.",
};

const hasSource = (m) => !!(m.fileUrl?.trim() || m.externalUrl?.trim() || m.body?.trim());

async function main() {
  const apply = process.env.CONFIRM === "apply";
  const rows = await prisma.examMaterial.findMany({
    where: { title: { endsWith: "Free Study Handbook (Preview)" } },
    select: {
      id: true,
      title: true,
      category: true,
      published: true,
      isDemo: true,
      fileUrl: true,
      externalUrl: true,
      body: true,
    },
  });

  console.log(`\nMatched "${"Free Study Handbook (Preview)"}" rows: ${rows.length}`);
  if (rows.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  const needsFix = rows.filter((m) => !hasSource(m));
  for (const m of rows) {
    console.log(
      `  ${m.id} ${m.category} asset=${hasSource(m) ? "OK" : "MISSING"} published=${m.published ? "Y" : "N"} isDemo=${m.isDemo ? "Y" : "N"}`
    );
  }

  if (needsFix.length === 0) {
    console.log("\nAll matched rows already have an asset — no changes needed.");
    return;
  }

  if (!apply) {
    console.log(`\nDRY RUN — would set fileUrl/fileName/fileType/fileSize/description on ${needsFix.length} row(s).`);
    console.log("Run again with CONFIRM=apply to write.");
    return;
  }

  const result = await prisma.examMaterial.updateMany({
    where: { id: { in: needsFix.map((m) => m.id) } },
    data: SAMPLE,
  });
  console.log(`\nUpdated ${result.count} row(s). isDemo/published untouched.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
