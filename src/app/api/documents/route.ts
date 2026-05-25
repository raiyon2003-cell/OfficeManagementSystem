import type { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { error, paginated, success } from "@/lib/api-response";
import {
  getClientIp,
  parseJsonBody,
  parseSearchParams,
} from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import {
  createDocumentSchema,
  listDocumentsSchema,
  updateDocumentSchema,
} from "@/lib/validations/documents";
import { logActivity, logAudit } from "@/lib/services/audit.service";

export const GET = withPermission(PERMISSIONS.DOCUMENTS_READ, async (request) => {
  const parsed = parseSearchParams(request, listDocumentsSchema);
  if (!parsed.success) return parsed.response;

  const { page, limit, search, sortBy, sortOrder, documentType, lowStock } =
    parsed.data;
  const skip = (page - 1) * limit;

  const where: Prisma.DocumentInventoryWhereInput = {
    deletedAt: null,
    isActive: true,
    ...(documentType ? { documentType } : {}),
    ...(search
      ? { title: { contains: search, mode: "insensitive" } }
      : {}),
  };

  const orderBy: Prisma.DocumentInventoryOrderByWithRelationInput = sortBy
    ? { [sortBy]: sortOrder }
    : { title: "asc" };

  let documents = await prisma.documentInventory.findMany({
    where,
    orderBy,
  });

  if (lowStock) {
    documents = documents.filter((doc) => doc.quantity <= doc.minQuantity);
  }

  const total = documents.length;
  const paginatedDocs = documents.slice(skip, skip + limit);

  return paginated(paginatedDocs, { page, limit, total });
});

export const POST = withPermission(
  PERMISSIONS.DOCUMENTS_WRITE,
  async (request: NextRequest, { user }) => {
    const parsed = await parseJsonBody(request, createDocumentSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const document = await prisma.documentInventory.create({ data: parsed.data });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      tableName: "document_inventory",
      recordId: document.id,
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "CREATE_DOCUMENT",
      module: "documents",
      entityType: "DocumentInventory",
      entityId: document.id,
      ipAddress: ip,
    });

    return success(document, { message: "Document created", status: 201 });
  },
);
