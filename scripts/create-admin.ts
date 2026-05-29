#!/usr/bin/env npx tsx
/**
 * Create the first admin user manually.
 * Usage: npx tsx scripts/create-admin.ts --email admin@company.com --password "SecurePass123!" --firstName Admin --lastName User
 */
import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: true });
import bcrypt from "bcryptjs";
import { PrismaClient, RoleName } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, "");
    const value = args[i + 1];
    if (key && value) parsed[key] = value;
  }

  return parsed;
}

async function main() {
  const { email, password, firstName, lastName, role = "SUPER_ADMIN" } =
    parseArgs();

  if (!email || !password || !firstName || !lastName) {
    console.error(
      "Usage: npx tsx scripts/create-admin.ts --email <email> --password <password> --firstName <name> --lastName <name> [--role SUPER_ADMIN|OFFICE_ADMIN|EMPLOYEE|MANAGEMENT]",
    );
    process.exit(1);
  }

  const roleName = role.toUpperCase() as RoleName;
  if (!Object.values(RoleName).includes(roleName)) {
    console.error(`Invalid role: ${role}`);
    process.exit(1);
  }

  const connectionString =
    process.env.DATABASE_URL ?? process.env.DIRECT_URL;
  if (!connectionString) {
    throw new Error("DIRECT_URL or DATABASE_URL is required");
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error(`User with email ${email} already exists`);
    process.exit(1);
  }

  const dbRole = await prisma.role.findUnique({ where: { name: roleName } });
  if (!dbRole) {
    console.error(`Role ${roleName} not found. Run: npm run db:seed`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      isActive: true,
      roles: {
        create: { roleId: dbRole.id },
      },
    },
  });

  console.log(`Created user: ${user.email} (${roleName})`);
  console.log(`User ID: ${user.id}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
