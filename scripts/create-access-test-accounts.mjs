// Creates three dedicated access-test accounts (run by the operator; NOT run by CI):
//   1. unpaid student        — no payments at all
//   2. paid + active access  — Payment PAID, method TEST, expiresAt null/future
//   3. paid + expired access — Payment PAID, method TEST, expiresAt in the past
//
// method = "TEST" so admin payment dashboards exclude these from live revenue
// (see src/app/api/admin/payments/route.ts liveClause), while getAccess()
// still treats them as paid (activeAccessFilter only looks at expiresAt).
//
// Idempotent: existing accounts with these emails are left untouched.
// Usage:
//   node --env-file=.env scripts/create-access-test-accounts.mjs            # dry run
//   CONFIRM=apply node --env-file=.env scripts/create-access-test-accounts.mjs
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const APPLY = process.env.CONFIRM === "apply";

const ACCOUNTS = [
  {
    key: "unpaid",
    email: "access-test-unpaid@vetacademia.in",
    name: "VA Test Unpaid",
    password: "VATestUnpaid_2026",
    payment: null,
  },
  {
    key: "paid-active",
    email: "access-test-paid-active@vetacademia.in",
    name: "VA Test Paid Active",
    password: "VATestActive_2026",
    payment: "active",
  },
  {
    key: "paid-expired",
    email: "access-test-paid-expired@vetacademia.in",
    name: "VA Test Paid Expired",
    password: "VATestExpired_2026",
    payment: "expired",
  },
];

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Prefer a full-programme COURSE plan (no year/subject scoping) so the test
// account unlocks whole-programme content, not just one year.
const plan = await prisma.plan.findFirst({
  where: { type: "COURSE", programmeSlug: { not: null }, year: null, subjectId: null },
  orderBy: [{ isListed: "desc" }, { sortOrder: "asc" }],
});
if (!plan) {
  console.error("No COURSE plan with programmeSlug found — cannot create paid test access.");
  await prisma.$disconnect();
  process.exit(1);
}
console.log(`Plan for paid accounts: ${plan.slug} (${plan.name}, Rs.${plan.price}, validity ${plan.validityDays ?? "lifetime"} days)`);

if (!APPLY) {
  console.log("\nDRY RUN — nothing written. Accounts that would be ensured:");
  for (const a of ACCOUNTS) {
    console.log(`  - ${a.email} (${a.key}) payment=${a.payment ?? "none"}`);
  }
  console.log("\nRe-run with CONFIRM=apply to write to the database.");
  await prisma.$disconnect();
  process.exit(0);
}

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;

for (const a of ACCOUNTS) {
  const existing = await prisma.user.findFirst({
    where: { email: { equals: a.email, mode: "insensitive" } },
    include: { payments: { where: { status: "PAID" } } },
  });

  if (existing) {
    const paid = existing.payments.length;
    console.log(`SKIP  ${a.email} already exists (${paid} PAID payment(s)) — left untouched.`);
    continue;
  }

  const hashed = await bcrypt.hash(a.password, 12);
  const user = await prisma.user.create({
    data: {
      name: a.name,
      email: a.email,
      password: hashed,
      role: "STUDENT",
      programme: "BVSC",
      year: "1st Year",
      emailVerified: true,
    },
  });
  console.log(`USER  created ${a.email} id=${user.id}`);

  if (a.payment) {
    const expiresAt =
      a.payment === "expired"
        ? new Date(now - 7 * DAY)
        : plan.validityDays
          ? new Date(now + plan.validityDays * DAY)
          : null; // lifetime plan → active forever
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount: plan.price,
        status: "PAID",
        method: "TEST",
        planSlug: plan.slug,
        expiresAt,
      },
    });
    console.log(
      `PAY   created ${a.payment} payment id=${payment.id} plan=${plan.slug} expiresAt=${expiresAt?.toISOString() ?? "null (lifetime)"}`,
    );
  }
}

console.log("\nDone. Credentials (change after first login):");
for (const a of ACCOUNTS) console.log(`  ${a.email}  /  ${a.password}`);
await prisma.$disconnect();
