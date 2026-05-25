import type { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { error, paginated, success } from "@/lib/api-response";
import {
  getClientIp,
  parseJsonBody,
  parseSearchParams,
  resolveParams,
} from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import {
  createReprintRequestSchema,
  listReprintRequestsSchema,
  updateReprintRequestSchema,
} from "@/lib/validations/documents";
import { logActivity, logAudit } from "@/lib/services/audit.service";

export const GET = withPermission(
  PERMISSIONS.DOCUMENTS_READ,
  async (request) => {
    const parsed = parseSearchParams(request, listReprintRequestsSchema);
    if (!parsed.success) return parsed.response;

    const { page, limit, sortOrder, status, documentId } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Prisma.ReprintRequestWhereInput = {
      ...(status ? { status } : {}),
      ...(documentId ? { documentId } : {}),
    };

    const [requests, total] = await Promise.all([
      prisma.reprintRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: sortOrder },
        include: {
          document: { select: { id: true, title: true, documentType: true } },
          requestedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          approvedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.reprintRequest.count({ where }),
    ]);

    return paginated(requests, { page, limit, total });
  },
);

export const POST = withPermission(
  PERMISSIONS.DOCUMENTS_WRITE,
  async (request: NextRequest, { user }) => {
    const parsed = await parseJsonBody(request, createReprintRequestSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const document = await prisma.documentInventory.findFirst({
      where: { id: parsed.data.documentId, deletedAt: null },
    });

    if (!document) {
      return error("Document not found", { code: "NOT_FOUND", status: 404 });
    }

    const reprintRequest = await prisma.reprintRequest.create({
      data: {
        ...parsed.data,
        requestedById: user.id,
      },
      include: {
        document: true,
      },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      tableName: "reprint_requests",
      recordId: reprintRequest.id,
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "CREATE_REPRINT_REQUEST",
      module: "documents",
      entityType: "ReprintRequest",
      entityId: reprintRequest.id,
      ipAddress: ip,
    });

    return success(reprintRequest, {
      message: "Reprint request created",
      status: 201,
    });
  },
);
