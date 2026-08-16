import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.post.updateMany({
    where: { category: "FARMERS" },
    data: { category: "ANIMAL_OWNER" },
  });
  console.log(`Updated ${result.count} post(s) from FARMERS -> ANIMAL_OWNER`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
