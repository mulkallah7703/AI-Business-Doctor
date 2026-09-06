import type { Campaign, DailyMetric, Insight, Lead, Product } from "@prisma/client";
import { computeDashboard } from "./metrics";

export type HealthPillarKey =
  | "financial"
  | "sales"
  | "customer"
  | "operational"
  | "marketing"
  | "cashflow";

export type HealthDriver = { ar: string; en: string; weight: number };

export type HealthPillar = {
  key: HealthPillarKey;
  score: number;
  drivers: HealthDriver[];
};

export type HealthModel = {
  overall: number;
  pillars: HealthPillar[];
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function tone(score: number) {
  if (score >= 75) return "green";
  if (score >= 55) return "orange";
  return "red";
}

export function healthTone(score: number) {
  return tone(score);
}

export function computeHealth(input: {
  metrics: DailyMetric[];
  insights: Insight[];
  products: Product[];
  leads: Lead[];
  campaigns: Campaign[];
}): HealthModel {
  const dashboard = computeDashboard(input);
  const last30 = [...input.metrics]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-30);
  const last = last30.at(-1);
  const margin = dashboard.revenue30
    ? dashboard.profit30 / dashboard.revenue30
    : 0;
  const belowReorder = input.products.filter((p) => p.stock <= p.reorderPoint).length;
  const neglected = input.leads.filter((l) => l.status === "neglected").length;
  const atRiskShare =
    input.leads.length === 0 ? 0 : neglected / input.leads.length;
  const fulfill =
    last30.reduce((s, m) => s + m.fulfillmentHours, 0) / Math.max(1, last30.length);
  const roi =
    input.campaigns.reduce((s, c) => s + c.revenue, 0) /
    Math.max(
      1,
      input.campaigns.reduce((s, c) => s + c.spend, 0),
    );

  const financial = clamp(58 + margin * 80 - (dashboard.profit30 < 0 ? 20 : 0));
  const sales = clamp(40 + dashboard.conversion14 * 520);
  const customer = clamp(78 - neglected * 1.6 - atRiskShare * 20);
  const operational = clamp(90 - (fulfill - 18) * 3.4 - belowReorder * 5);
  const marketing = clamp(38 + roi * 12);
  const cashflow = clamp(((last?.cashBalance ?? 0) / 380000) * 100);

  const pillars: HealthPillar[] = [
    {
      key: "financial",
      score: financial,
      drivers: [
        { ar: `هامش تشغيلي ${(margin * 100).toFixed(1)}٪`, en: `Operating margin ${(margin * 100).toFixed(1)}%`, weight: 0.5 },
        { ar: "المصاريف ترتفع أسرع من الإيراد", en: "Opex rising faster than revenue", weight: 0.3 },
        { ar: "الربح ما زال موجباً لكنه يتآكل", en: "Profit still positive but eroding", weight: 0.2 },
      ],
    },
    {
      key: "sales",
      score: sales,
      drivers: [
        { ar: `تحويل 14 يوماً ${(dashboard.conversion14 * 100).toFixed(1)}٪`, en: `14-day conversion ${(dashboard.conversion14 * 100).toFixed(1)}%`, weight: 0.55 },
        { ar: "هجر السلة عند الدفع", en: "Checkout abandonment", weight: 0.3 },
        { ar: "نقص الأرغان يقتل الطلب عالي الهامش", en: "Argan stockouts kill high-margin demand", weight: 0.15 },
      ],
    },
    {
      key: "customer",
      score: customer,
      drivers: [
        { ar: `${neglected} محادثة واتساب مهملة`, en: `${neglected} neglected WhatsApp threads`, weight: 0.5 },
        { ar: "عملاء VIP مستقرون", en: "VIP accounts remain stable", weight: 0.25 },
        { ar: "شريحة at-risk بلا إعادة تفعيل", en: "At-risk segment has no win-back", weight: 0.25 },
      ],
    },
    {
      key: "operational",
      score: operational,
      drivers: [
        { ar: `تجهيز ${fulfill.toFixed(1)} ساعة`, en: `Fulfillment ${fulfill.toFixed(1)} hours`, weight: 0.4 },
        { ar: `${belowReorder} أصناف تحت نقطة الطلب`, en: `${belowReorder} SKUs below reorder`, weight: 0.35 },
        { ar: "ساعات إضافية في المستودع", en: "Warehouse overtime", weight: 0.25 },
      ],
    },
    {
      key: "marketing",
      score: marketing,
      drivers: [
        { ar: `عائد مدمج ${roi.toFixed(1)}×`, en: `Blended ROI ${roi.toFixed(1)}×`, weight: 0.45 },
        { ar: "تيك توك واسع يضعف العائد", en: "Broad TikTok dilutes return", weight: 0.35 },
        { ar: "إعادة الاستهداف لا تزال مربحة", en: "Retargeting still profitable", weight: 0.2 },
      ],
    },
    {
      key: "cashflow",
      score: cashflow,
      drivers: [
        { ar: `رصيد ${Math.round((last?.cashBalance ?? 0) / 1000)} ألف ر.س`, en: `Balance SAR ${Math.round((last?.cashBalance ?? 0) / 1000)}k`, weight: 0.5 },
        { ar: "شراء مخزون نقدي", en: "Cash inventory purchase", weight: 0.3 },
        { ar: "فواتير ضيافة متأخرة", en: "Late hospitality invoices", weight: 0.2 },
      ],
    },
  ];

  const overall = clamp(
    pillars.reduce((s, p) => s + p.score, 0) / pillars.length,
  );

  return { overall, pillars };
}
