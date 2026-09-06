import * as XLSX from "xlsx";
import { utcDay } from "@/lib/utils";

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function parseTabular(buffer: Buffer, fileName: string) {
  const workbook = XLSX.read(buffer, { type: "buffer", raw: false, cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("EMPTY_SHEET");
  }
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | Date | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });
  const headerRow = (matrix[0] ?? []).map((cell) => String(cell ?? "").trim());
  const columns = headerRow.filter(Boolean);
  if (columns.length === 0) {
    throw new Error("NO_COLUMNS");
  }

  const rows = matrix.slice(1).map((line) => {
    const record: Record<string, string> = {};
    headerRow.forEach((column, index) => {
      if (!column) return;
      const cell = line[index];
      record[column] = cell instanceof Date ? cell.toISOString().slice(0, 10) : String(cell ?? "").trim();
    });
    return record;
  }).filter((row) => Object.values(row).some((value) => value !== ""));

  return { columns, rows, fileName };
}

export function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value == null) return null;
  let text = String(value).trim();
  if (!text) return null;
  text = text.replace(/,/g, "").replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)));
  text = text.replace(/[^\d.-]/g, "");
  if (!text || text === "-" || text === ".") return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return utcDay(value);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    return utcDay(new Date(excelEpoch + value * 86400000));
  }
  const text = String(value ?? "").trim();
  if (!text) return null;
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    return utcDay(new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))));
  }
  const dmy = text.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
  if (dmy) {
    return utcDay(new Date(Date.UTC(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]))));
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return utcDay(parsed);
}
