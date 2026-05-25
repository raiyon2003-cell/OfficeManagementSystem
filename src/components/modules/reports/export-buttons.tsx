"use client";

import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ReportFilters } from "@/lib/api/reports";
import { exportReport } from "@/lib/api/reports";
import { toast } from "sonner";

interface ExportButtonsProps {
  filters: ReportFilters;
  disabled?: boolean;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButtons({ filters, disabled }: ExportButtonsProps) {
  const handleExport = async (format: "pdf" | "excel") => {
    try {
      const blob = await exportReport(filters, format);
      const ext = format === "pdf" ? "pdf" : "xlsx";
      downloadBlob(blob, `report-${filters.type.toLowerCase()}.${ext}`);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        disabled={disabled}
        onClick={() => handleExport("pdf")}
      >
        {disabled ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        Export PDF
      </Button>
      <Button
        variant="outline"
        disabled={disabled}
        onClick={() => handleExport("excel")}
      >
        {disabled ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="mr-2 h-4 w-4" />
        )}
        Export Excel
      </Button>
    </div>
  );
}
