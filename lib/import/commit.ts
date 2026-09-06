import type { Prisma, PrismaClient } from "@prisma/client";
import type { ImportKind } from "@/lib/connectors";
import { prefixedId } from "@/lib/ids";
import { utcDay } from "@/lib/utils";
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

export async function commitImport(input: {
  db: Db;
  organizationId: string;
  kind: ImportKind;
  rows: MappedRow[];
}) {
  const { db, organizationId, kind, rows } = input;
  let written = 0;

  if (kind === "sales" || kind === "expenses") {
    for (const row of rows) {
      const date = row.date as Date;
      const patch =
        kind === "sales"
          ? {
              revenue: Number(row.revenue ?? 0),
              orders: Math.round(Number(row.orders ?? 0)),
              sessions: Math.round(Number(row.sessions ?? 0)),
              conversions: Math.round(Number(row.conversions ?? row.orders ?? 0)),
              refunds: Number(row.refunds ?? 0),
              cogs: row.cogs == null ? undefined : Number(row.cogs),
              cashIn: Number(row.revenue ?? 0),
            }
          : {
              expenses: Number(row.expenses ?? 0),
              cogs: row.cogs == null ? undefined : Number(row.cogs),
              adSpend: row.adSpend == null ? undefined : Number(row.adSpend),
              cashOut: row.cashOut == null ? Number(row.expenses ?? 0) : Number(row.cashOut),
            };
      await upsertMetric(db, organizationId, date, patch);
      written += 1;
    }
    return written;
  }

  if (kind === "customers") {
    for (const row of rows) {
      await db.customer.create({
        data: {
          organizationId,
          name: String(row.name),
          segment: String(row.segment ?? "regular"),
          lifetimeValue: Number(row.lifetimeValue ?? 0),
          ordersCount: Math.round(Number(row.ordersCount ?? 0)),
          lastOrderAt: (row.lastOrderAt as Date | null) ?? null,
        },
      });
      written += 1;
    }
    return written;
  }

  if (kind === "leads") {
    for (const row of rows) {
      await db.lead.create({
        data: {
          organizationId,
          name: String(row.name),
          source: String(row.source ?? "upload"),
          status: String(row.status ?? "new"),
          estimatedValue: Number(row.estimatedValue ?? 0),
          createdAt: (row.createdAt as Date | null) ?? utcDay(),
        },
      });
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
    return written;
  }

  for (const row of rows) {
    const name = String(row.nameAr ?? row.nameEn ?? "Campaign");
    await db.campaign.create({
      data: {
        organizationId,
        nameAr: name,
        nameEn: String(row.nameEn ?? name),
        channel: String(row.channel ?? "other"),
        spend: Number(row.spend ?? 0),
        revenue: Number(row.revenue ?? 0),
        clicks: Math.round(Number(row.clicks ?? 0)),
        conversions: Math.round(Number(row.conversions ?? 0)),
        startDate: (row.startDate as Date | null) ?? utcDay(),
        endDate: (row.endDate as Date | null) ?? utcDay(),
      },
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
