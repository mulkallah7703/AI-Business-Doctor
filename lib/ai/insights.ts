import type { Campaign, Customer, DailyMetric, Employee, Lead, Product } from "@prisma/client";
import type { DashboardModel } from "@/lib/analytics/metrics";
import { computeHealth } from "@/lib/analytics/health";
import { prefixedId } from "@/lib/ids";

export type InsightDraft = {
  id: string;
  slug: string;
  type: string;
  severity: string;
  pillar: string;
  titleAr: string;
  titleEn: string;
  detectAr: string;
  detectEn: string;
  diagnoseAr: string;
  diagnoseEn: string;
  predictAr: string;
  predictEn: string;
  recommendAr: string;
  recommendEn: string;
  narrativeAr: string;
  narrativeEn: string;
  financialEffect: number;
  predictedImpact: number;
  driversJson: string;
};

function money(value: number) {
  return Math.round(Math.abs(value)).toLocaleString("en-US");
}

export function buildInsightsFromOrg(input: {
  dashboard: DashboardModel;
  metrics: DailyMetric[];
  products: Product[];
  leads: Lead[];
  campaigns: Campaign[];
  customers?: Customer[];
  employees?: Employee[];
}): InsightDraft[] {
  const { dashboard, metrics, products, leads, campaigns } = input;
  const customers = input.customers ?? [];
  const employees = input.employees ?? [];
  if (
    metrics.length === 0 &&
    products.length === 0 &&
    leads.length === 0 &&
    campaigns.length === 0 &&
    customers.length === 0 &&
    employees.length === 0
  ) {
    return [];
  }

  const health = computeHealth({ ...input, insights: [] });
  const drafts: InsightDraft[] = [];
  const conv = dashboard.conversion14 * 100;
  const prevConv = dashboard.prevConversion14 * 100;
  const belowReorder = products.filter((product) => product.stock <= product.reorderPoint);
  const neglected = leads.filter((lead) => lead.status === "neglected");
  const pipeline = neglected.reduce((sum, lead) => sum + lead.estimatedValue, 0);

  if (metrics.length > 0) {
    drafts.push({
      id: prefixedId("ins"),
      slug: "revenue-pulse",
      type: dashboard.revenue30 >= 0 ? "growth" : "problem",
      severity: dashboard.revenue30 <= 0 ? "high" : "medium",
      pillar: "sales",
      titleAr: "نبض الإيراد من بيانات منشأتك",
      titleEn: "Revenue pulse from your own data",
      detectAr: `آخر 30 يوماً سجّلت ${money(dashboard.revenue30)} ر.س إيراداً على ${metrics.length} يوماً مُدخلاً.`,
      detectEn: `The last 30 days show SAR ${money(dashboard.revenue30)} across ${metrics.length} ingested days.`,
      diagnoseAr: "هذا الرقم يأتي من ملفاتك أو إدخالك اليدوي — ليس من بيانات العرض التوضيحي.",
      diagnoseEn: "This figure comes from your files or manual entry — not from the demo tenant.",
      predictAr: `إن استمر الإيقاع نفسه، الإيراد الشهري القادم يبقى قرب ${money(dashboard.revenue30)} ر.س ما لم يتحرّك التحويل أو التسعير.`,
      predictEn: `If the pace holds, next-month revenue stays near SAR ${money(dashboard.revenue30)} unless conversion or pricing moves.`,
      recommendAr: "اربط المصروف والمخزون في الخطوة التالية حتى يكتمل التشخيص: اكتشف → شخّص → توقّع → أوصِ.",
      recommendEn: "Connect expenses and inventory next so diagnosis can run Detect → Diagnose → Predict → Recommend in full.",
      narrativeAr: `منشأتك بدأت تُرى. الإيراد ${money(dashboard.revenue30)} ر.س والربح ${money(dashboard.profit30)} ر.س على النافذة الحالية. الطبيب يبني الإحاطة من هذه الأرقام فقط.`,
      narrativeEn: `Your organization is now visible. Revenue is SAR ${money(dashboard.revenue30)} and profit is SAR ${money(dashboard.profit30)} on the current window. The briefing is built from these numbers only.`,
      financialEffect: Math.round(dashboard.revenue30),
      predictedImpact: Math.round(dashboard.profit30),
      driversJson: JSON.stringify([
        { ar: `${metrics.length} يوم بيانات`, en: `${metrics.length} days of data` },
        { ar: `ربح ${money(dashboard.profit30)} ر.س`, en: `Profit SAR ${money(dashboard.profit30)}` },
      ]),
    });
  }

  if (metrics.length >= 14 && prevConv > 0 && conv + 0.4 < prevConv) {
    const lost = Math.round(dashboard.revenue30 * ((prevConv - conv) / Math.max(prevConv, 1)));
    drafts.push({
      id: prefixedId("ins"),
      slug: "conversion-shift",
      type: "problem",
      severity: prevConv - conv >= 2 ? "critical" : "high",
      pillar: "sales",
      titleAr: "التحويل يتراجع مقارنة بالأسبوعين السابقين",
      titleEn: "Conversion is slipping versus the prior two weeks",
      detectAr: `التحويل هبط من ${prevConv.toFixed(1)}٪ إلى ${conv.toFixed(1)}٪.`,
      detectEn: `Conversion fell from ${prevConv.toFixed(1)}% to ${conv.toFixed(1)}%.`,
      diagnoseAr: "إما جودة الزيارة انخفضت أو خطوة إتمام الطلب صارت أثقل. راجع المصدر والحقول الناقصة قبل شراء مزيد من الزيارات.",
      diagnoseEn: "Either visit quality dropped or checkout got heavier. Inspect source and missing fields before buying more traffic.",
      predictAr: `إن استمر الفارق 30 يوماً قد يضيع نحو ${money(lost)} ر.س.`,
      predictEn: `If the gap holds 30 days you may forgo about SAR ${money(lost)}.`,
      recommendAr: "ثبّت مسار الدفع لأسبوع، وأوقف الحملات الأضعف إن كان عائدها دون 2×.",
      recommendEn: "Stabilize checkout for a week and pause the weakest campaigns if return is under 2×.",
      narrativeAr: "الطلب لم يختفِ بالضرورة — التحويل هو من يتكلم. أصلح المسار قبل الميزانية.",
      narrativeEn: "Demand may still be there — conversion is the signal. Fix the path before the budget.",
      financialEffect: lost,
      predictedImpact: -lost,
      driversJson: JSON.stringify([
        { ar: `تحويل حالي ${conv.toFixed(1)}٪`, en: `Current conversion ${conv.toFixed(1)}%` },
        { ar: `كان ${prevConv.toFixed(1)}٪`, en: `Was ${prevConv.toFixed(1)}%` },
      ]),
    });
  }

  if (dashboard.cash > 0 && dashboard.cash < dashboard.costs30 * 1.2 && dashboard.costs30 > 0) {
    drafts.push({
      id: prefixedId("ins"),
      slug: "cash-cover",
      type: "risk",
      severity: "high",
      pillar: "cashflow",
      titleAr: "السيولة تغطي أقل من شهر تشغيل",
      titleEn: "Cash covers less than a month of operations",
      detectAr: `الرصيد ${money(dashboard.cash)} ر.س مقابل تكاليف ${money(dashboard.costs30)} ر.س في 30 يوماً.`,
      detectEn: `Balance is SAR ${money(dashboard.cash)} against SAR ${money(dashboard.costs30)} of 30-day costs.`,
      diagnoseAr: "التوقيت أهم من الحجم: التحصيل أو جدولة المدفوعات يحرّك الخط قبل أي خفض عشوائي للمبيعات.",
      diagnoseEn: "Timing matters more than size: collections or payable staging moves the line before a blunt sales cut.",
      predictAr: "بدون تحصيل إضافي قد يلمس التشغيل حد الأمان خلال أسابيع.",
      predictEn: "Without extra collections, operations may touch the safety line within weeks.",
      recommendAr: "حرّك أكبر فاتورتين هذا الأسبوع، وأخّر غير الحرج من المدفوعات 14 يوماً.",
      recommendEn: "Chase the two largest invoices this week and defer non-critical payables 14 days.",
      narrativeAr: "هذه ليست بالضرورة أزمة إفلاس — هي أزمة توقيت تظهر حالما تدخل أرقامك.",
      narrativeEn: "This is not necessarily insolvency — it is a timing problem that appears as soon as your numbers land.",
      financialEffect: Math.round(dashboard.costs30),
      predictedImpact: -Math.round(Math.max(0, dashboard.costs30 - dashboard.cash)),
      driversJson: JSON.stringify([
        { ar: `نقد ${money(dashboard.cash)}`, en: `Cash SAR ${money(dashboard.cash)}` },
        { ar: `تكاليف ${money(dashboard.costs30)}`, en: `Costs SAR ${money(dashboard.costs30)}` },
      ]),
    });
  }

  if (belowReorder.length > 0) {
    const first = belowReorder[0];
    drafts.push({
      id: prefixedId("ins"),
      slug: "stock-pressure",
      type: "risk",
      severity: belowReorder.length > 2 ? "high" : "medium",
      pillar: "operational",
      titleAr: "أصناف تحت نقطة إعادة الطلب",
      titleEn: "SKUs are below reorder point",
      detectAr: `${belowReorder.length} أصناف تحت العتبة، منها ${first.nameAr} (${first.stock} مقابل ${first.reorderPoint}).`,
      detectEn: `${belowReorder.length} SKUs are under the threshold, including ${first.nameEn} (${first.stock} vs ${first.reorderPoint}).`,
      diagnoseAr: "النقص يقتل الطلب الجاهز ويزيد إعادة التجهيز. المشتريات يجب أن تتبع الهامش لا الحجم فقط.",
      diagnoseEn: "Stockouts kill ready demand and force re-picks. Purchasing should follow margin, not volume alone.",
      predictAr: `كل أسبوع نفاد على هذه القائمة يُقدَّر بفقدان جزء من ${money(first.price * Math.max(10, first.reorderPoint))} ر.س.`,
      predictEn: `Each stockout week on this list risks a slice of SAR ${money(first.price * Math.max(10, first.reorderPoint))}.`,
      recommendAr: `اطلب الآن للصنف ${first.nameAr} وحدّث نقطة الطلب لبقية القائمة.`,
      recommendEn: `Reorder ${first.nameEn} now and reset reorder points for the rest of the list.`,
      narrativeAr: "التوفر قرار إيراد متنكّر في ثوب مستودع.",
      narrativeEn: "Availability is a revenue decision dressed as a warehouse problem.",
      financialEffect: Math.round(first.price * Math.max(first.reorderPoint, 1)),
      predictedImpact: Math.round(first.price * Math.max(first.reorderPoint, 1)),
      driversJson: JSON.stringify(
        belowReorder.slice(0, 3).map((product) => ({
          ar: `${product.nameAr}: ${product.stock}`,
          en: `${product.nameEn}: ${product.stock}`,
        })),
      ),
    });
  }

  if (neglected.length > 0) {
    drafts.push({
      id: prefixedId("ins"),
      slug: "neglected-leads",
      type: "problem",
      severity: neglected.length > 8 ? "high" : "medium",
      pillar: "customer",
      titleAr: "فرص بلا متابعة",
      titleEn: "Leads going dark",
      detectAr: `${neglected.length} فرصة في حالة مهمل، بقيمة تقديرية ${money(pipeline)} ر.س.`,
      detectEn: `${neglected.length} neglected leads, estimated pipeline SAR ${money(pipeline)}.`,
      diagnoseAr: "التكلفة اكتُسبت سلفاً. البرود هنا أغلى من حملة ضعيفة.",
      diagnoseEn: "Acquisition is already paid. Silence here is costlier than a weak campaign.",
      predictAr: `استرداد جزء من القائمة خلال أسبوعين يعيد نحو ${money(pipeline * 0.4)} ر.س.`,
      predictEn: `Recovering part of the list in two weeks can return about SAR ${money(pipeline * 0.4)}.`,
      recommendAr: "خصّص ساعة يومية لتفريغ الصندوق، وردّاً أولاً خلال خمس دقائق.",
      recommendEn: "Reserve a daily hour to clear the inbox and a first reply within five minutes.",
      narrativeAr: "الطلب يطرق الباب ثم يبرد. أول من يرد غالباً من يبيع.",
      narrativeEn: "Demand knocks, then goes cold. The first reply usually wins.",
      financialEffect: Math.round(pipeline),
      predictedImpact: Math.round(pipeline * 0.4),
      driversJson: JSON.stringify([
        { ar: `${neglected.length} مهمل`, en: `${neglected.length} neglected` },
        { ar: `قيمة ${money(pipeline)}`, en: `Value SAR ${money(pipeline)}` },
      ]),
    });
  }

  if (campaigns.length > 0 && dashboard.marketingRoi > 0 && dashboard.marketingRoi < 2) {
    drafts.push({
      id: prefixedId("ins"),
      slug: "ad-return",
      type: "problem",
      severity: "medium",
      pillar: "marketing",
      titleAr: "عائد الحملات دون عتبة الأمان",
      titleEn: "Campaign return is below the safety line",
      detectAr: `العائد المدمج ${dashboard.marketingRoi.toFixed(1)}× على ${campaigns.length} حملات.`,
      detectEn: `Blended return is ${dashboard.marketingRoi.toFixed(1)}× across ${campaigns.length} campaigns.`,
      diagnoseAr: "التوسيع الرخيص يبتلع الهامش. أبقِ ما يُعيد الاستهداف وأوقف الضجيج.",
      diagnoseEn: "Cheap reach eats margin. Keep retargeting and pause the noise.",
      predictAr: "خفض 20٪ من الإنفاق الضعيف يعيد هامشاً دون فقد مبيعات مماثل.",
      predictEn: "Cutting 20% of weak spend returns margin without a matching sales loss.",
      recommendAr: "أوقف أدنى حملة عائداً هذا الأسبوع وأعد توجيه الميزانية إلى الأعلى.",
      recommendEn: "Pause the lowest-return campaign this week and point budget at the highest.",
      narrativeAr: "الإنفاق ليس مرتفعاً بالضرورة — هو موجّه نحو القناة الخطأ.",
      narrativeEn: "Spend is not necessarily high — it may simply point at the wrong channel.",
      financialEffect: Math.round(campaigns.reduce((sum, campaign) => sum + campaign.spend, 0) * 0.2),
      predictedImpact: Math.round(campaigns.reduce((sum, campaign) => sum + campaign.spend, 0) * 0.2),
      driversJson: JSON.stringify(
        campaigns.slice(0, 3).map((campaign) => ({
          ar: `${campaign.nameAr}: ${campaign.revenue / Math.max(1, campaign.spend)}×`,
          en: `${campaign.nameEn}: ${campaign.revenue / Math.max(1, campaign.spend)}×`,
        })),
      ),
    });
  }

  if (drafts.length === 0 && (metrics.length || products.length || customers.length || employees.length || leads.length || campaigns.length)) {
    drafts.push({
      id: prefixedId("ins"),
      slug: "first-signal",
      type: "recommendation",
      severity: "low",
      pillar: "financial",
      titleAr: "بياناتك وصلت — أكمل الدورة",
      titleEn: "Your data is in — complete the loop",
      detectAr: `درجة الصحة الحالية ${health.overall} بعد أول دفعة بيانات.`,
      detectEn: `Current health score is ${health.overall} after the first ingest.`,
      diagnoseAr: "التشخيص يكتمل عندما تتوفر المبيعات والمصروف والمخزون معاً.",
      diagnoseEn: "Diagnosis completes when sales, expenses, and inventory sit together.",
      predictAr: "كل مصدر إضافي يقلّل التخمين في الإحاطة الصباحية.",
      predictEn: "Each extra source reduces guesswork in the morning briefing.",
      recommendAr: "ارفع المصروفات أو أدخل مؤشرات يومية يدوياً ثم أعد توليد الإحاطة.",
      recommendEn: "Upload expenses or enter daily KPIs manually, then regenerate the briefing.",
      narrativeAr: "المنصة لم تعد عرضاً توضيحياً — هي غرفة عمليات على أرقامك.",
      narrativeEn: "The platform is no longer a demo — it is an operating room on your numbers.",
      financialEffect: 0,
      predictedImpact: 0,
      driversJson: JSON.stringify([{ ar: "دفعة أولى", en: "First ingest" }]),
    });
  }

  return drafts.slice(0, 7);
}

export function actionsFromInsights(organizationId: string, insights: InsightDraft[]) {
  return insights.slice(0, 4).map((insight, index) => ({
    id: prefixedId("act"),
    organizationId,
    insightId: insight.id,
    titleAr: insight.recommendAr.slice(0, 80),
    titleEn: insight.recommendEn.slice(0, 80),
    descriptionAr: insight.predictAr,
    descriptionEn: insight.predictEn,
    status: index === 0 ? "pending" : "pending",
    priority: insight.severity === "critical" ? "urgent" : insight.severity === "high" ? "high" : "medium",
    estimatedEffect: Math.abs(insight.financialEffect),
    beforeMetric: null as string | null,
    afterMetric: null as string | null,
  }));
}
