import type { BriefingPayload, SimulationResult } from "./types";
import type { DashboardModel } from "@/lib/analytics/metrics";
import { runSimulation } from "@/lib/analytics/simulator";
import type { Product } from "@prisma/client";
import type { SimulationScenario } from "./types";

export function mockBriefing(dashboard: DashboardModel, locale: string): BriefingPayload {
  const ar = locale !== "en";
  const conv = (dashboard.conversion14 * 100).toFixed(1);
  const prev = (dashboard.prevConversion14 * 100).toFixed(1);
  const cashK = Math.round(dashboard.cash / 1000);

  return {
    source: "mock",
    greeting: ar
      ? "صباح الخير. هذه أهم 5 أشياء تحتاج انتباهك اليوم"
      : "Good morning. These are the 5 things that need your attention today",
    summary: ar
      ? `الطلب لم يختفِ. التحويل عند ${conv}٪ بعد أن كان ${prev}٪، والرصيد قرب ${cashK} ألف ر.س. أصلح المسار، حصّل النقد، وأعد الأرغان إلى الرف قبل شراء زيارات جديدة.`
      : `Demand did not vanish. Conversion sits at ${conv}% after ${prev}%, and cash is near SAR ${cashK}k. Fix the path, collect cash, and put Argan back on the shelf before buying more traffic.`,
    items: [
      {
        rank: 1,
        kind: "urgent",
        title: ar ? "تحويل الدفع ينهار بهدوء" : "Checkout conversion is quietly breaking",
        body: ar
          ? `من ${prev}٪ إلى ${conv}٪ في أسبوعين. الزيارات ترتفع والمبيعات لا تتبعها. ابدأ اليوم بمسار الدفع لا بزيادة الإعلان.`
          : `From ${prev}% to ${conv}% in two weeks. Traffic is up; sales are not. Start with checkout, not more ads.`,
        insightSlug: "checkout-conversion-drop",
        effectSar: 84000,
      },
      {
        rank: 2,
        kind: "risk",
        title: ar ? "السيولة تضيق بعد شراء المخزون" : "Cash is tightening after the inventory buy",
        body: ar
          ? `الرصيد قرب ${cashK} ألف ر.س وفواتير الضيافة متأخرة. حرّك التحصيل هذا الأسبوع قبل أن يلمس التشغيل حد الأمان.`
          : `Balance is near SAR ${cashK}k and hospitality invoices are late. Move collections this week before operations hits the safety line.`,
        insightSlug: "cash-runway-risk",
        effectSar: 54000,
      },
      {
        rank: 3,
        kind: "opportunity",
        title: ar ? "زيت الأرغان يربح ثم يختفي من الرف" : "Argan oil earns — then vanishes from the shelf",
        body: ar
          ? "أعلى هامش في الكتالوج وأضعف توفر. طلبية 200 وحدة تحول نقصاً إلى نمو دون منتج جديد."
          : "Highest catalogue margin, weakest availability. A 200-unit PO turns a stockout into growth without a new product.",
        insightSlug: "argan-margin-opportunity",
        effectSar: 41000,
      },
      {
        rank: 4,
        kind: "growth",
        title: ar ? "واتساب فيه طلب مدفوع بلا رد" : "WhatsApp holds paid demand with no reply",
        body: ar
          ? `لديك ${dashboard.neglectedLeads} محادثة باردة. العميل دفع تكلفة الوصول مسبقاً — الرد اليوم أرخص من أي حملة.`
          : `You have ${dashboard.neglectedLeads} cold threads. Acquisition is already paid — a reply today is cheaper than any campaign.`,
        insightSlug: "neglected-whatsapp-leads",
        effectSar: 28000,
      },
      {
        rank: 5,
        kind: "recommendation",
        title: ar ? "اقطع الضجيج الإعلاني لا التسويق" : "Cut ad noise, not marketing",
        body: ar
          ? `العائد المدمج ${dashboard.marketingRoi.toFixed(1)}×. أبقِ إعادة الاستهداف وأوقف التوسيع الرخيص.`
          : `Blended return is ${dashboard.marketingRoi.toFixed(1)}×. Keep retargeting; pause cheap reach.`,
        insightSlug: "ad-roi-dilution",
        effectSar: 12000,
      },
    ],
  };
}

export function mockSimulation(input: {
  scenario: SimulationScenario;
  dashboard: DashboardModel;
  products: Product[];
  productId?: string;
  locale: string;
}): SimulationResult {
  return runSimulation(input);
}
