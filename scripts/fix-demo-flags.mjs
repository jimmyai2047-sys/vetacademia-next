import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Demo-quality repair for ExamMaterial (admin review finding 3 follow-up,
// audit "demo quality"): three separate defects found by report-demo-flags.mjs
// and a full-table scan:
//
//   1. 24 rows titled "[DEMO] …" carry isDemo=false while their assets live in
//      the blob `exam-demo/` folder — the title and the assets say demo, the
//      flag says no. Flip isDemo=true so they belong to /demo only.
//   2. 12 of those rows point at https://example.com/demo-video|audio|animation
//      — dead placeholders that would render broken "Open" links. Unpublish.
//   3. 3 "Video Lecture Preview" rows still link the rickroll
//      (youtube.com/watch?v=dQw4w9WgXcQ). Unpublish until a real recording
//      exists (seed-demo.mjs no longer creates them).
//
// Companion code change (not this script): /examinations, /prepare and
// /api/exam-materials now filter isDemo:false so demo rows never appear on
// real surfaces (web or Android), and /demo strips the "[DEMO] " prefix from
// displayed titles.
//
// Dry run (default): node scripts/fix-demo-flags.mjs
// Apply:             CONFIRM=apply node scripts/fix-demo-flags.mjs
// Revert: isDemo=false / published=true per id (see printed before-state).

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PLACEHOLDER = /^https:\/\/example\.com\/demo-/i;
const RICKROLL = /dQw4w9WgXcQ/;

async function main() {
  const apply = process.env.CONFIRM === "apply";
  const rows = await prisma.examMaterial.findMany({
    select: { id: true, title: true, category: true, type: true, published: true, isDemo: true, fileUrl: true, externalUrl: true },
  });

  const setDemo = rows.filter((m) => m.title.trim().toUpperCase().startsWith("[DEMO]") && !m.isDemo);
  const unpublishPlaceholder = rows.filter((m) => PLACEHOLDER.test(m.externalUrl || "") && m.published);
  const unpublishRickroll = rows.filter((m) => RICKROLL.test(m.externalUrl || "") && m.published);

  const plan = [
    ["isDemo -> true (title says [DEMO])", setDemo],
    ["published -> false (example.com placeholder)", unpublishPlaceholder],
    ["published -> false (rickroll video)", unpublishRickroll],
  ];

  console.log(`\nExamMaterial rows scanned: ${rows.length}`);
  let total = 0;
  for (const [label, group] of plan) {
    total += group.length;
    console.log(`\n${label}: ${group.length}`);
    for (const m of group) {
      console.log(
        `  ${m.id} ${m.category}/${m.type} published=${m.published ? "Y" : "N"} isDemo=${m.isDemo ? "Y" : "N"}  ${m.title}  [${m.fileUrl || m.externalUrl || "no asset"}]`
      );
    }
  }

  if (total === 0) {
    console.log("\nNothing to do — all three defects already resolved.");
    return;
  }

  if (!apply) {
    console.log(`\nDRY RUN — ${total} update(s) planned across ${plan.filter(([, g]) => g.length).length} group(s).`);
    console.log("Run again with CONFIRM=apply to write.");
    return;
  }

  if (setDemo.length) {
    const r = await prisma.examMaterial.updateMany({ where: { id: { in: setDemo.map((m) => m.id) } }, data: { isDemo: true } });
    console.log(`\nisDemo -> true: ${r.count} row(s)`);
  }
  if (unpublishPlaceholder.length) {
    const r = await prisma.examMaterial.updateMany({ where: { id: { in: unpublishPlaceholder.map((m) => m.id) } }, data: { published: false } });
    console.log(`published -> false (placeholder): ${r.count} row(s)`);
  }
  if (unpublishRickroll.length) {
    const r = await prisma.examMaterial.updateMany({ where: { id: { in: unpublishRickroll.map((m) => m.id) } }, data: { published: false } });
    console.log(`published -> false (rickroll): ${r.count} row(s)`);
  }
  console.log("\nDone. Verify with: node scripts/report-demo-flags.mjs");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
