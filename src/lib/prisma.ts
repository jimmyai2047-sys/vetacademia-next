import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || "";
  
  // No database URL - return basic client
  if (!dbUrl) {
    return new PrismaClient();
  }
  
  // SQLite - local development (needs adapter)
  if (dbUrl.startsWith("file:")) {
    return new PrismaClient();
  }
  
  // PostgreSQL - production
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
