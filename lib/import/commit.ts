import type { Prisma, PrismaClient } from "@prisma/client";
import type { ImportKind } from "@/lib/connectors";
import { prefixedId } from "@/lib/ids";
import { utcDay } from "@/lib/utils";
import {
  asUtilization,
  groupExpensesByDate,
  groupOpsByDate,
  groupSalesByDate,
  normalizeEmail,
  normalizePhone,
} from "./aggregate";
import type { MappedRow } from "./validate";

type Db = PrismaClient | Prisma.TransactionClient;

const METRIC_DEFAULTS = {
  revenue: 0,
  orders: 0,
  expenses: 0,
  cogs: 0,
  cashBalance: 0,
  cashIn: 0,
  cashOut: 0,
  leads: 0,
  conversions: 0,
  sessions: 0,
  adSpend: 0,
  refunds: 0,
  nps: 0,
  fulfillmentHours: 0,
  stockouts: 0,
  headcount: 0,
  payroll: 0,
  utilization: 0,
};

function definedOnly<T extends Record<string, number | undefined>>(patch: T) {
  return Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  ) as Partial<typeof METRIC_DEFAULTS>;
}

async function upsertMetric(
  db: Db,
  organizationId: string,
  date: Date,
  patch: Partial<typeof METRIC_DEFAULTS>,
) {
  const day = utcDay(date);
  const data = definedOnly(patch);
  const existing = await db.dailyMetric.findUnique({
    where: { organizationId_date: { organizationId, date: day } },
  });
  if (existing) {
    return db.dailyMetric.update({
      where: { id: existing.id },
      data,
    });
  }
  return db.dailyMetric.create({
    data: {
      organizationId,
      date: day,
      ...METRIC_DEFAULTS,
      ...data,
    },
  });
}

async function findByContact<T extends { email: string | null; phone: string | null }>(
  rows: T[],
  email: string | null,
  phone: string | null,
) {
  if (email) {
    const match = rows.find((row) => row.email && row.email === email);
    if (match) return match;
  }
  if (phone) {
    return rows.find((row) => row.phone && row.phone === phone) ?? null;
  }
  return null;
}

export async function commitImport(input: {
  db: Db;
  organizationId: string;
  kind: ImportKind;
  rows: MappedRow[];
}) {
  const { db, organizationId, kind, rows } = input;
  let written = 0;

  if (kind === "sales") {
    for (const row of groupSalesByDate(rows)) {
      await upsertMetric(db, organizationId, row.date, {
        revenue: row.revenue,
        orders: row.orders,
        sessions: row.sessions,
        conversions: row.conversions,
        refunds: row.refunds,
        cogs: row.cogs,
        cashIn: row.revenue,
      });
      written += 1;
    }
    return written;
  }

  if (kind === "expenses") {
    for (const row of groupExpensesByDate(rows)) {
      await upsertMetric(db, organizationId, row.date, {
        expenses: row.expenses,
        cogs: row.cogs,
        adSpend: row.adSpend,
        cashOut: row.cashOut,
      });
      written += 1;
    }
    return written;
  }

  if (kind === "ops") {
    for (const row of groupOpsByDate(rows)) {
      await upsertMetric(db, organizationId, row.date, {
        headcount: row.headcount,
        payroll: row.payroll,
        utilization: row.utilization,
        fulfillmentHours: row.fulfillmentHours,
      });
      written += 1;
    }
    return written;
  }

  if (kind === "customers") {
    const existing = await db.customer.findMany({ where: { organizationId } });
    for (const row of rows) {
      const email = normalizeEmail(row.email);
      const phone = normalizePhone(row.phone);
      const match = await findByContact(existing, email, phone);
      const data = {
        name: String(row.name),
        email,
        phone,
        segment: String(row.segment ?? row.status ?? "regular"),
        source: String(row.source ?? "upload"),
        status: String(row.status ?? "active"),
        lifetimeValue: Number(row.lifetimeValue ?? 0),
        ordersCount: Math.round(Number(row.ordersCount ?? 0)),
        lastOrderAt: (row.lastOrderAt as Date | null) ?? null,
      };
      if (match) {
        await db.customer.update({ where: { id: match.id }, data });
        Object.assign(match, data);
      } else {
        const created = await db.customer.create({
          data: { organizationId, ...data },
        });
        existing.push(created);
      }
      written += 1;
    }
    return written;
  }

  if (kind === "leads") {
    const existing = await db.lead.findMany({ where: { organizationId } });
    for (const row of rows) {
      const email = normalizeEmail(row.email);
      const phone = normalizePhone(row.phone);
      const match = await findByContact(existing, email, phone);
      const data = {
        name: String(row.name),
        email,
        phone,
        source: String(row.source ?? "upload"),
        status: String(row.status ?? "new"),
        estimatedValue: Number(row.estimatedValue ?? 0),
        createdAt: (row.createdAt as Date | null) ?? utcDay(),
        lastTouchAt: (row.createdAt as Date | null) ?? utcDay(),
      };
      if (match) {
        await db.lead.update({
          where: { id: match.id },
          data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            source: data.source,
            status: data.status,
            estimatedValue: data.estimatedValue,
            lastTouchAt: data.lastTouchAt,
          },
        });
        Object.assign(match, data);
      } else {
        const created = await db.lead.create({
          data: { organizationId, ...data },
        });
        existing.push(created);
      }
      written += 1;
    }
    return written;
  }

  if (kind === "inventory") {
    for (const row of rows) {
      const sku = String(row.sku);
      const name = String(row.nameAr ?? row.nameEn ?? sku);
      await db.product.upsert({
        where: { organizationId_sku: { organizationId, sku } },
        update: {
          nameAr: name,
          nameEn: String(row.nameEn ?? name),
          category: String(row.category ?? "general"),
          price: Number(row.price ?? 0),
          cost: Number(row.cost ?? 0),
          stock: Math.round(Number(row.stock ?? 0)),
          reorderPoint: Math.round(Number(row.reorderPoint ?? 0)),
        },
        create: {
          id: prefixedId("prod"),
          organizationId,
          sku,
          nameAr: name,
          nameEn: String(row.nameEn ?? name),
          category: String(row.category ?? "general"),
          price: Number(row.price ?? 0),
          cost: Number(row.cost ?? 0),
          stock: Math.round(Number(row.stock ?? 0)),
          reorderPoint: Math.round(Number(row.reorderPoint ?? 0)),
          unitsSold90d: 0,
        },
      });
      written += 1;
    }
    const products = await db.product.findMany({ where: { organizationId } });
    const stockouts = products.filter((product) => product.stock <= product.reorderPoint).length;
    await upsertMetric(db, organizationId, utcDay(), { stockouts });
    return written;
  }

  if (kind === "employees") {
    const existing = await db.employee.findMany({ where: { organizationId } });
    for (const row of rows) {
      const name = String(row.name);
      const role = String(row.role ?? "staff");
      const match = existing.find((item) => item.name === name && item.role === role);
      const data = {
        name,
        role,
        department: String(row.department ?? "general"),
        salary: Number(row.salary ?? 0),
        utilization: asUtilization(row.utilization) ?? 0,
        overtimeHours: Number(row.overtimeHours ?? 0),
      };
      if (match) {
        await db.employee.update({ where: { id: match.id }, data });
        Object.assign(match, data);
      } else {
        const created = await db.employee.create({
          data: { organizationId, ...data },
        });
        existing.push(created);
      }
      written += 1;
    }
    return written;
  }

  for (const row of rows) {
    const name = String(row.nameAr ?? row.nameEn ?? "Campaign");
    const startDate = (row.startDate as Date | null) ?? utcDay();
    const spend = Number(row.spend ?? 0);
    const conversions = Math.round(Number(row.conversions ?? 0));
    await db.campaign.create({
      data: {
        organizationId,
        nameAr: name,
        nameEn: String(row.nameEn ?? name),
        channel: String(row.channel ?? "other"),
        spend,
        revenue: Number(row.revenue ?? 0),
        clicks: Math.round(Number(row.clicks ?? 0)),
        conversions,
        startDate,
        endDate: (row.endDate as Date | null) ?? startDate,
      },
    });
    const existing = await db.dailyMetric.findUnique({
      where: { organizationId_date: { organizationId, date: utcDay(startDate) } },
    });
    await upsertMetric(db, organizationId, startDate, {
      adSpend: (existing?.adSpend ?? 0) + spend,
      conversions: (existing?.conversions ?? 0) + conversions,
    });
    written += 1;
  }
  return written;
}

export async function markSourceImported(db: Db, organizationId: string, key: string) {
  const source = await db.dataSource.findUnique({
    where: { organizationId_key: { organizationId, key } },
  });
  if (!source) return;
  await db.dataSource.update({
    where: { id: source.id },
    data: {
      connected: true,
      status: "connected",
      lastSyncAt: new Date(),
      lastError: null,
    },
  });
}
