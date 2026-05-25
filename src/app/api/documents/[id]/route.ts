import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { error, success } from "@/lib/api-response";
import { getClientIp, parseJsonBody, resolveParams } from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { updateDocumentSchema } from "@/lib/validations/documents";
import { logAudit } from "@/lib/services/audit.service";

export const PATCH = withPermission(
  PERMISSIONS.DOCUMENTS_WRITE,
  async (request: NextRequest, { user, params }) => {
    const { id } = await resolveParams(params);
    const parsed = await parseJsonBody(request, updateDocumentSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const existing = await prisma.documentInventory.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return error("Document not found", { code: "NOT_FOUND", status: 404 });
    }

    const document = await prisma.documentInventory.update({
      where: { id },
      data: parsed.data,
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      tableName: "document_inventory",
      recordId: id,
      ipAddress: ip,
    });

    return success(document, { message: "Document updated" });
  },
);

export const DELETE = withPermission(
  PERMISSIONS.DOCUMENTS_WRITE,
  async (request, { user, params }) => {
    const { id } = await resolveParams(params);
    const ip = getClientIp(request);

    const existing = await prisma.documentInventory.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return error("Document not found", { code: "NOT_FOUND", status: 404 });
    }

    await prisma.documentInventory.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await logAudit({
      userId: user.id,
      action: "SOFT_DELETE",
      tableName: "document_inventory",
      recordId: id,
      ipAddress: ip,
    });

    return success({ deleted: true }, { message: "Document deleted" });
  },
);
