import type { DailyMetric, Insight, Product, Lead, Campaign } from "@prisma/client";
import { deltaPct } from "@/lib/format";

export type SeriesPoint = { date: string; value: number };

export type KpiChip = {
  insightId: string;
  slug: string;
  labelAr: string;
  labelEn: string;
  severity: string;
};

export type KpiCardModel = {
  key: string;
  value: number;
  format: "sar" | "pct" | "score";
  delta: number;
  series: SeriesPoint[];
  chip?: KpiChip;
  subtitleAr: string;
  subtitleEn: string;
};

export type DashboardModel = {
  rangeDays: number;
  revenue30: number;
  profit30: number;
  cash: number;
  costs30: number;
  conversion14: number;
  prevConversion14: number;
  marketingRoi: number;
  neglectedLeads: number;
  cards: KpiCardModel[];
};

function sum<T>(rows: T[], pick: (row: T) => number) {
  return rows.reduce((total, row) => total + pick(row), 0);
}

function series(rows: DailyMetric[], pick: (row: DailyMetric) => number): SeriesPoint[] {
  return rows.map((row) => ({
    date: row.date.toISOString().slice(0, 10),
    value: pick(row),
  }));
}

function chipFor(insights: Insight[], slug: string): KpiChip | undefined {
  const insight = insights.find((item) => item.slug === slug);
  if (!insight) return undefined;
  return {
    insightId: insight.id,
    slug: insight.slug,
    labelAr: insight.titleAr,
    labelEn: insight.titleEn,
    severity: insight.severity,
  };
}

export function computeDashboard(input: {
  metrics: DailyMetric[];
  insights: Insight[];
  products: Product[];
  leads: Lead[];
  campaigns: Campaign[];
}): DashboardModel {
  const { metrics, insights, products, leads, campaigns } = input;
  const sorted = [...metrics].sort((a, b) => a.date.getTime() - b.date.getTime());
  const last30 = sorted.slice(-30);
  const prev30 = sorted.slice(-60, -30);
  const last14 = sorted.slice(-14);
  const prev14 = sorted.slice(-28, -14);
  const last7 = sorted.slice(-7);

  const revenue30 = sum(last30, (m) => m.revenue);
  const revenuePrev = sum(prev30, (m) => m.revenue);
  const cogs30 = sum(last30, (m) => m.cogs);
  const expenses30 = sum(last30, (m) => m.expenses);
  const profit30 = revenue30 - cogs30 - expenses30;
  const profitPrev =
    sum(prev30, (m) => m.revenue) - sum(prev30, (m) => m.cogs) - sum(prev30, (m) => m.expenses);
  const cash = last30.at(-1)?.cashBalance ?? 0;
  const cashPrev = prev30.at(-1)?.cashBalance ?? cash;
  const conversion14 =
    sum(last14, (m) => m.conversions) / Math.max(1, sum(last14, (m) => m.sessions));
  const prevConversion14 =
    sum(prev14, (m) => m.conversions) / Math.max(1, sum(prev14, (m) => m.sessions));
  const adSpend30 = sum(last30, (m) => m.adSpend);
  const campaignRoi =
    sum(campaigns, (c) => c.revenue) / Math.max(1, sum(campaigns, (c) => c.spend));
  const neglectedLeads = leads.filter((lead) => lead.status === "neglected").length;
  const atRisk = 0; // customer mix handled in health
  const belowReorder = products.filter((p) => p.stock <= p.reorderPoint).length;
  const nps = last7.reduce((s, m) => s + m.nps, 0) / Math.max(1, last7.length);
  const fulfill =
    last14.reduce((s, m) => s + m.fulfillmentHours, 0) / Math.max(1, last14.length);
  const customerScore = Math.max(
    0,
    Math.min(100, nps * 1.15 - neglectedLeads * 1.4 - atRisk),
  );
  const opsScore = Math.max(0, Math.min(100, 92 - (fulfill - 18) * 3.2 - belowReorder * 4));

  const cards: KpiCardModel[] = [
    {
      key: "revenue",
      value: revenue30,
      format: "sar",
      delta: deltaPct(revenue30, revenuePrev),
      series: series(last30, (m) => m.revenue),
      subtitleAr: "آخر 30 يوماً",
      subtitleEn: "Last 30 days",
      chip: conversion14 < 0.07 ? chipFor(insights, "checkout-conversion-drop") : undefined,
    },
    {
      key: "profit",
      value: profit30,
      format: "sar",
      delta: deltaPct(profit30, profitPrev),
      series: series(last30, (m) => m.revenue - m.cogs - m.expenses),
      subtitleAr: "بعد التكلفة والمصروف",
      subtitleEn: "After COGS and opex",
      chip: profit30 < profitPrev ? chipFor(insights, "ops-cost-inflation") : undefined,
    },
    {
      key: "cash",
      value: cash,
      format: "sar",
      delta: deltaPct(cash, cashPrev),
      series: series(last30, (m) => m.cashBalance),
      subtitleAr: "الرصيد الحالي",
      subtitleEn: "Current balance",
      chip: cash < 200000 ? chipFor(insights, "cash-runway-risk") : undefined,
    },
    {
      key: "costs",
      value: expenses30,
      format: "sar",
      delta: deltaPct(expenses30, sum(prev30, (m) => m.expenses)),
      series: series(last30, (m) => m.expenses),
      subtitleAr: "تشغيل + إعلان جزئي",
      subtitleEn: "Ops + partial ads",
      chip: chipFor(insights, "ops-cost-inflation"),
    },
    {
      key: "customer",
      value: customerScore,
      format: "score",
      delta: -neglectedLeads,
      series: series(last30, (m) => m.nps),
      subtitleAr: `${neglectedLeads} محادثة واتساب مهملة`,
      subtitleEn: `${neglectedLeads} neglected WhatsApp threads`,
      chip: neglectedLeads > 8 ? chipFor(insights, "neglected-whatsapp-leads") : undefined,
    },
    {
      key: "funnel",
      value: conversion14 * 100,
      format: "pct",
      delta: (conversion14 - prevConversion14) * 100,
      series: series(last30, (m) => (m.sessions ? (m.conversions / m.sessions) * 100 : 0)),
      subtitleAr: `كان ${ (prevConversion14 * 100).toFixed(1) }٪`,
      subtitleEn: `Was ${(prevConversion14 * 100).toFixed(1)}%`,
      chip: chipFor(insights, "checkout-conversion-drop"),
    },
    {
      key: "inventory",
      value: belowReorder,
      format: "score",
      delta: -belowReorder,
      series: series(last30, (m) => m.stockouts),
      subtitleAr: "أصناف تحت نقطة الطلب",
      subtitleEn: "SKUs below reorder",
      chip: belowReorder > 0 ? chipFor(insights, "argan-margin-opportunity") : undefined,
    },
    {
      key: "marketing",
      value: campaignRoi,
      format: "score",
      delta: deltaPct(sum(last30, (m) => m.revenue) / Math.max(1, adSpend30), 3.2),
      series: series(last30, (m) => (m.adSpend ? m.revenue / m.adSpend : 0)),
      subtitleAr: "عائد الحملات المدمج",
      subtitleEn: "Blended campaign ROI",
      chip: campaignRoi < 3 ? chipFor(insights, "ad-roi-dilution") : undefined,
    },
    {
      key: "ops",
      value: opsScore,
      format: "score",
      delta: deltaPct(opsScore, 78),
      series: series(last30, (m) => m.fulfillmentHours),
      subtitleAr: `${fulfill.toFixed(1)} ساعة تجهيز`,
      subtitleEn: `${fulfill.toFixed(1)}h fulfillment`,
      chip: fulfill > 22 ? chipFor(insights, "ops-cost-inflation") : undefined,
    },
  ];

  return {
    rangeDays: 30,
    revenue30,
    profit30,
    cash,
    costs30: expenses30,
    conversion14,
    prevConversion14,
    marketingRoi: campaignRoi,
    neglectedLeads,
    cards,
  };
}

export function loadSnapshotFacts(dashboard: DashboardModel) {
  return {
    revenue30: Math.round(dashboard.revenue30),
    profit30: Math.round(dashboard.profit30),
    cash: Math.round(dashboard.cash),
    conversion14: Number((dashboard.conversion14 * 100).toFixed(1)),
    prevConversion14: Number((dashboard.prevConversion14 * 100).toFixed(1)),
    marketingRoi: Number(dashboard.marketingRoi.toFixed(2)),
    neglectedLeads: dashboard.neglectedLeads,
  };
}
