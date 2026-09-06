import type { Product } from "@prisma/client";
import type { DashboardModel } from "./metrics";
import type { SimulationResult, SimulationScenario } from "@/lib/ai/types";

export function runSimulation(input: {
  scenario: SimulationScenario;
  dashboard: DashboardModel;
  products: Product[];
  productId?: string;
  locale: string;
}): SimulationResult {
  const { scenario, dashboard, products, productId, locale } = input;
  const ar = locale !== "en";
  const monthlyRevenue = dashboard.revenue30;
  const monthlyProfit = dashboard.profit30;
  const cash = dashboard.cash;
  const product = products.find((p) => p.id === productId) ?? products.find((p) => p.id === "prod_argan") ?? products[0];

  if (scenario === "raise_prices") {
    const elasticityLost = 0.06;
    const revenueDelta = monthlyRevenue * (0.1 - elasticityLost);
    const profitDelta = monthlyRevenue * 0.1 * 0.72 - monthlyRevenue * elasticityLost * 0.35;
    const cashDelta = profitDelta * 0.7;
    return {
      scenario,
      revenueDelta,
      profitDelta,
      cashDelta,
      source: "mock",
      assumptions: ar
        ? [
            "مرونة سعرية معتدلة: فقدان 6٪ من الوحدات مقابل رفع 10٪.",
            "الأصناف عالية الهامش تحتمل الرفع أكثر من الإلكترونيات.",
            "لا تغيير في تكلفة البضاعة خلال الشهر الأول.",
          ]
        : [
            "Moderate elasticity: 6% unit loss against a 10% price rise.",
            "High-margin SKUs tolerate the rise better than electronics.",
            "COGS unchanged in month one.",
          ],
      narrative: ar
        ? `رفع الأسعار 10٪ يضيف نحو ${Math.round(revenueDelta).toLocaleString("ar-SA")} ر.س إيراداً شهرياً إذا بقي الفقد عند 6٪. الربح يتحسن أوضح من الإيراد لأن الرفع يقع على السعر لا على التكلفة. لا ترفع السماعات بالتوازي — ابدأ بالضيافة والعسل والأرغان.`
        : `A 10% price rise adds about SAR ${Math.round(revenueDelta).toLocaleString("en-SA")} monthly revenue if unit loss stays near 6%. Profit moves more than revenue because the lift sits on price, not cost. Do not raise earbuds in the same pass — start with hospitality, honey, and Argan.`,
    };
  }

  if (scenario === "cut_ads") {
    const cut = 0.2;
    const lastAd = monthlyRevenue > 0 ? 0.12 : 0.12;
    const adSpend = monthlyRevenue * lastAd;
    const saved = adSpend * cut;
    const lostRevenue = monthlyRevenue * 0.035;
    const profitDelta = saved - lostRevenue * 0.28;
    return {
      scenario,
      revenueDelta: -lostRevenue,
      profitDelta,
      cashDelta: saved * 0.85,
      source: "mock",
      assumptions: ar
        ? [
            "القطع يستهدف التوسيع الواسع (تيك توك / سناب) لا إعادة الاستهداف.",
            "فقد إيراد محدود 3.5٪ لأن الزيارات الضعيفة لا تتحول.",
            "الوفر النقدي يظهر خلال دورة فوترة أسبوعين.",
          ]
        : [
            "The cut targets broad prospecting (TikTok / Snap), not retargeting.",
            "Revenue loss is capped at 3.5% because weak clicks barely convert.",
            "Cash savings appear within a two-week billing cycle.",
          ],
      narrative: ar
        ? `خفض 20٪ من الإنفاق الإعلاني الواسع يوفّر سيولة فورية ويقوّي الهامش حتى مع تراجع إيراد طفيف. هذه ليست دعوة لإطفاء التسويق — هي دعوة لإيقاف شراء الزائر الذي لا يدفع.`
        : `Cutting 20% of broad ad spend frees cash and lifts margin even with a small revenue dip. This is not a call to switch marketing off — it is a call to stop buying visitors who do not pay.`,
    };
  }

  if (scenario === "hire_staff") {
    const monthlyCost = 2 * 6200;
    const overtimeRelief = 9800;
    const recoveredSales = 14500;
    const profitDelta = recoveredSales * 0.42 + overtimeRelief - monthlyCost;
    return {
      scenario,
      revenueDelta: recoveredSales,
      profitDelta,
      cashDelta: -monthlyCost + overtimeRelief * 0.5,
      source: "mock",
      assumptions: ar
        ? [
            "موظف تجهيز بدوام كامل وموظف رد واتساب مسائي.",
            "الراتب التقديري 6,200 ر.س لكل موظف مع تكاليف بسيطة.",
            "ينخفض الإضافي ويُسترد جزء من الطلبات المتأخرة والمهملة.",
          ]
        : [
            "One full-time picker and one evening WhatsApp responder.",
            "Estimated salary SAR 6,200 each plus light burden.",
            "Overtime falls and some late/neglected orders are recovered.",
          ],
      narrative: ar
        ? `توظيف اثنين يكلّف نحو ${monthlyCost.toLocaleString("ar-SA")} ر.س شهرياً، لكنه يشتري وقتاً تشغيلياً أرخص من الإضافي ويُعيد جزءاً من الطلب المُهمل. القرار صحيح إذا التزم الدور الثاني بتفريغ واتساب يومياً — وإلا ستدفع راتباً دون قياس.`
        : `Hiring two costs about SAR ${monthlyCost.toLocaleString("en-SA")} a month, but buys cheaper operating time than overtime and recovers neglected demand. The hire is correct only if the second role clears WhatsApp daily — otherwise you pay salary without a measure.`,
    };
  }

  const units = Math.max(40, Math.round((product?.unitsSold90d ?? 400) / 6));
  const margin = product ? product.price - product.cost : 140;
  const extraUnits = Math.round(units * 0.55);
  const revenueDelta = extraUnits * (product?.price ?? 189);
  const profitDelta = extraUnits * margin - 4200;
  return {
    scenario,
    revenueDelta,
    profitDelta,
    cashDelta: profitDelta * 0.55 - (product && product.stock < product.reorderPoint ? 18000 : 4000),
    source: "mock",
    assumptions: ar
      ? [
          `التركيز على ${product?.nameAr ?? "الصنف"} مع إعادة تخزين فورية.`,
          "تحويل 15٪ من ميزانية تيك توك إلى صفحة المنتج.",
          "لا يُفترض إطلاق صنف جديد — فقط إيقاف النفاد.",
        ]
      : [
          `Focus on ${product?.nameEn ?? "the SKU"} with an immediate restock.`,
          "Shift 15% of TikTok budget onto the product page.",
          "No new product launch — only stop the stockout.",
        ],
    narrative: ar
      ? `التركيز على ${product?.nameAr ?? "المنتج"} يعامل النمو كقرار توفر لا كحملة. الهامش ${Math.round((margin / (product?.price ?? 1)) * 100)}٪ يعني أن كل وحدة مسترجعة أغنى من وحدة سماعات. اطلب المخزون أولاً ثم أعلن.`
      : `Focusing on ${product?.nameEn ?? "the product"} treats growth as an availability decision, not a campaign. A ${Math.round((margin / (product?.price ?? 1)) * 100)}% margin means every recovered unit is richer than an earbud unit. Buy stock first, then advertise.`,
  };
}
