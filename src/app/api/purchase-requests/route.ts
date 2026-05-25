import type { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { PurchaseRequestStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { error, paginated, success } from "@/lib/api-response";
import {
  generateRequestNumber,
  getClientIp,
  parseJsonBody,
  parseSearchParams,
  resolveParams,
} from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import {
  createPurchaseRequestSchema,
  listPurchaseRequestsSchema,
  updatePurchaseRequestSchema,
} from "@/lib/validations/purchase-requests";
import { logActivity, logAudit } from "@/lib/services/audit.service";

export const GET = withPermission(
  PERMISSIONS.PURCHASE_READ,
  async (request) => {
    const parsed = parseSearchParams(request, listPurchaseRequestsSchema);
    if (!parsed.success) return parsed.response;

    const { page, limit, search, sortOrder, status, requestedById, vendorId } =
      parsed.data;
    const skip = (page - 1) * limit;

    const where: Prisma.PurchaseRequestWhereInput = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(requestedById ? { requestedById } : {}),
      ...(vendorId ? { vendorId } : {}),
      ...(search
        ? { requestNumber: { contains: search, mode: "insensitive" } }
        : {}),
    };

    const [requests, total] = await Promise.all([
      prisma.purchaseRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: sortOrder },
        include: {
          requestedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          vendor: { select: { id: true, name: true, code: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.purchaseRequest.count({ where }),
    ]);

    return paginated(requests, { page, limit, total });
  },
);

export const POST = withPermission(
  PERMISSIONS.PURCHASE_WRITE,
  async (request: NextRequest, { user }) => {
    const parsed = await parseJsonBody(request, createPurchaseRequestSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const { items, vendorId, budgetCode, remarks } = parsed.data;

    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    const purchaseRequest = await prisma.purchaseRequest.create({
      data: {
        requestNumber: generateRequestNumber("PR"),
        requestedById: user.id,
        vendorId,
        budgetCode,
        remarks,
        totalAmount,
        status: PurchaseRequestStatus.PENDING,
        items: { create: items },
      },
      include: {
        items: true,
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        vendor: true,
      },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      tableName: "purchase_requests",
      recordId: purchaseRequest.id,
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "CREATE_PURCHASE_REQUEST",
      module: "purchase_requests",
      entityType: "PurchaseRequest",
      entityId: purchaseRequest.id,
      ipAddress: ip,
    });

    return success(purchaseRequest, {
      message: "Purchase request created",
      status: 201,
    });
  },
);
