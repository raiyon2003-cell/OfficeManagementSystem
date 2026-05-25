import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api-response";
import { parseSearchParams } from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { expenseSummarySchema } from "@/lib/validations/expenses";

export const GET = withPermission(
  PERMISSIONS.EXPENSES_READ,
  async (request) => {
    const parsed = parseSearchParams(request, expenseSummarySchema);
    if (!parsed.success) return parsed.response;

    const now = new Date();
    const year = parsed.data.year ?? now.getFullYear();
    const month = parsed.data.month ?? now.getMonth() + 1;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const [byCategory, total, count] = await Promise.all([
      prisma.officeExpense.groupBy({
        by: ["category"],
        where: {
          expenseDate: { gte: startDate, lt: endDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.officeExpense.aggregate({
        where: {
          expenseDate: { gte: startDate, lt: endDate },
        },
        _sum: { amount: true },
      }),
      prisma.officeExpense.count({
        where: {
          expenseDate: { gte: startDate, lt: endDate },
        },
      }),
    ]);

    return success({
      period: { year, month, startDate, endDate },
      total: Number(total._sum.amount ?? 0),
      count,
      byCategory: byCategory.map((item) => ({
        category: item.category,
        total: Number(item._sum.amount ?? 0),
        count: item._count,
      })),
    });
  },
);
