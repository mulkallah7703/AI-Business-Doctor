import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiOrg } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { utcDay } from "@/lib/utils";
import { refreshOrgIntelligence } from "@/lib/ai/refresh";

const schema = z.object({
  date: z.string().min(8),
  revenue: z.number().nonnegative(),
  orders: z.number().int().nonnegative().default(0),
  expenses: z.number().nonnegative().default(0),
  cogs: z.number().nonnegative().default(0),
  cashBalance: z.number().nonnegative().default(0),
  leads: z.number().int().nonnegative().default(0),
  conversions: z.number().int().nonnegative().default(0),
  sessions: z.number().int().nonnegative().default(0),
  adSpend: z.number().nonnegative().default(0),
});

export async function POST(request: Request) {
  const auth = await requireApiOrg();
  if (!auth.ok) return auth.response;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const date = utcDay(new Date(parsed.data.date));
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const data = {
    revenue: parsed.data.revenue,
    orders: parsed.data.orders,
    expenses: parsed.data.expenses,
    cogs: parsed.data.cogs,
    cashBalance: parsed.data.cashBalance,
    cashIn: parsed.data.revenue,
    cashOut: parsed.data.expenses + parsed.data.cogs,
    leads: parsed.data.leads,
    conversions: parsed.data.conversions || parsed.data.orders,
    sessions: parsed.data.sessions,
    adSpend: parsed.data.adSpend,
    refunds: 0,
    nps: 0,
    fulfillmentHours: 0,
    stockouts: 0,
  };

  const metric = await prisma.dailyMetric.upsert({
    where: {
      organizationId_date: { organizationId: auth.organization.id, date },
    },
    update: data,
    create: {
      organizationId: auth.organization.id,
      date,
      ...data,
    },
  });

  const sales = await prisma.dataSource.findFirst({
    where: { organizationId: auth.organization.id, key: "sales" },
  });
  if (sales) {
    await prisma.dataSource.update({
      where: { id: sales.id },
      data: { connected: true, status: "connected", lastSyncAt: new Date(), lastError: null },
    });
  }

  const intelligence = await refreshOrgIntelligence(auth.organization.id);
  return NextResponse.json({ id: metric.id, intelligence });
}
