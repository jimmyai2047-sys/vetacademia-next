// One-shot seed (2026-09-24): applies the confirmed duration-pricing chart.
// - Updates lifetime anchors on existing plan rows.
// - Creates 6/12/24-month variants at 50%/75%/90% (9-ending rounded).
// - Adds the missing UP Pharmacist exam family.
// Idempotent: safe to re-run (updates overwrite, creates skip duplicates).
import dotenv from "dotenv";
dotenv.config({ path: "D:/VetAcademia (VA)/vetacademia-next/.env" });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const snap9 = (n) => {
  const s = Math.round(n / 10) * 10 - 1;
  return s > 0 ? s : Math.max(1, Math.round(n));
};
const TIERS = [
  { suffix: "-6mo", days: 180, ratio: 0.5, label: "6 months" },
  { suffix: "-12mo", days: 365, ratio: 0.75, label: "12 months or 1 year" },
  { suffix: "-24mo", days: 730, ratio: 0.9, label: "24 months or 2 years" },
];

// ---- Phase A: lifetime anchor updates on existing rows ----
const anchorUpdates = [
  { slug: "veterinary-officer", price: 29999 },
  { slug: "livestock-assistant", price: 15999 },
  { slug: "icar-jrf-srf", price: 1999 },
  { slug: "net", price: 1499 },
  { slug: "ars", price: 1999 },
  { slug: "bvsc-year-1st-year", price: 2499 },
  { slug: "bvsc-year-2nd-year", price: 2499 },
  { slug: "bvsc-year-3rd-year", price: 2499 },
  { slug: "bvsc-year-4th-year", price: 2499 },
  { slug: "ahdp-year-1st-year", price: 1499 },
  { slug: "ahdp-year-2nd-year", price: 1499 },
];

let updated = 0;
for (const u of anchorUpdates) {
  try {
    await prisma.plan.update({
      where: { slug: u.slug },
      data: { price: u.price, validityDays: null },
    });
    updated++;
  } catch {
    console.log(`  !! anchor missing, skipped: ${u.slug}`);
  }
}
// All MVSc/PhD subject rows -> 4999 lifetime.
const subjUpdated = await prisma.plan.updateMany({
  where: { OR: [{ slug: { startsWith: "mvsc-subject-" } }, { slug: { startsWith: "phd-subject-" } }] },
  data: { price: 4999, validityDays: null },
});
console.log(`Anchors updated: ${updated} named + ${subjUpdated.count} subject rows -> lifetime`);

// ---- Phase B: duration variants ----
// Ensure UP Pharmacist base row exists (was missing).
await prisma.plan.upsert({
  where: { slug: "up-pharmacist" },
  update: { price: 15999, validityDays: null },
  create: {
    slug: "up-pharmacist",
    name: "Veterinary Pharmacist (UPSSSC)",
    type: "EXAM",
    price: 15999,
    description: "Targeted preparation for UPSSSC Veterinary Pharmacist recruitment — DVP syllabus + UP GK. Validity: lifetime.",
    examSlug: "up-pharmacist",
    validityDays: null,
    sortOrder: 1000,
  },
});

const examBases = [
  "veterinary-officer",
  "livestock-assistant",
  "up-pharmacist",
  "icar-jrf-srf",
  "ars",
  "net",
];
const yearBases = [
  "bvsc-year-1st-year", "bvsc-year-2nd-year", "bvsc-year-3rd-year", "bvsc-year-4th-year",
  "ahdp-year-1st-year", "ahdp-year-2nd-year",
];
const subjectBases = await prisma.plan.findMany({
  where: { OR: [{ slug: { startsWith: "mvsc-subject-" } }, { slug: { startsWith: "phd-subject-" } }] },
  select: { slug: true },
});
const baseSlugs = [...examBases, ...yearBases, ...subjectBases.map((s) => s.slug)];

const maxOrder = await prisma.plan.aggregate({ _max: { sortOrder: true } });
let order = (maxOrder._max.sortOrder ?? 0) + 1;

const rows = [];
for (const slug of baseSlugs) {
  const base = await prisma.plan.findUnique({ where: { slug } });
  if (!base) {
    console.log(`  !! base missing, skipped: ${slug}`);
    continue;
  }
  for (const t of TIERS) {
    rows.push({
      slug: `${slug}${t.suffix}`,
      name: `${base.name} (${t.label})`,
      type: base.type,
      price: snap9(base.price * t.ratio),
      description: `${base.description ?? base.name} Validity: ${t.label.toLowerCase()}. Renews by repurchase.`,
      programmeSlug: base.programmeSlug,
      examSlug: base.examSlug,
      year: base.year,
      subjectId: base.subjectId,
      validityDays: t.days,
      sortOrder: order++,
    });
  }
}

const created = await prisma.plan.createMany({ data: rows, skipDuplicates: true });
console.log(`Duration variants: ${rows.length} prepared, ${created.count} newly created (rest already existed)`);

// ---- Verify ----
const total = await prisma.plan.count();
console.log(`Total plans now: ${total}`);
const check = ["veterinary-officer-12mo", "bvsc-year-1st-year-6mo", "ahdp-year-2nd-year-24mo", "net-6mo"];
for (const s of check) {
  const p = await prisma.plan.findUnique({ where: { slug: s } });
  console.log(`  ${s}: ${p ? `Rs.${p.price} validity=${p.validityDays ?? "lifetime"}` : "MISSING"}`);
}
await prisma.$disconnect();
