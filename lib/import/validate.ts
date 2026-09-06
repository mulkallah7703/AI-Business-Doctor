import type { ImportKind } from "@/lib/connectors";
import { KIND_FIELDS } from "./kinds";
import { parseDate, parseNumber } from "./parse";

export type MappedRow = Record<string, string | number | Date | null>;

const DATE_FIELDS = new Set([
  "date",
  "lastOrderAt",
  "createdAt",
  "startDate",
  "endDate",
]);
const NUMBER_FIELDS = new Set([
  "revenue",
  "orders",
  "sessions",
  "conversions",
  "refunds",
  "cogs",
  "expenses",
  "adSpend",
  "cashOut",
  "lifetimeValue",
  "ordersCount",
  "estimatedValue",
  "price",
  "cost",
  "stock",
  "reorderPoint",
  "spend",
  "clicks",
]);

export function applyMapping(
  rows: Record<string, string>[],
  mapping: Record<string, string>,
  kind: ImportKind,
) {
  const fields = KIND_FIELDS[kind];
  const missingRequired = fields
    .filter((field) => field.required && !mapping[field.key])
    .map((field) => field.key);
  if (missingRequired.length) {
    return {
      ok: false as const,
      error: "MISSING_MAPPING",
      missingRequired,
      rows: [] as MappedRow[],
      errors: [] as { row: number; message: string }[],
    };
  }

  const errors: { row: number; message: string }[] = [];
  const mapped: MappedRow[] = [];

  rows.forEach((row, index) => {
    const next: MappedRow = {};
    let failed = false;
    for (const field of fields) {
      const column = mapping[field.key];
      const raw = column ? row[column] : "";
      if (field.required && !String(raw ?? "").trim()) {
        errors.push({ row: index + 2, message: `Missing ${field.key}` });
        failed = true;
        continue;
      }
      if (!String(raw ?? "").trim()) {
        next[field.key] = null;
        continue;
      }
      if (DATE_FIELDS.has(field.key)) {
        const date = parseDate(raw);
        if (!date) {
          errors.push({ row: index + 2, message: `Invalid date for ${field.key}` });
          failed = true;
          continue;
        }
        next[field.key] = date;
      } else if (NUMBER_FIELDS.has(field.key)) {
        const number = parseNumber(raw);
        if (number == null) {
          errors.push({ row: index + 2, message: `Invalid number for ${field.key}` });
          failed = true;
          continue;
        }
        next[field.key] = number;
      } else {
        next[field.key] = String(raw).trim();
      }
    }
    if (!failed) mapped.push(next);
  });

  if (mapped.length === 0) {
    return {
      ok: false as const,
      error: "NO_VALID_ROWS",
      missingRequired: [],
      rows: mapped,
      errors,
    };
  }

  return {
    ok: true as const,
    error: null,
    missingRequired: [],
    rows: mapped,
    errors,
  };
}
