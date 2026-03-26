import { clsx, type ClassValue } from "clsx";
import { timestamp } from "drizzle-orm/pg-core";
import { twMerge } from "tailwind-merge";

import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const timestamps = {
  updatedAt: timestamp("updated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
};

/**
 * Exports an array of objects to an Excel file
 * @param data The array of objects to export
 * @param fileName The name of the file to be downloaded (without extension)
 * @param sheetName Optional name for the worksheet (defaults to "Sheet1")
 */
export async function exportToExcel<T extends Record<string, string | number>>(
  data: T[],
  fileName: string,
  sheetName: string = "Sheet1"
): Promise<void> {
  // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  if (data.length === 0) {
    throw new Error("No data to export");
  }

  // Extract column headers from the first object
  const headers = Object.keys(data[0]);

  // Add headers to the worksheet
  worksheet.addRow(headers);

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };
    cell.border = {
      bottom: { style: "thin" },
    };
  });

  // Add data rows
  data.forEach((item) => {
    const rowData = headers.map((header) => item[header] ?? "");
    worksheet.addRow(rowData);
  });

  // Auto-size columns
  worksheet.columns.forEach((column) => {
    if (column && typeof column.eachCell !== "undefined") {
      // Add this check to handle potentially undefined columns
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(maxLength + 2, 50);
    }
  });

  // Generate the Excel file
  const buffer = await workbook.xlsx.writeBuffer();

  // Convert buffer to Blob and save file
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // Trigger download
  saveAs(blob, `${fileName}.xlsx`);
}
