import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js loads .env.local automatically; Prisma CLI does not — load it here
config({ path: ".env" });
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DIRECT_URL (port 5432) for migrations; DATABASE_URL for everything else
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
