import type { NextRequest } from "next/server";
import { ReprintRequestStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { error, success } from "@/lib/api-response";
import { getClientIp, parseJsonBody, resolveParams } from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { updateReprintRequestSchema } from "@/lib/validations/documents";
import { logActivity, logAudit } from "@/lib/services/audit.service";

export const PATCH = withPermission(
  PERMISSIONS.DOCUMENTS_WRITE,
  async (request: NextRequest, { user, params }) => {
    const { id } = await resolveParams(params);
    const parsed = await parseJsonBody(request, updateReprintRequestSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const existing = await prisma.reprintRequest.findUnique({ where: { id } });

    if (!existing) {
      return error("Reprint request not found", { code: "NOT_FOUND", status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const requestRecord = await tx.reprintRequest.update({
        where: { id },
        data: {
          status: parsed.data.status,
          remarks: parsed.data.remarks ?? existing.remarks,
          approvedById:
            parsed.data.status === ReprintRequestStatus.APPROVED ||
            parsed.data.status === ReprintRequestStatus.COMPLETED
              ? user.id
              : existing.approvedById,
          approvedAt:
            parsed.data.status === ReprintRequestStatus.APPROVED
              ? new Date()
              : existing.approvedAt,
        },
        include: { document: true },
      });

      if (parsed.data.status === ReprintRequestStatus.COMPLETED) {
        await tx.documentInventory.update({
          where: { id: existing.documentId },
          data: {
            quantity: { increment: existing.quantity },
            lastReprintDate: new Date(),
          },
        });
      }

      return requestRecord;
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      tableName: "reprint_requests",
      recordId: id,
      newValues: { status: parsed.data.status },
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "UPDATE_REPRINT_REQUEST",
      module: "documents",
      entityType: "ReprintRequest",
      entityId: id,
      ipAddress: ip,
    });

    return success(updated, { message: "Reprint request updated" });
  },
);
