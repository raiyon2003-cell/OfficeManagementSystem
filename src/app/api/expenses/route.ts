import type { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { paginated, success } from "@/lib/api-response";
import {
  getClientIp,
  parseJsonBody,
  parseSearchParams,
} from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import {
  createExpenseSchema,
  listExpensesSchema,
} from "@/lib/validations/expenses";
import { logActivity, logAudit } from "@/lib/services/audit.service";

export const GET = withPermission(PERMISSIONS.EXPENSES_READ, async (request) => {
  const parsed = parseSearchParams(request, listExpensesSchema);
  if (!parsed.success) return parsed.response;

  const { page, limit, search, sortOrder, category, vendorId, dateFrom, dateTo } =
    parsed.data;
  const skip = (page - 1) * limit;

  const where: Prisma.OfficeExpenseWhereInput = {
    ...(category ? { category } : {}),
    ...(vendorId ? { vendorId } : {}),
    ...(dateFrom || dateTo
      ? {
          expenseDate: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          },
        }
      : {}),
    ...(search
      ? { description: { contains: search, mode: "insensitive" } }
      : {}),
  };

  const [expenses, total] = await Promise.all([
    prisma.officeExpense.findMany({
      where,
      skip,
      take: limit,
      orderBy: { expenseDate: sortOrder },
      include: {
        vendor: { select: { id: true, name: true, code: true } },
        recordedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    }),
    prisma.officeExpense.count({ where }),
  ]);

  return paginated(expenses, { page, limit, total });
});

export const POST = withPermission(
  PERMISSIONS.EXPENSES_WRITE,
  async (request: NextRequest, { user }) => {
    const parsed = await parseJsonBody(request, createExpenseSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);

    const expense = await prisma.officeExpense.create({
      data: {
        ...parsed.data,
        recordedById: user.id,
      },
      include: {
        vendor: true,
        recordedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      tableName: "office_expenses",
      recordId: expense.id,
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "CREATE_EXPENSE",
      module: "expenses",
      entityType: "OfficeExpense",
      entityId: expense.id,
      ipAddress: ip,
    });

    return success(expense, { message: "Expense recorded", status: 201 });
  },
);
