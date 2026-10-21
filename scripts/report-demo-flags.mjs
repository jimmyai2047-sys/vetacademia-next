import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// READ-ONLY audit of demo / published-asset consistency (admin review finding 3).
// Prints three lists and never writes to the database.
//   1. Published materials with no readable source (file / link / body)
//   2. Titles starting "[DEMO]" and what their isDemo flag actually says
//   3. isDemo rows that would render an empty card on /demo
// Usage: node scripts/report-demo-flags.mjs

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const hasSource = (m) =>
  !!(m.fileUrl?.trim() || m.externalUrl?.trim() || m.body?.trim());

const pad = (s, n) => String(s ?? "").slice(0, n).padEnd(n);

async function main() {
  const materials = await prisma.examMaterial.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }],
    select: {
      id: true,
      category: true,
      type: true,
      title: true,
      published: true,
      isDemo: true,
      fileUrl: true,
      externalUrl: true,
      body: true,
      updatedAt: true,
    },
  });

  console.log(`\nExamMaterial rows: ${materials.length}`);

  // 1. Published but unreadable
  const broken = materials.filter((m) => m.published && !hasSource(m));
  console.log(`\n=== [1] PUBLISHED WITH NO ASSET: ${broken.length} ===`);
  for (const m of broken) {
    console.log(
      `  ${pad(m.id, 26)} ${pad(m.category, 16)} ${pad(m.type, 6)} isDemo=${m.isDemo ? "Y" : "N"}  ${m.title}`
    );
  }

  // 2. "[DEMO]" titles vs the isDemo flag
  const demoTitled = materials.filter((m) => m.title.trim().toUpperCase().startsWith("[DEMO]"));
  const inverted = demoTitled.filter((m) => !m.isDemo);
  const onDemoPage = materials.filter((m) => m.isDemo);
  console.log(
    `\n=== [2] TITLES STARTING "[DEMO]": ${demoTitled.length} — with isDemo=false: ${inverted.length} ===`
  );
  console.log(`    Rows currently visible on /demo (isDemo=true): ${onDemoPage.length}`);
  for (const m of inverted) {
    console.log(
      `  INVERTED ${pad(m.id, 26)} published=${m.published ? "Y" : "N"} asset=${hasSource(m) ? "Y" : "N"}  ${m.title}`
    );
  }

  // 3. Demo rows that render empty
  const emptyDemo = onDemoPage.filter((m) => !hasSource(m));
  console.log(`\n=== [3] isDemo=TRUE WITH NO READABLE SOURCE: ${emptyDemo.length} ===`);
  for (const m of emptyDemo) {
    console.log(`  ${pad(m.id, 26)} published=${m.published ? "Y" : "N"}  ${m.title}`);
  }

  console.log(`
NEXT STEPS
  • Fix [3] with scripts/fix-demo-handbooks.mjs (targeted, 3 rows, needs CONFIRM=apply).
  • [2] is a data-semantics decision: flipping isDemo on "[DEMO]" rows makes them
    public. Review the list above and approve the ids before any change.
  • No rows were modified by this report.
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
