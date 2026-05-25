import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { ReportType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { error } from "@/lib/api-response";
import { parseSearchParams } from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { exportReportSchema } from "@/lib/validations/reports";

function serializeRow(row: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === null || value === undefined) {
      result[key] = "";
    } else if (typeof value === "object") {
      result[key] = JSON.stringify(value);
    } else {
      result[key] = String(value);
    }
  }
  return result;
}

async function fetchExportData(type: ReportType) {
  switch (type) {
    case ReportType.VISITOR:
      return prisma.visitor.findMany({ take: 1000, orderBy: { createdAt: "desc" } });
    case ReportType.BOOKING:
      return prisma.roomBooking.findMany({
        where: { deletedAt: null },
        take: 1000,
        orderBy: { date: "desc" },
      });
    case ReportType.INVENTORY:
      return prisma.inventoryItem.findMany({
        where: { deletedAt: null },
        take: 1000,
      });
    case ReportType.EXPENSE:
      return prisma.officeExpense.findMany({ take: 1000, orderBy: { expenseDate: "desc" } });
    default:
      return [];
  }
}

export const GET = withPermission(
  PERMISSIONS.REPORTS_READ,
  async (request: NextRequest) => {
    const parsed = parseSearchParams(request, exportReportSchema);
    if (!parsed.success) return parsed.response;

    const { type, format } = parsed.data;
    const rawData = await fetchExportData(type);
    const rows = rawData.map((item) =>
      serializeRow(item as unknown as Record<string, unknown>),
    );

    if (rows.length === 0) {
      return error("No data to export", { code: "NO_DATA", status: 404 });
    }

    const filename = `${type.toLowerCase()}-report-${Date.now()}`;

    if (format === "csv") {
      const headers = Object.keys(rows[0]);
      const csv = [
        headers.join(","),
        ...rows.map((row) =>
          headers.map((h) => `"${(row[h] ?? "").replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    }

    if (format === "excel") {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        },
      });
    }

    const doc = new jsPDF();
    const headers = Object.keys(rows[0]);
    autoTable(doc, {
      head: [headers],
      body: rows.map((row) => headers.map((h) => row[h] ?? "")),
      styles: { fontSize: 8 },
    });
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      },
    });
  },
);
