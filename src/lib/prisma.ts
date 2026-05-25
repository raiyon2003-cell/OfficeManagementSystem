import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPrismaClient(): PrismaClient {
  if (process.env.PRISMA_ACCELERATE_URL) {
    return new PrismaClient({
      accelerateUrl: process.env.PRISMA_ACCELERATE_URL,
    });
  }

  // Local dev: direct connection is more reliable with Supabase.
  // Production (Vercel): use pooled DATABASE_URL (port 6543).
  const connectionString =
    process.env.NODE_ENV === "development" && process.env.DIRECT_URL
      ? process.env.DIRECT_URL
      : process.env.DATABASE_URL ?? process.env.DIRECT_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL or DIRECT_URL environment variable is not set");
  }

  const pool =
    globalForPrisma.pool ??
    new Pool({
      connectionString,
      ssl: connectionString.includes("supabase.co")
        ? { rejectUnauthorized: false }
        : undefined,
    });
  const adapter = new PrismaPg(pool);

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool;
  }

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
