// One-shot seed (2026-09-24): DVP diploma mirrors AHDP pricing.
// Per-year families at 1499 lifetime anchor -> 749 / 1119 / 1349.
// Idempotent (upsert base, createMany skipDuplicates for variants).
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

const bases = [
  { slug: "dvp-year-1st-year", name: "DVP – 1st Year", year: "1st Year", price: 1499 },
  { slug: "dvp-year-2nd-year", name: "DVP – 2nd Year", year: "2nd Year", price: 1499 },
];

const maxOrder = await prisma.plan.aggregate({ _max: { sortOrder: true } });
let order = (maxOrder._max.sortOrder ?? 0) + 1;

for (const b of bases) {
  await prisma.plan.upsert({
    where: { slug: b.slug },
    update: { price: b.price, validityDays: null },
    create: {
      slug: b.slug,
      name: b.name,
      type: "COURSE",
      price: b.price,
      description: `${b.name} subjects bundle. Validity: lifetime.`,
      programmeSlug: "dvp",
      year: b.year,
      validityDays: null,
      sortOrder: order++,
    },
  });
  const rows = TIERS.map((t) => ({
    slug: `${b.slug}${t.suffix}`,
    name: `${b.name} (${t.label})`,
    type: "COURSE",
    price: snap9(b.price * t.ratio),
    description: `${b.name} subjects bundle. Validity: ${t.label.toLowerCase()}. Renews by repurchase.`,
    programmeSlug: "dvp",
    year: b.year,
    validityDays: t.days,
    sortOrder: order++,
  }));
  const r = await prisma.plan.createMany({ data: rows, skipDuplicates: true });
  console.log(`${b.slug}: base upserted, ${r.count} variants newly created`);
}
await prisma.$disconnect();
