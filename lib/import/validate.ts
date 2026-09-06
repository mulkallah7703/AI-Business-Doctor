import type { ImportKind } from "@/lib/connectors";
import { KIND_FIELDS } from "./kinds";
import { parseDate, parseNumber } from "./parse";
import { rowErrorMessage } from "./messages";

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
  "amount",
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
  "salary",
  "utilization",
  "overtimeHours",
  "headcount",
  "payroll",
  "fulfillmentHours",
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
      error: "MISSING_MAPPING" as const,
      missingRequired,
      rows: [] as MappedRow[],
      errors: [] as { row: number; message: string; messageAr: string }[],
    };
  }

  if (rows.length === 0) {
    return {
      ok: false as const,
      error: "EMPTY_FILE" as const,
      missingRequired: [],
      rows: [] as MappedRow[],
      errors: [] as { row: number; message: string; messageAr: string }[],
    };
  }

  const errors: { row: number; message: string; messageAr: string }[] = [];
  const mapped: MappedRow[] = [];

  rows.forEach((row, index) => {
    const next: MappedRow = {};
    let failed = false;
    for (const field of fields) {
      const column = mapping[field.key];
      const raw = column ? row[column] : "";
      if (field.required && !String(raw ?? "").trim()) {
        errors.push({
          row: index + 2,
          message: rowErrorMessage("missing", field.key, "en"),
          messageAr: rowErrorMessage("missing", field.labelAr, "ar"),
        });
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
          errors.push({
            row: index + 2,
            message: rowErrorMessage("date", field.key, "en"),
            messageAr: rowErrorMessage("date", field.labelAr, "ar"),
          });
          failed = true;
          continue;
        }
        next[field.key] = date;
      } else if (NUMBER_FIELDS.has(field.key)) {
        const number = parseNumber(raw);
        if (number == null) {
          if (field.required) {
            errors.push({
              row: index + 2,
              message: rowErrorMessage("number", field.key, "en"),
              messageAr: rowErrorMessage("number", field.labelAr, "ar"),
            });
            failed = true;
          } else {
            next[field.key] = null;
          }
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
      error: "NO_VALID_ROWS" as const,
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
