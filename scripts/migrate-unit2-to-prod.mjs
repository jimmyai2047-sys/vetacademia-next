// One-way, append-only copy of VMC 501 Unit II lectures (3 sections +
// overview index) from the LOCAL Neon DB into the PRODUCTION database.
// NEVER touches users, payments, enrollments or any other data.
// Usage: $env:PROD_DATABASE_URL="<prod connection string>"; node scripts/migrate-unit2-to-prod.mjs [--dry-run]
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const DRY_RUN = process.argv.includes("--dry-run");
const TARGET = process.env.PROD_DATABASE_URL;
if (!TARGET) {
  console.error("Set PROD_DATABASE_URL first. Aborting (nothing changed).");
  process.exit(1);
}

const UNIT2_TITLES = [
  "Bacterial Genetics and Bacterial Variation",
  "Horizontal Genetic Transfer Mechanisms: Transformation, Transduction and Conjugation",
  "Plasmids, Transposons and Drug Resistance",
];

async function findVMC501(prisma, label) {
  const prog = await prisma.programme.findFirst({ where: { name: { contains: "M.V.Sc" } } });
  if (!prog) throw new Error(`[${label}] M.V.Sc programme not found`);
  const subj = await prisma.subject.findFirst({ where: { programmeId: prog.id, name: { contains: "Microbiology" } } });
  if (!subj) throw new Error(`[${label}] Microbiology subject not found`);
  const ch = await prisma.chapter.findFirst({
    where: { subjectId: subj.id, courseCode: { contains: "VMC 501" } },
    include: { sections: { orderBy: { order: "asc" } } },
  });
  if (!ch) throw new Error(`[${label}] VMC 501 chapter not found`);
  console.log(`[${label}] VMC 501 "${ch.title}" — ${ch.sections.length} sections`);
  return ch;
}

const src = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const dst = new PrismaClient({ adapter: new PrismaPg({ connectionString: TARGET }) });

try {
  const sCh = await findVMC501(src, "LOCAL ");
  const tCh = await findVMC501(dst, "LIVE  ");

  const srcUnits = sCh.sections.filter(s => UNIT2_TITLES.includes(s.title));
  console.log(`LOCAL Unit II sections found: ${srcUnits.length}`);
  const haveTitles = new Set(tCh.sections.map(s => s.title));
  const missing = srcUnits.filter(s => !haveTitles.has(s.title));
  console.log(`LIVE already has: ${srcUnits.length - missing.length}, missing: ${missing.length}`);

  // Safety report: live users/payments exist — we only append sections.
  const liveUsers = await dst.user.count();
  const livePayments = await dst.payment.count();
  console.log(`LIVE users: ${liveUsers}, payments: ${livePayments} (untouched by this script)`);

  if (DRY_RUN) { console.log("DRY RUN — nothing written."); return; }
  if (missing.length === 0) { console.log("Nothing to copy — LIVE already complete."); return; }

  const nextOrder = tCh.sections.length ? Math.max(...tCh.sections.map(s => s.order)) + 1 : 0;
  for (let i = 0; i < missing.length; i++) {
    const s = missing[i];
    await dst.chapterSection.create({
      data: { chapterId: tCh.id, title: s.title, content: s.content, order: nextOrder + i },
    });
    console.log(`  copied [${nextOrder + i}] ${s.title.slice(0, 60)}`);
  }

  // Overview index on LIVE
  const live = await dst.chapter.findUnique({ where: { id: tCh.id }, select: { content: true, description: true, tags: true } });
  if (!live.content.includes("Unit II — Lectures")) {
    let overview = live.content;
    overview = overview.split("Units II and III with the practical manual follow as companion sections.").join("Unit III with the practical manual follows as the next companion section.");
    overview += `<h2>Unit II — Lectures (Bacterial Genetics)</h2><ol>` +
      missing.map(s => `<li>${s.title}</li>`).join("") +
      `</ol><p>Open each lecture in the Reader for full text, tables and figures.</p>`;
    await dst.chapter.update({
      where: { id: tCh.id },
      data: {
        content: overview,
        description: "VMC 501 Units I & II: Foundations of Bacteriology and Bacterial Genetics — History, Taxonomy, Microscopy, Cell Structure, Growth, Diagnosis, Genome, Gene Transfer, Plasmids and Drug Resistance (12 lectures with figures and tables).",
        tags: ["VMC501", "General Bacteriology", "Unit I", "Unit II", "Bacterial Genetics", "M.V.Sc", "Veterinary Microbiology"],
      },
    });
    console.log("  LIVE overview + description updated");
  } else {
    console.log("  LIVE overview already lists Unit II — skipped");
  }

  const verify = await dst.chapterSection.count({ where: { chapterId: tCh.id } });
  console.log(`VERIFY LIVE VMC 501 sections: ${verify}`);
} finally {
  await src.$disconnect();
  await dst.$disconnect();
}
console.log("Done!");
