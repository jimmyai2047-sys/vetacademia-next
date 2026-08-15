import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PROG_NAME = {
  ahdp: "A.H.D.P.",
  bvsc: "B.V.Sc & A.H.",
  mvsc: "M.V.Sc",
  phd: "Ph.D",
};

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const YEAR_PRICE = 799; // default; admin edits per plan
const SUBJECT_PRICE = 299; // default; admin edits per plan

async function main() {
  // YEAR plans for BVSc / AHDP
  for (const prog of ["ahdp", "bvsc"]) {
    const subs = await prisma.subject.findMany({
      where: { programme: { name: prog.toUpperCase() } },
      select: { year: true },
    });
    const years = [...new Set(subs.map((s) => s.year).filter(Boolean))];
    for (const year of years) {
      const slug = `${prog}-year-${slugify(year)}`;
      const existing = await prisma.plan.findUnique({ where: { slug } });
      if (existing) {
        console.log("skip (exists)", slug);
        continue;
      }
      await prisma.plan.create({
        data: {
          slug,
          name: `${PROG_NAME[prog]} – ${year}`,
          type: "COURSE",
          description: `Full access to all ${PROG_NAME[prog]} ${year} subjects, chapters and study material.`,
          price: YEAR_PRICE,
          programmeSlug: prog,
          year,
          sortOrder: 100,
        },
      });
      console.log("created YEAR plan", slug);
    }
  }

  // SUBJECT plans for MVSc / PhD
  for (const prog of ["mvsc", "phd"]) {
    const subs = await prisma.subject.findMany({
      where: { programme: { name: prog.toUpperCase() } },
      select: { id: true, name: true },
    });
    for (const s of subs) {
      const slug = `${prog}-subject-${slugify(s.name)}`;
      const existing = await prisma.plan.findUnique({ where: { slug } });
      if (existing) {
        console.log("skip (exists)", slug);
        continue;
      }
      await prisma.plan.create({
        data: {
          slug,
          name: s.name,
          type: "COURSE",
          description: `Full access to ${s.name} (${PROG_NAME[prog]}) syllabus, chapters and study material.`,
          price: SUBJECT_PRICE,
          programmeSlug: prog,
          subjectId: s.id,
          sortOrder: 200,
        },
      });
      console.log("created SUBJECT plan", slug);
    }
  }

  console.log("DONE");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
