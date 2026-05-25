import { prisma } from "@/lib/prisma";
import { error, success } from "@/lib/api-response";
import { resolveParams } from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";

export const GET = withPermission(
  PERMISSIONS.VISITORS_READ,
  async (_request, { params }) => {
    const { id } = await resolveParams(params);

    const visitor = await prisma.visitor.findUnique({ where: { id } });
    if (!visitor) {
      return error("Visitor not found", { code: "NOT_FOUND", status: 404 });
    }

    const logs = await prisma.visitorLog.findMany({
      where: { visitorId: id },
      orderBy: { createdAt: "desc" },
      include: {
        performedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return success(logs);
  },
);
