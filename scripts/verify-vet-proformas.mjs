import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const rows = await prisma.vetProforma.findMany({
  where: { published: true },
  orderBy: [{ order: "asc" }],
});
let bad = 0;
for (const r of rows) {
  for (const u of [r.wordUrl, r.pdfUrl]) {
    if (!u) continue;
    const ok = u.startsWith("/") ? existsSync(join(root, "public", u)) : true;
    console.log(`${ok ? "OK  " : "MISS"} [${r.type}] ${r.title} -> ${u}`);
    if (!ok) bad++;
  }
}
console.log(`ROWS=${rows.length} MISSING_FILES=${bad}`);
await prisma.$disconnect();
if (rows.length !== 9 || bad !== 0) process.exit(1);
