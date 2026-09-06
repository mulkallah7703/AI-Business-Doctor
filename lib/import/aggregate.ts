import { normalizeHeader } from "./kinds";
import type { MappedRow } from "./validate";

export type ExpenseBucket = "expenses" | "cogs" | "adSpend";

export function normalizeEmail(value: unknown): string | null {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text || !text.includes("@")) return null;
  return text;
}

export function normalizePhone(value: unknown): string | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const digits = text.replace(/[^\d+]/g, "");
  return digits.length >= 6 ? digits : null;
}

export function asUtilization(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const number = Number(value);
  if (!Number.isFinite(number)) return undefined;
  if (number > 1 && number <= 100) return number / 100;
  return number;
}

export function bucketExpenseCategory(category: unknown): ExpenseBucket {
  const key = normalizeHeader(String(category ?? ""));
  if (!key) return "expenses";
  if (
    /(^|_)(cogs|cog|cost_of_goods|تكلفة_البضاعه|تكلفه_البضاعه|بضاعه)(_|$)/.test(`_${key}_`) ||
    key.includes("cogs") ||
    key.includes("تكلفة_البضاع") ||
    key.includes("تكلفه_البضاع")
  ) {
    return "cogs";
  }
  if (
    key.includes("ad") ||
    key.includes("ads") ||
    key.includes("marketing") ||
    key.includes("اعلان") ||
    key.includes("اعلانات") ||
    key.includes("تسويق")
  ) {
    return "adSpend";
  }
  return "expenses";
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function groupSalesByDate(rows: MappedRow[]) {
  const groups = new Map<string, { date: Date; revenue: number; orders: number; sessions: number; conversions: number; refunds: number; cogs?: number }>();
  for (const row of rows) {
    const date = row.date as Date;
    const key = dayKey(date);
    const current = groups.get(key) ?? {
      date,
      revenue: 0,
      orders: 0,
      sessions: 0,
      conversions: 0,
      refunds: 0,
      cogs: undefined as number | undefined,
    };
    current.revenue += Number(row.revenue ?? 0);
    current.orders += Math.round(Number(row.orders ?? 0));
    current.sessions += Math.round(Number(row.sessions ?? 0));
    current.conversions += Math.round(Number(row.conversions ?? row.orders ?? 0));
    current.refunds += Number(row.refunds ?? 0);
    if (row.cogs != null) {
      current.cogs = (current.cogs ?? 0) + Number(row.cogs);
    }
    groups.set(key, current);
  }
  return [...groups.values()];
}

export function groupExpensesByDate(rows: MappedRow[]) {
  const groups = new Map<
    string,
    { date: Date; expenses: number; cogs?: number; adSpend?: number; cashOut?: number }
  >();

  for (const row of rows) {
    const date = row.date as Date;
    const key = dayKey(date);
    const current = groups.get(key) ?? { date, expenses: 0 };
    const amount = Number(row.amount ?? 0);
    const explicitCogs = row.cogs == null ? null : Number(row.cogs);
    const explicitAds = row.adSpend == null ? null : Number(row.adSpend);
    const bucket = bucketExpenseCategory(row.category);

    if (explicitCogs != null) {
      current.cogs = (current.cogs ?? 0) + explicitCogs;
    }
    if (explicitAds != null) {
      current.adSpend = (current.adSpend ?? 0) + explicitAds;
    }

    if (row.category) {
      if (bucket === "cogs") current.cogs = (current.cogs ?? 0) + amount;
      else if (bucket === "adSpend") current.adSpend = (current.adSpend ?? 0) + amount;
      else current.expenses += amount;
    } else {
      current.expenses += amount;
    }

    if (row.cashOut != null) {
      current.cashOut = (current.cashOut ?? 0) + Number(row.cashOut);
    }
    groups.set(key, current);
  }

  return [...groups.values()].map((row) => ({
    ...row,
    cashOut: row.cashOut ?? row.expenses + (row.cogs ?? 0) + (row.adSpend ?? 0),
  }));
}

export function groupOpsByDate(rows: MappedRow[]) {
  const groups = new Map<
    string,
    { date: Date; headcount?: number; payroll?: number; utilization?: number; fulfillmentHours?: number }
  >();
  for (const row of rows) {
    const date = row.date as Date;
    const key = dayKey(date);
    const current = groups.get(key) ?? { date };
    if (row.headcount != null) current.headcount = Math.round(Number(row.headcount));
    if (row.payroll != null) current.payroll = (current.payroll ?? 0) + Number(row.payroll);
    const utilization = asUtilization(row.utilization);
    if (utilization != null) current.utilization = utilization;
    if (row.fulfillmentHours != null) {
      current.fulfillmentHours = Number(row.fulfillmentHours);
    } else if (row.overtimeHours != null) {
      current.fulfillmentHours = 18 + Number(row.overtimeHours) / 8;
    }
    groups.set(key, current);
  }
  return [...groups.values()];
}
