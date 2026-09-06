import type { Campaign, Customer, DailyMetric, Employee, Insight, Lead, Product } from "@prisma/client";
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
  customers?: Customer[];
  employees?: Employee[];
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
  const cashNow = last?.cashBalance ?? 0;
  const cashStart = last30[0]?.cashBalance || cashNow || 1;
  const cashDeltaPct = cashStart ? (cashStart - cashNow) / cashStart : 0;
  const cashflow = clamp(92 - cashDeltaPct * 110);

  const pillars: HealthPillar[] = [
    {
      key: "financial",
      score: financial,
      drivers: [
        { ar: `هامش تشغيلي ${(margin * 100).toFixed(1)}٪`, en: `Operating margin ${(margin * 100).toFixed(1)}%`, weight: 0.5 },
        {
          ar: dashboard.profit30 < 0 ? "الربح سالب على النافذة الحالية" : "الربح ما زال موجباً على النافذة الحالية",
          en: dashboard.profit30 < 0 ? "Profit is negative on the current window" : "Profit is still positive on the current window",
          weight: 0.3,
        },
        { ar: `تكاليف ${Math.round(dashboard.costs30).toLocaleString("en-US")} ر.س`, en: `Costs SAR ${Math.round(dashboard.costs30).toLocaleString("en-US")}`, weight: 0.2 },
      ],
    },
    {
      key: "sales",
      score: sales,
      drivers: [
        { ar: `تحويل 14 يوماً ${(dashboard.conversion14 * 100).toFixed(1)}٪`, en: `14-day conversion ${(dashboard.conversion14 * 100).toFixed(1)}%`, weight: 0.55 },
        {
          ar: dashboard.conversion14 < dashboard.prevConversion14 ? "التحويل أضعف من الفترة السابقة" : "التحويل مستقر أو أفضل من الفترة السابقة",
          en: dashboard.conversion14 < dashboard.prevConversion14 ? "Conversion weaker than the prior period" : "Conversion stable or better than the prior period",
          weight: 0.3,
        },
        { ar: `${belowReorder} أصناف تحت نقطة الطلب`, en: `${belowReorder} SKUs below reorder`, weight: 0.15 },
      ],
    },
    {
      key: "customer",
      score: customer,
      drivers: [
        { ar: `${neglected} محادثة واتساب مهملة`, en: `${neglected} neglected WhatsApp threads`, weight: 0.5 },
        { ar: `${input.leads.length} فرصة مسجّلة`, en: `${input.leads.length} recorded leads`, weight: 0.25 },
        { ar: neglected ? "جزء من القائمة بلا متابعة" : "لا إهمال ظاهر في القائمة", en: neglected ? "Part of the list has gone dark" : "No visible neglect in the list", weight: 0.25 },
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
        {
          ar: roi < 2 ? "العائد تحت عتبة الأمان" : "العائد فوق عتبة الأمان",
          en: roi < 2 ? "Return is below the safety line" : "Return is above the safety line",
          weight: 0.35,
        },
        { ar: `${input.campaigns.length} حملات`, en: `${input.campaigns.length} campaigns`, weight: 0.2 },
      ],
    },
    {
      key: "cashflow",
      score: cashflow,
      drivers: [
        { ar: `رصيد ${Math.round((last?.cashBalance ?? 0) / 1000)} ألف ر.س`, en: `Balance SAR ${Math.round((last?.cashBalance ?? 0) / 1000)}k`, weight: 0.5 },
        {
          ar: cashNow < cashStart ? "الرصيد أضعف من بداية النافذة" : "الرصيد مستقر أو أعلى من بداية النافذة",
          en: cashNow < cashStart ? "Balance weaker than the start of the window" : "Balance stable or higher than the start of the window",
          weight: 0.3,
        },
        { ar: `تغير ${(cashDeltaPct * 100).toFixed(0)}٪`, en: `Change ${(cashDeltaPct * 100).toFixed(0)}%`, weight: 0.2 },
      ],
    },
  ];

  const overall = clamp(
    pillars.reduce((s, p) => s + p.score, 0) / pillars.length,
  );

  return { overall, pillars };
}
