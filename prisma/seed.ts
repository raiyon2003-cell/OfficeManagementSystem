import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: true });
import { PrismaClient, RoleName } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const PERMISSIONS = [
  { name: "users:read", module: "users", action: "read", description: "View users" },
  { name: "users:write", module: "users", action: "write", description: "Create and update users" },
  { name: "users:delete", module: "users", action: "delete", description: "Delete users" },
  { name: "employees:read", module: "employees", action: "read", description: "View employees" },
  { name: "employees:write", module: "employees", action: "write", description: "Manage employees" },
  { name: "attendance:read", module: "attendance", action: "read", description: "View attendance" },
  { name: "attendance:write", module: "attendance", action: "write", description: "Manage attendance" },
  { name: "leaves:read", module: "leaves", action: "read", description: "View leave requests" },
  { name: "leaves:write", module: "leaves", action: "write", description: "Submit leave requests" },
  { name: "leaves:approve", module: "leaves", action: "approve", description: "Approve leave requests" },
  { name: "payroll:read", module: "payroll", action: "read", description: "View payroll" },
  { name: "payroll:write", module: "payroll", action: "write", description: "Manage payroll" },
  { name: "documents:read", module: "documents", action: "read", description: "View documents" },
  { name: "documents:write", module: "documents", action: "write", description: "Manage documents" },
  { name: "reports:read", module: "reports", action: "read", description: "View reports" },
  { name: "settings:read", module: "settings", action: "read", description: "View settings" },
  { name: "settings:write", module: "settings", action: "write", description: "Manage settings" },
  { name: "audit:read", module: "audit", action: "read", description: "View audit logs" },
  { name: "notifications:read", module: "notifications", action: "read", description: "View notifications" },
  { name: "notifications:write", module: "notifications", action: "write", description: "Manage notifications" },
  { name: "visitors:read", module: "visitors", action: "read", description: "View visitors" },
  { name: "visitors:write", module: "visitors", action: "write", description: "Manage visitors" },
  { name: "visitors:approve", module: "visitors", action: "approve", description: "Approve visitors" },
  { name: "meeting_rooms:read", module: "meeting_rooms", action: "read", description: "View meeting rooms" },
  { name: "meeting_rooms:write", module: "meeting_rooms", action: "write", description: "Manage meeting rooms" },
  { name: "bookings:read", module: "bookings", action: "read", description: "View bookings" },
  { name: "bookings:write", module: "bookings", action: "write", description: "Manage bookings" },
  { name: "bookings:approve", module: "bookings", action: "approve", description: "Approve bookings" },
  { name: "inventory:read", module: "inventory", action: "read", description: "View inventory" },
  { name: "inventory:write", module: "inventory", action: "write", description: "Manage inventory" },
  { name: "stationery:read", module: "stationery", action: "read", description: "View stationery" },
  { name: "stationery:write", module: "stationery", action: "write", description: "Manage stationery" },
  { name: "vendors:read", module: "vendors", action: "read", description: "View vendors" },
  { name: "vendors:write", module: "vendors", action: "write", description: "Manage vendors" },
  { name: "purchase:read", module: "purchase", action: "read", description: "View purchase requests" },
  { name: "purchase:write", module: "purchase", action: "write", description: "Create purchase requests" },
  { name: "purchase:approve", module: "purchase", action: "approve", description: "Approve purchase requests" },
  { name: "expenses:read", module: "expenses", action: "read", description: "View expenses" },
  { name: "expenses:write", module: "expenses", action: "write", description: "Manage expenses" },
  { name: "dashboard:read", module: "dashboard", action: "read", description: "View dashboard" },
  { name: "activity:read", module: "activity", action: "read", description: "View activity logs" },
] as const;

const ROLES: Array<{
  name: RoleName;
  description: string;
  permissions: string[];
}> = [
  {
    name: RoleName.SUPER_ADMIN,
    description: "Full system access with all permissions",
    permissions: PERMISSIONS.map((p) => p.name),
  },
  {
    name: RoleName.OFFICE_ADMIN,
    description: "Office administrator with management capabilities",
    permissions: [
      "users:read", "users:write", "users:delete",
      "employees:read", "employees:write",
      "attendance:read", "attendance:write",
      "leaves:read", "leaves:write", "leaves:approve",
      "payroll:read", "documents:read", "documents:write",
      "reports:read", "settings:read", "settings:write",
      "audit:read", "notifications:read", "notifications:write",
      "meeting_rooms:read", "meeting_rooms:write",
      "vendors:read", "vendors:write", "activity:read",
      "visitors:read", "visitors:write", "visitors:approve",
      "bookings:read", "bookings:write", "bookings:approve",
      "inventory:read", "inventory:write",
      "stationery:read", "stationery:write",
      "purchase:read", "purchase:write", "purchase:approve",
      "expenses:read", "expenses:write", "dashboard:read",
    ],
  },
  {
    name: RoleName.MANAGEMENT,
    description: "Management role with approval workflows",
    permissions: [
      "employees:read", "attendance:read", "attendance:write",
      "leaves:read", "leaves:approve", "documents:read",
      "reports:read", "notifications:read",
      "visitors:read", "visitors:write", "visitors:approve",
      "meeting_rooms:read", "bookings:read", "bookings:write", "bookings:approve",
      "inventory:read", "stationery:read", "vendors:read",
      "purchase:read", "purchase:write", "purchase:approve",
      "expenses:read", "dashboard:read",
    ],
  },
  {
    name: RoleName.EMPLOYEE,
    description: "Standard employee access",
    permissions: [
      "attendance:read", "leaves:read", "leaves:write",
      "documents:read", "notifications:read",
      "visitors:read", "visitors:write",
      "meeting_rooms:read", "bookings:read", "bookings:write",
      "stationery:read", "purchase:read", "purchase:write",
      "dashboard:read",
    ],
  },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Seeding roles and permissions (no users)...");

  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {
        module: permission.module,
        action: permission.action,
        description: permission.description,
      },
      create: permission,
    });
  }

  const allPermissions = await prisma.permission.findMany();
  const permissionMap = new Map(allPermissions.map((p) => [p.name, p.id]));

  for (const roleDef of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: {
        description: roleDef.description,
        isSystem: true,
      },
      create: {
        name: roleDef.name,
        description: roleDef.description,
        isSystem: true,
      },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

    const permissionIds = roleDef.permissions
      .map((name) => permissionMap.get(name))
      .filter((id): id is string => Boolean(id));

    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: role.id,
          permissionId,
        })),
        skipDuplicates: true,
      });
    }

    console.log(`  ✓ Role ${roleDef.name} (${permissionIds.length} permissions)`);
  }

  console.log("Seed completed. Create users manually via scripts/create-admin.ts");
  await prisma.$disconnect();
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
