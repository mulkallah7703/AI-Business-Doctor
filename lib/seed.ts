import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const ORG_ID = "org_alnoor";
const USER_ID = "user_demo";

function mulberry32(seed: number) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function utcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return utcDay(next);
}

export async function seedDemo(options?: { reset?: boolean; disconnect?: boolean }) {
  const reset = options?.reset ?? false;
  const existing = await prisma.user.findUnique({
    where: { email: "demo@businessdoctor.ai" },
  });

  if (existing && !reset) {
    console.log("Demo data already present — skipping seed. Pass reset to rebuild.");
    if (options?.disconnect) await prisma.$disconnect();
    return { seeded: false, skipped: true as const };
  }

  await prisma.briefing.deleteMany();
  await prisma.action.deleteMany();
  await prisma.insight.deleteMany();
  await prisma.dailyMetric.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.product.deleteMany();
  await prisma.dataSource.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 10);

  const org = await prisma.organization.create({
    data: {
      id: ORG_ID,
      name: "مؤسسة النور للتجارة",
      nameEn: "Al-Noor Trading Establishment",
      slug: "al-noor",
      currency: "SAR",
      timezone: "Asia/Riyadh",
      sector: "retail_ecommerce",
      city: "الرياض",
    },
  });

  await prisma.user.create({
    data: {
      id: USER_ID,
      email: "demo@businessdoctor.ai",
      name: "فهد النور",
      passwordHash,
      memberships: {
        create: { role: "owner", organizationId: org.id },
      },
    },
  });

  const products = [
    {
      id: "prod_hospitality",
      sku: "HOSP- lux-01",
      nameAr: "طقم ضيافة فاخر",
      nameEn: "Luxury hospitality set",
      category: "home",
      price: 289,
      cost: 142,
      stock: 186,
      reorderPoint: 40,
      unitsSold90d: 1240,
    },
    {
      id: "prod_argan",
      sku: "ARG-ROYAL-50",
      nameAr: "زيت الأرغان الملكي",
      nameEn: "Royal Argan oil",
      category: "wellness",
      price: 189,
      cost: 48,
      stock: 18,
      reorderPoint: 60,
      unitsSold90d: 410,
    },
    {
      id: "prod_roaster",
      sku: "COF-ROAST-1",
      nameAr: "محمصة قهوة منزلية",
      nameEn: "Home coffee roaster",
      category: "coffee",
      price: 459,
      cost: 240,
      stock: 54,
      reorderPoint: 20,
      unitsSold90d: 380,
    },
    {
      id: "prod_earbuds",
      sku: "ELC-EAR-PRO",
      nameAr: "سماعات لاسلكية برو",
      nameEn: "Wireless Pro earbuds",
      category: "electronics",
      price: 219,
      cost: 168,
      stock: 240,
      reorderPoint: 50,
      unitsSold90d: 890,
    },
    {
      id: "prod_burner",
      sku: "HOME-INC-SM",
      nameAr: "مبخرة ذكية",
      nameEn: "Smart incense burner",
      category: "home",
      price: 169,
      cost: 71,
      stock: 92,
      reorderPoint: 25,
      unitsSold90d: 510,
    },
    {
      id: "prod_honey",
      sku: "FOOD-SIDR-500",
      nameAr: "عسل سدر أصلي",
      nameEn: "Sidr honey 500g",
      category: "food",
      price: 249,
      cost: 96,
      stock: 12,
      reorderPoint: 35,
      unitsSold90d: 620,
    },
    {
      id: "prod_grooming",
      sku: "MEN-GROOM-KIT",
      nameAr: "طقم عناية رجالي",
      nameEn: "Men's grooming kit",
      category: "wellness",
      price: 159,
      cost: 62,
      stock: 77,
      reorderPoint: 30,
      unitsSold90d: 455,
    },
    {
      id: "prod_dallah",
      sku: "COF-DALLAH-CU",
      nameAr: "دلة قهوة نحاس",
      nameEn: "Copper coffee dallah",
      category: "coffee",
      price: 329,
      cost: 148,
      stock: 41,
      reorderPoint: 15,
      unitsSold90d: 210,
    },
  ];

  // Fix typo in SKU
  products[0].sku = "HOSP-LUX-01";

  await prisma.product.createMany({
    data: products.map((p) => ({ ...p, organizationId: org.id })),
  });

  const today = utcDay(new Date());
  const start = addDays(today, -89);
  const rng = mulberry32(20260906);

  let cash = 382000;
  const dailyRows = [];

  for (let i = 0; i < 90; i++) {
    const date = addDays(start, i);
    const dow = date.getUTCDay();
    const weekend = dow === 5 || dow === 6;
    const weekdayFactor = weekend ? 0.74 : 1 + (dow === 4 ? 0.12 : 0);

    let conversion = 0.083;
    if (i >= 76) {
      conversion = 0.055 + rng() * 0.006;
    } else if (i >= 70) {
      conversion = 0.07 + rng() * 0.008;
    }

    const sessions = Math.round(
      (640 + i * 2.4) * weekdayFactor * (0.9 + rng() * 0.18),
    );
    const conversions = Math.max(8, Math.round(sessions * conversion));
    const orders = conversions;
    const aov = 318 + (i < 55 ? 12 : -8) + rng() * 36;
    const revenue = Math.round(orders * aov);

    const adSpendBase = i < 45 ? 1650 : 1650 + 1400 * ((i - 45) / 44);
    const adSpend = Math.round(adSpendBase * (0.88 + rng() * 0.2));

    const cogsRatio = 0.49 + (i > 70 ? 0.02 : 0);
    const cogs = Math.round(revenue * cogsRatio);

    const opsPressure = i >= 55 ? 1 + 0.32 * ((i - 55) / 34) : 1;
    const baseOpex = 4100 + adSpend * 0.08;
    const expenses = Math.round((baseOpex + 900) * opsPressure * (0.93 + rng() * 0.12));

    const refunds = Math.round(revenue * (i >= 70 ? 0.028 : 0.014) * (0.7 + rng() * 0.6));
    const leads = Math.round((18 + i * 0.12) * weekdayFactor * (0.85 + rng() * 0.3));
    const nps = Number((62 - (i >= 65 ? (i - 65) * 0.35 : 0) + rng() * 6).toFixed(1));
    const fulfillmentHours = Number(
      (18.5 + (i >= 55 ? (i - 55) * 0.22 : 0) + rng() * 2).toFixed(1),
    );
    const stockouts = i >= 72 && rng() > 0.55 ? 1 + (rng() > 0.7 ? 1 : 0) : 0;

    const collectionRate = i >= 66 ? 0.52 : 0.82;
    const cashIn = Math.round(revenue * collectionRate);
    const cashOut = Math.round(
      cogs + expenses + adSpend * 0.35 + (i === 70 ? 125000 : 0),
    );
    cash = Math.round(Math.max(142000, cash + cashIn - cashOut));

    dailyRows.push({
      organizationId: org.id,
      date,
      revenue,
      orders,
      expenses,
      cogs,
      cashBalance: cash,
      cashIn,
      cashOut,
      leads,
      conversions,
      sessions,
      adSpend,
      refunds,
      nps,
      fulfillmentHours,
      stockouts,
    });
  }

  await prisma.dailyMetric.createMany({ data: dailyRows });

  const customers = [
    ["شركة أفق الضيافة", "vip", 84200, 46],
    ["نورة العتيبي", "regular", 6240, 11],
    ["متجر ركن القهوة", "vip", 51800, 29],
    ["خالد السبيعي", "at_risk", 3900, 4],
    ["مؤسسة وادي العسل", "regular", 14750, 13],
    ["سارة الدوسري", "new", 189, 1],
    ["فندق النخيل الذهبي", "vip", 96300, 38],
    ["عبدالله الحربي", "at_risk", 2100, 3],
    ["مشغل لمسة عناية", "regular", 8900, 9],
    ["ريم القحطاني", "regular", 4540, 7],
    ["مكتب مسار الضيافة", "vip", 27600, 16],
    ["يوسف المالكي", "new", 329, 1],
    ["بيت القهوة الأصيل", "regular", 19300, 18],
    ["هند الشمري", "at_risk", 980, 2],
    ["شركة إشراقة التوريدات", "vip", 41200, 22],
    ["ماجد العتيبي", "regular", 5600, 8],
    ["صالون رواق", "regular", 7200, 10],
    ["لينا الغامدي", "new", 249, 1],
    ["مؤسسة سدرة", "regular", 11800, 12],
    ["فهد الزهراني", "at_risk", 1450, 2],
  ] as const;

  await prisma.customer.createMany({
    data: customers.map(([name, segment, ltv, orders], idx) => ({
      organizationId: org.id,
      name,
      segment,
      lifetimeValue: ltv,
      ordersCount: orders,
      lastOrderAt:
        segment === "at_risk"
          ? addDays(today, -28 - idx)
          : addDays(today, -(1 + (idx % 12))),
    })),
  });

  const leadNames = [
    "أمل الحمود",
    "بدر العيسى",
    "جواهر السالم",
    "حسن القحطاني",
    "دانة المطيري",
    "راشد الغامدي",
    "شهد العنزي",
    "طارق الشمري",
    "عبير الدوسري",
    "فيصل الحربي",
    "لؤي الزهراني",
    "منى العتيبي",
    "نواف المالكي",
    "هيفاء الشهراني",
    "وليد السبيعي",
    "ياسمين الفهد",
    "أحمد الزيد",
    "بتول الناصر",
    "تركي العجلان",
    "جواهر الرشيد",
    "خالد بن سعيد",
    "دلال العواد",
    "زايد القرني",
    "سعاد الثنيان",
    "عبدالرحمن القاضي",
    "غادة السليم",
    "فواز البقمي",
    "لمى الحميد",
    "مشعل الدعجاني",
    "نورة الفايز",
    "هشام العتيق",
    "وعد الشهري",
    "ياسر الخالدي",
    "أريج السديري",
    "بندر العلي",
    "تالا الحمود",
    "ثامر الربيع",
    "حصة العبدالوهاب",
    "سلطان النعيم",
    "شيماء القحطاني",
  ];

  const leadRows = leadNames.map((name, idx) => {
    const source = ["whatsapp", "instagram", "website", "referral", "whatsapp"][idx % 5];
    const createdAt = addDays(today, -(3 + (idx % 24)));
    let status = "new";
    let lastTouchAt: Date | null = createdAt;
    if (source === "whatsapp" && idx % 3 !== 0) {
      status = "neglected";
      lastTouchAt = addDays(createdAt, 1);
    } else if (idx % 7 === 0) {
      status = "converted";
      lastTouchAt = addDays(createdAt, 2);
    } else if (idx % 5 === 0) {
      status = "qualified";
      lastTouchAt = addDays(createdAt, 3);
    } else if (idx % 4 === 0) {
      status = "contacted";
      lastTouchAt = addDays(createdAt, 2);
    }
    return {
      organizationId: org.id,
      name,
      source,
      status,
      createdAt,
      lastTouchAt,
      estimatedValue: 400 + (idx % 8) * 220,
    };
  });

  await prisma.lead.createMany({ data: leadRows });

  await prisma.campaign.createMany({
    data: [
      {
        organizationId: org.id,
        nameAr: "حملة رمضان الضيافة",
        nameEn: "Ramadan hospitality campaign",
        channel: "meta",
        spend: 28600,
        revenue: 121400,
        clicks: 18420,
        conversions: 412,
        startDate: addDays(today, -88),
        endDate: addDays(today, -58),
      },
      {
        organizationId: org.id,
        nameAr: "عروض القهوة المنزلية",
        nameEn: "Home coffee offers",
        channel: "google",
        spend: 15400,
        revenue: 48200,
        clicks: 9210,
        conversions: 168,
        startDate: addDays(today, -70),
        endDate: addDays(today, -30),
      },
      {
        organizationId: org.id,
        nameAr: "إعلانات سناب العناية",
        nameEn: "Snapchat wellness ads",
        channel: "snapchat",
        spend: 22100,
        revenue: 31200,
        clicks: 24600,
        conversions: 141,
        startDate: addDays(today, -40),
        endDate: addDays(today, -5),
      },
      {
        organizationId: org.id,
        nameAr: "تاراكت العسل والسدر",
        nameEn: "Sidr honey retargeting",
        channel: "meta",
        spend: 9800,
        revenue: 41600,
        clicks: 6400,
        conversions: 188,
        startDate: addDays(today, -28),
        endDate: today,
      },
      {
        organizationId: org.id,
        nameAr: "حملة تيك توك واسعة",
        nameEn: "Broad TikTok prospecting",
        channel: "tiktok",
        spend: 19400,
        revenue: 16800,
        clicks: 31200,
        conversions: 74,
        startDate: addDays(today, -21),
        endDate: today,
      },
    ],
  });

  await prisma.employee.createMany({
    data: [
      { organizationId: org.id, name: "سلطان الدوسري", role: "مدير العمليات", department: "ops", salary: 14500, utilization: 0.94, overtimeHours: 18 },
      { organizationId: org.id, name: "مشاعل الحربي", role: "مشرفة المستودع", department: "warehouse", salary: 8200, utilization: 0.97, overtimeHours: 26 },
      { organizationId: org.id, name: "عبدالله القرني", role: "مندوب توصيل", department: "logistics", salary: 5500, utilization: 0.91, overtimeHours: 22 },
      { organizationId: org.id, name: "ليان العتيبي", role: "خدمة العملاء", department: "support", salary: 6200, utilization: 0.88, overtimeHours: 9 },
      { organizationId: org.id, name: "فارس الزهراني", role: "مسؤول مبيعات", department: "sales", salary: 7800, utilization: 0.73, overtimeHours: 4 },
      { organizationId: org.id, name: "هديل الشمري", role: "محتوى وتسويق", department: "marketing", salary: 7400, utilization: 0.81, overtimeHours: 6 },
      { organizationId: org.id, name: "ماجد السالم", role: "محاسب", department: "finance", salary: 9000, utilization: 0.86, overtimeHours: 7 },
      { organizationId: org.id, name: "روان القحطاني", role: "تعبئة وطلبات", department: "warehouse", salary: 4800, utilization: 0.96, overtimeHours: 24 },
    ],
  });

  const insights = [
    {
      id: "ins_conversion",
      slug: "checkout-conversion-drop",
      type: "problem",
      severity: "critical",
      pillar: "sales",
      titleAr: "انخفاض حاد في تحويل الدفع خلال أسبوعين",
      titleEn: "Sharp checkout conversion drop over two weeks",
      detectAr: "معدل التحويل هبط من 8.2٪ إلى 5.7٪ خلال 14 يوماً، رغم ارتفاع الزيارات.",
      detectEn: "Conversion fell from 8.2% to 5.7% in 14 days even as traffic rose.",
      diagnoseAr: "الجودة الإعلانية الأضعف أوصلت زواراً أقل نيةً للشراء، وتظهر احتكاكات في خطوة الدفع (رسوم الشحن تظهر متأخرة + فشل جزئي لمدى).",
      diagnoseEn: "Weaker ad quality is sending lower-intent traffic, and checkout friction is visible (late shipping fees + partial Mada failures).",
      predictAr: "إذا استمر المسار 30 يوماً إضافية ستفقد المنشأة نحو 84,000 ر.س من إجمالي الربح.",
      predictEn: "If the trend continues another 30 days the firm will lose about SAR 84,000 of gross profit.",
      recommendAr: "بسّط خطوة الشحن، فعّل مدى كخيار أول، وأوقف المجموعات الإعلانية منخفضة الجودة فوراً.",
      recommendEn: "Simplify the shipping step, surface Mada first, and pause the lowest-quality ad sets immediately.",
      narrativeAr:
        "مؤسسة النور كانت تحوّل زيارات المتجر بنسبة مستقرة قرب 8٪ معظم الربع. في الأسابيع الأخيرة ارتفع الإنفاق الإعلاني بينما هبط التحويل إلى 5.7٪. هذا ليس انهيار طلب — السلة تُملأ ثم تُهجر. التحليل يشير إلى سببين متزامنين: حملات تيك توك وسناب تجلب نقراً رخيصاً قليل النية، وصفحة الدفع تكشف رسوم الشحن في اللحظة الأخيرة مع تعثر جزئي لمدى. إصلاح المسار أسرع من شراء مزيد من الزيارات.",
      narrativeEn:
        "Al-Noor converted store visits near 8% for most of the quarter. Recently ad spend rose while conversion fell to 5.7%. Demand did not collapse — carts are filled then abandoned. Two causes coincide: TikTok and Snap campaigns buy cheap, low-intent clicks, and checkout reveals shipping fees late with partial Mada failures. Fixing the path is faster than buying more traffic.",
      financialEffect: 84000,
      predictedImpact: -84000,
      driversJson: JSON.stringify([
        { ar: "هجر السلة بعد كشف رسوم الشحن", en: "Cart abandonment after shipping fees appear" },
        { ar: "حملات تيك توك واسعة منخفضة النية", en: "Broad low-intent TikTok campaigns" },
        { ar: "فشل جزئي لمدى في الدفع", en: "Partial Mada failures at payment" },
      ]),
    },
    {
      id: "ins_cash",
      slug: "cash-runway-risk",
      type: "risk",
      severity: "high",
      pillar: "cashflow",
      titleAr: "ضغط سيولة: المخزون المدفوع مقدماً ومستحقات متأخرة",
      titleEn: "Liquidity pressure: prepaid inventory and late receivables",
      detectAr: "الرصيد النقدي انخفض من نحو 380 ألف إلى أقل من 170 ألف ر.س مع شراء مخزون كبير يوم 70.",
      detectEn: "Cash fell from about SAR 380k to under SAR 170k after a large day-70 inventory purchase.",
      diagnoseAr: "دفعة مخزون نقدية تزامنت مع تأخر تحصيل فواتير B2B لفندق النخيل وشركة أفق، بينما الموردون يُدفع لهم نقداً.",
      diagnoseEn: "A cash inventory restock coincided with late B2B collections from Palm Hotel and Ufuq, while suppliers are paid in cash.",
      predictAr: "بدون تحصيل أو تأجيل دفعات، قد تلامس السيولة حد الأمان التشغيلي خلال 18–22 يوماً.",
      predictEn: "Without collections or deferred payables, cash may hit the operating safety line in 18–22 days.",
      recommendAr: "حرّك تحصيل الفواتير المتأخرة هذا الأسبوع، وأعد جدولة دفعة المورد التالية إلى 21 يوماً.",
      recommendEn: "Chase overdue invoices this week and restage the next supplier payment to 21 days.",
      narrativeAr:
        "السيولة ليست أزمة إفلاس — هي أزمة توقيت. المنشأة اشترت مخزوناً نقداً ثم تأخر عملاؤها من فئة الضيافة في السداد. المصروفات التشغيلية مرتفعة في الوقت نفسه بسبب ساعات العمل الإضافي والشحن. القرار الصحيح اليوم إداري: تحصيل، لا خفض عشوائي للمبيعات.",
      narrativeEn:
        "This is a timing problem, not insolvency. The firm paid cash for inventory while hospitality clients paid late. Operating costs are also elevated from overtime and shipping. Today's correct move is collections management, not a blunt sales cut.",
      financialEffect: 72000,
      predictedImpact: -54000,
      driversJson: JSON.stringify([
        { ar: "شراء مخزون نقدي كبير", en: "Large cash inventory purchase" },
        { ar: "تأخر فواتير B2B", en: "Late B2B invoices" },
        { ar: "ارتفاع المصروف التشغيلي", en: "Rising operating spend" },
      ]),
    },
    {
      id: "ins_ops",
      slug: "ops-cost-inflation",
      type: "problem",
      severity: "high",
      pillar: "operational",
      titleAr: "تكلفة التشغيل ترتفع أسرع من الإيراد",
      titleEn: "Operating cost is rising faster than revenue",
      detectAr: "ساعات التجهيز صعدت فوق 24 ساعة، وثلاث وظائف مستودع/توصيل تسجّل ساعات إضافية مرتفعة.",
      detectEn: "Fulfillment time exceeded 24 hours and three warehouse/delivery roles show heavy overtime.",
      diagnoseAr: "ضغط الطلبات + نقص في زيت الأرغان والعسل يسبب إعادة التجهيز، والشحن الخارجي أصبح أغلى دون إعادة تفاوض.",
      diagnoseEn: "Order pressure plus Argan and honey stockouts force re-picks, and outbound shipping got more expensive without renegotiation.",
      predictAr: "كل أسبوع إضافي دون ضبط يبتلع نحو 9,500 ر.س من الهامش.",
      predictEn: "Each extra week without a fix consumes about SAR 9,500 of margin.",
      recommendAr: "أعد جدولة الورديات، تفاوض شريحة الشحن، وأوقف إعادة التجهيز الناتجة عن النفاد.",
      recommendEn: "Reshift coverage, renegotiate the shipping tier, and stop stockout-driven re-picks.",
      narrativeAr:
        "الفريق يعمل بجهد ظاهر — وهذا جزء من المشكلة. ساعات إضافية في المستودع تُخفي عنق زجاجة في التوفر لا في الاجتهاد. إصلاح المخزون عالي الدوران أرخص من توظيف فوري، لكن توظيف شخص واحد بدوام جزئي للتجهيز قد يخفض الإضافي خلال أسبوعين.",
      narrativeEn:
        "The team is visibly working hard — that is part of the problem. Warehouse overtime is hiding an availability bottleneck, not a motivation gap. Fixing fast-moving stock is cheaper than hiring immediately, though one part-time picker could cut overtime within two weeks.",
      financialEffect: 38000,
      predictedImpact: -38000,
      driversJson: JSON.stringify([
        { ar: "ساعات إضافية في المستودع", en: "Warehouse overtime" },
        { ar: "نفاد صنفين سريعين", en: "Two fast-movers stocked out" },
        { ar: "تعرفة شحن غير معاد التفاوض عليها", en: "Unrenegotiated shipping rates" },
      ]),
    },
    {
      id: "ins_leads",
      slug: "neglected-whatsapp-leads",
      type: "problem",
      severity: "high",
      pillar: "customer",
      titleAr: "عملاء محتملون على واتساب بلا متابعة",
      titleEn: "WhatsApp leads are going dark",
      detectAr: "أكثر من عشرين محادثة واتساب بقيَت في حالة «مهمل» لأكثر من 72 ساعة.",
      detectEn: "More than twenty WhatsApp conversations have sat in neglected status for over 72 hours.",
      diagnoseAr: "لا توجد ملاءمة بين وردية خدمة العملاء وذروة الرسائل المسائية، وليس هناك تسلسل رد آلي.",
      diagnoseEn: "Support coverage does not match evening message peaks, and there is no automated first-reply sequence.",
      predictAr: "قيمة الصفقات المقدّرة في هذه القائمة تقارب 28,000 ر.س قابلة للاسترداد خلال أسبوعين.",
      predictEn: "Estimated pipeline in that list is about SAR 28,000, recoverable within two weeks.",
      recommendAr: "فعّل رداً آلياً خلال 5 دقائق، وخصّص ساعة يومياً لتفريغ صندوق واتساب.",
      recommendEn: "Enable a 5-minute auto-reply and reserve a daily hour to clear the WhatsApp inbox.",
      narrativeAr:
        "الطلب موجود وهو يطرق الباب. الرسائل تصل، ثم تبرد. في تجارة تجزئة وضيافة، أول من يرد غالباً من يبيع. تجاهل واتساب هنا أخطر من حملة إعلانية ضعيفة لأنه عميل دفع تكلفة الاكتساب بالفعل.",
      narrativeEn:
        "Demand is already knocking. Messages arrive, then go cold. In retail and hospitality, the first reply usually wins. Ignoring WhatsApp here is costlier than a weak ad campaign because acquisition cost has already been paid.",
      financialEffect: 28000,
      predictedImpact: 28000,
      driversJson: JSON.stringify([
        { ar: "ذروة رسائل مسائية دون تغطية", en: "Evening message peak without coverage" },
        { ar: "غياب الرد الآلي الأول", en: "No first-reply automation" },
        { ar: "لا مالك واضح لصندوق واتساب", en: "No clear WhatsApp inbox owner" },
      ]),
    },
    {
      id: "ins_argan",
      slug: "argan-margin-opportunity",
      type: "opportunity",
      severity: "medium",
      pillar: "sales",
      titleAr: "زيت الأرغان الملكي: أعلى هامش وأضعف توفر",
      titleEn: "Royal Argan oil: highest margin, weakest availability",
      detectAr: "الهامش يقترب من 75٪ بينما المخزون 18 وحدة تحت نقطة إعادة الطلب 60.",
      detectEn: "Margin is near 75% while stock is 18 units against a reorder point of 60.",
      diagnoseAr: "الصنف يُباع كلما توفّر، لكن المشتريات فضّلت سماعات منخفضة الهامش لأنها «تتحرك».",
      diagnoseEn: "The SKU sells whenever it is in stock, but purchasing favoured low-margin earbuds because they «move».",
      predictAr: "إعادة التخزين + دفعة تسويق مركّزة لأسبوعين يمكن أن تضيف نحو 41,000 ر.س ربحاً.",
      predictEn: "Restocking plus a two-week focused push can add about SAR 41,000 of profit.",
      recommendAr: "اطلب 200 وحدة هذا الأسبوع، وأعد توجيه 15٪ من ميزانية تيك توك نحو هذه الصفحة.",
      recommendEn: "Order 200 units this week and shift 15% of TikTok budget onto this product page.",
      narrativeAr:
        "ليست كل الوحدات المباعة متساوية. السماعات تملأ التقارير حجماً وتُضعف الهامش. زيت الأرغان يفعل العكس: قليل الظهور، عالي الأثر. فرصة النمو هنا لا تتطلب اختراع منتج جديد — تتطلب أن يتوقف النقص عن قتل الطلب.",
      narrativeEn:
        "Not every unit sold is equal. Earbuds inflate volume and dilute margin. Argan oil does the opposite: scarce on the shelf, high in effect. Growth here does not need a new product — it needs stockouts to stop killing demand.",
      financialEffect: 41000,
      predictedImpact: 41000,
      driversJson: JSON.stringify([
        { ar: "هامش 75٪", en: "75% margin" },
        { ar: "مخزون تحت نقطة الطلب", en: "Stock below reorder point" },
        { ar: "ميزانية إعلان غير موجّهة للصنف", en: "Ad budget not pointed at the SKU" },
      ]),
    },
    {
      id: "ins_ads",
      slug: "ad-roi-dilution",
      type: "problem",
      severity: "medium",
      pillar: "marketing",
      titleAr: "عائد الإعلان يتآكل مع توسيع التغطية",
      titleEn: "Ad ROI is diluting as reach expands",
      detectAr: "حملات سناب وتيك توك الأخيرة تحقق عائداً قريباً من 1× مقابل 4× لحملة رمضان.",
      detectEn: "Recent Snap and TikTok campaigns return near 1× versus 4× on the Ramadan campaign.",
      diagnoseAr: "التوسيع تم بالجمهور الواسع والسعر المنخفض للنقرة، لا بالشركاء أو إعادة الاستهداف.",
      diagnoseEn: "Spend scaled through broad, cheap clicks instead of lookalikes or retargeting.",
      predictAr: "خفض 20٪ من الإنفاق واسع الاستهداف يعيد نحو 12,000 ر.س هامشاً شهرياً دون فقد مبيعات مماثل.",
      predictEn: "Cutting 20% of broad-prospecting spend returns about SAR 12,000 monthly margin without a matching sales loss.",
      recommendAr: "أوقف التوسيع الواسع، وأبقِ إعادة استهداف العسل والضيافة.",
      recommendEn: "Pause broad prospecting and keep honey and hospitality retargeting.",
      narrativeAr:
        "الإنفاق الإعلاني ليس مرتفعاً في المطلق — هو موجّه نحو القناة الخطأ. حملة رمضان أثبتت أن الرسالة الدقيقة تُرجع أربعة أضعاف. الحملات الحالية تشتري ضجيجاً. الطبيب هنا يوصي بالبتر الجزئي لا بوقف التسويق.",
      narrativeEn:
        "Ad spend is not absolutely high — it is pointed at the wrong channel. The Ramadan campaign proved a precise message can return 4×. Current campaigns buy noise. The prescription is a partial cut, not a marketing freeze.",
      financialEffect: 12000,
      predictedImpact: 12000,
      driversJson: JSON.stringify([
        { ar: "تيك توك واسع منخفض العائد", en: "Broad low-ROI TikTok" },
        { ar: "سناب عناية ضعيف التحويل", en: "Weak-converting Snap wellness" },
        { ar: "إعادة الاستهداف لا تزال مربحة", en: "Retargeting remains profitable" },
      ]),
    },
    {
      id: "ins_honey",
      slug: "honey-stockout-risk",
      type: "risk",
      severity: "medium",
      pillar: "operational",
      titleAr: "عسل السدر على وشك النفاد رغم الطلب",
      titleEn: "Sidr honey is near stockout despite demand",
      detectAr: "12 وحدة متبقية مقابل نقطة إعادة طلب 35، مع نفاد متكرر في آخر 18 يوماً.",
      detectEn: "12 units remain against a reorder point of 35, with repeated stockouts in the last 18 days.",
      diagnoseAr: "المورد يحتاج مهلة أطول مما يفترضه جدول المشتريات الحالي.",
      diagnoseEn: "The supplier lead time is longer than the current purchasing calendar assumes.",
      predictAr: "كل أسبوع نفاد يُقدَّر بفقدان 6,200 ر.س مبيعات مؤكدة تقريباً.",
      predictEn: "Each stockout week forfeits about SAR 6,200 of otherwise-certain sales.",
      recommendAr: "اطلب فوراً وحدّث نقطة إعادة الطلب لتعكس مهلة المورد الفعلية.",
      recommendEn: "Place the order now and reset the reorder point to the real supplier lead time.",
      narrativeAr:
        "عسل السدر من الأصناف التي لا تحتاج إقناعاً. الزبون يأتي من أجله. تركه ينفد هو إغلاق باب مفتوح. اربطه مع زيت الأرغان في طلبية واحدة لتقليل تكلفة الشحن الواردة.",
      narrativeEn:
        "Sidr honey is a product that needs no persuasion. Customers arrive for it. Letting it stock out is closing an open door. Combine it with the Argan restock to reduce inbound freight.",
      financialEffect: 18600,
      predictedImpact: 18600,
      driversJson: JSON.stringify([
        { ar: "مخزون 12 وحدة فقط", en: "Only 12 units left" },
        { ar: "مهلة مورد أطول من المتوقع", en: "Supplier lead time longer than assumed" },
        { ar: "نفاد متكرر حديث", en: "Recent repeated stockouts" },
      ]),
    },
  ];

  await prisma.insight.createMany({
    data: insights.map((row) => ({ ...row, organizationId: org.id })),
  });

  await prisma.action.createMany({
    data: [
      {
        id: "act_checkout",
        organizationId: org.id,
        insightId: "ins_conversion",
        titleAr: "إصلاح مسار الدفع وإبراز مدى",
        titleEn: "Fix checkout path and surface Mada",
        descriptionAr: "إخفاء رسوم الشحن المتأخرة، اختبار مدى كخيار أول، ومراقبة التحويل 7 أيام.",
        descriptionEn: "Remove late shipping-fee surprise, test Mada as first option, monitor conversion for 7 days.",
        status: "pending",
        priority: "urgent",
        estimatedEffect: 84000,
        beforeMetric: "5.7%",
        afterMetric: "7.1%",
        outcomeAr: "ارتفع التحويل من 5.7٪ إلى 7.1٪ خلال أسبوع، مع استرداد إيراد يقدَّر بـ 84,000 ر.س على أساس شهري.",
        outcomeEn: "Conversion rose from 5.7% to 7.1% in a week, recovering an estimated SAR 84,000 of monthly revenue.",
      },
      {
        id: "act_whatsapp",
        organizationId: org.id,
        insightId: "ins_leads",
        titleAr: "تفريغ صندوق واتساب وتفعيل الرد الآلي",
        titleEn: "Clear WhatsApp inbox and enable auto-reply",
        descriptionAr: "ساعة يومية مملوكة + رد أول خلال خمس دقائق لكل محادثة جديدة.",
        descriptionEn: "Named daily hour plus a first reply within five minutes for every new thread.",
        status: "pending",
        priority: "high",
        estimatedEffect: 28000,
        beforeMetric: "22 neglected",
        afterMetric: "4 neglected",
        outcomeAr: "انخفضت المحادثات المهملة من 22 إلى 4، وتحوّل 9 عملاء بقيمة 19,400 ر.س.",
        outcomeEn: "Neglected threads fell from 22 to 4, and 9 leads converted for SAR 19,400.",
      },
      {
        id: "act_argan",
        organizationId: org.id,
        insightId: "ins_argan",
        titleAr: "إعادة تخزين الأرغان وتحويل 15٪ من ميزانية تيك توك",
        titleEn: "Restock Argan and shift 15% of TikTok budget",
        descriptionAr: "طلب 200 وحدة وإعادة توجيه الميزانية إلى صفحة المنتج لأسبوعين.",
        descriptionEn: "Order 200 units and point budget at the product page for two weeks.",
        status: "in_progress",
        priority: "high",
        estimatedEffect: 41000,
        beforeMetric: "18 units",
        afterMetric: "210 units",
        outcomeAr: "وصل المخزون إلى 210 وحدات وارتفعت مبيعات الصنف 62٪ مع هامش محفوظ.",
        outcomeEn: "Stock reached 210 units and SKU sales rose 62% with margin intact.",
      },
      {
        id: "act_shipping",
        organizationId: org.id,
        insightId: "ins_ops",
        titleAr: "إعادة التفاوض على شريحة الشحن",
        titleEn: "Renegotiate shipping tier",
        descriptionAr: "طلب تسعيرة من مشغّلين وربط الحجم الحالي بخصم الشريحة التالية.",
        descriptionEn: "Get two carrier quotes and attach current volume to the next-tier discount.",
        status: "pending",
        priority: "medium",
        estimatedEffect: 16000,
        beforeMetric: "SAR 28 / order",
        afterMetric: "SAR 21 / order",
        outcomeAr: "انخفض متوسط الشحن من 28 إلى 21 ر.س لكل طلب، بوفورات شهرية تقارب 11,200 ر.س.",
        outcomeEn: "Average shipping fell from SAR 28 to SAR 21 per order, about SAR 11,200 monthly savings.",
      },
      {
        id: "act_collect",
        organizationId: org.id,
        insightId: "ins_cash",
        titleAr: "تحصيل فواتير الضيافة المتأخرة",
        titleEn: "Collect overdue hospitality invoices",
        descriptionAr: "اتصال اليوم مع فندق النخيل وشركة أفق، وعرض خصم 2٪ للسداد خلال 5 أيام.",
        descriptionEn: "Call Palm Hotel and Ufuq today; offer 2% for payment within 5 days.",
        status: "pending",
        priority: "urgent",
        estimatedEffect: 54000,
        beforeMetric: "SAR 168k cash",
        afterMetric: "SAR 222k cash",
        outcomeAr: "تم تحصيل 54,000 ر.س خلال أربعة أيام وارتفع الرصيد فوق خط الأمان.",
        outcomeEn: "SAR 54,000 was collected in four days and cash moved back above the safety line.",
      },
      {
        id: "act_ads",
        organizationId: org.id,
        insightId: "ins_ads",
        titleAr: "إيقاف التوسيع الإعلاني واسع الاستهداف",
        titleEn: "Pause broad-prospecting ad sets",
        descriptionAr: "إيقاف مجموعات تيك توك وسناب منخفضة العائد مع الإبقاء على إعادة الاستهداف.",
        descriptionEn: "Pause low-ROI TikTok and Snap ad sets; keep retargeting live.",
        status: "done",
        priority: "medium",
        estimatedEffect: 12000,
        executedAt: addDays(today, -2),
        beforeMetric: "1.1x ROI",
        afterMetric: "2.4x blended ROI",
        outcomeAr: "بعد إيقاف التوسيع الواسع تحسّن العائد المدمج من 1.1× إلى 2.4× مع انخفاض الإنفاق 18٪.",
        outcomeEn: "After pausing broad prospecting, blended ROI moved from 1.1× to 2.4× with 18% less spend.",
      },
    ],
  });

  const sources = [
    { id: "src_sales", key: "sales", nameAr: "المبيعات والفواتير", nameEn: "Sales / invoices", category: "finance", connected: true },
    { id: "src_expenses", key: "expenses", nameAr: "المصروفات", nameEn: "Expenses", category: "finance", connected: true },
    { id: "src_banking", key: "banking", nameAr: "البنك والسيولة", nameEn: "Banking / cash", category: "finance", connected: false },
    { id: "src_inventory", key: "inventory", nameAr: "المخزون", nameEn: "Inventory", category: "ops", connected: true },
    { id: "src_crm", key: "crm", nameAr: "إدارة العملاء", nameEn: "CRM", category: "customer", connected: false },
    { id: "src_ecommerce", key: "ecommerce", nameAr: "المتجر الإلكتروني", nameEn: "E-commerce", category: "sales", connected: true },
    { id: "src_ads", key: "ads", nameAr: "الإعلانات", nameEn: "Ads", category: "marketing", connected: false },
    { id: "src_whatsapp", key: "whatsapp", nameAr: "واتساب", nameEn: "WhatsApp", category: "customer", connected: false },
    { id: "src_employees", key: "employees", nameAr: "الموظفون", nameEn: "Employees", category: "ops", connected: false },
    { id: "src_bookings", key: "bookings", nameAr: "الحجوزات", nameEn: "Bookings", category: "sales", connected: false },
  ];

  await prisma.dataSource.createMany({
    data: sources.map((s) => ({
      ...s,
      organizationId: org.id,
      lastSyncAt: s.connected ? addDays(today, -1) : null,
    })),
  });

  const briefingItemsAr = [
    {
      rank: 1,
      kind: "urgent",
      title: "تحويل الدفع ينهار بهدوء",
      body: "من 8.2٪ إلى 5.7٪ في أسبوعين. الزيارات ترتفع والمبيعات لا تتبعها. ابدأ اليوم بمسار الدفع لا بزيادة الإعلان.",
      insightSlug: "checkout-conversion-drop",
      effectSar: 84000,
    },
    {
      rank: 2,
      kind: "risk",
      title: "السيولة تضيق بعد شراء المخزون",
      body: "الرصيد تحت 170 ألف ر.س وفواتير الضيافة متأخرة. حرّك التحصيل هذا الأسبوع قبل أن يلمس التشغيل حد الأمان.",
      insightSlug: "cash-runway-risk",
      effectSar: 54000,
    },
    {
      rank: 3,
      kind: "opportunity",
      title: "زيت الأرغان يربح ثم يختفي من الرف",
      body: "أعلى هامش في الكتالوج وأضعف توفر. طلبية 200 وحدة تحول نقصاً إلى نمو دون منتج جديد.",
      insightSlug: "argan-margin-opportunity",
      effectSar: 41000,
    },
    {
      rank: 4,
      kind: "growth",
      title: "واتساب فيه طلب مدفوع بلا رد",
      body: "أكثر من عشرين محادثة باردة. العميل دفع تكلفة الوصول مسبقاً — الرد اليوم أرخص من أي حملة.",
      insightSlug: "neglected-whatsapp-leads",
      effectSar: 28000,
    },
    {
      rank: 5,
      kind: "recommendation",
      title: "اقطع الضجيج الإعلاني لا التسويق",
      body: "تيك توك وسناب الواسعَان يبتلعان الهامش. أبقِ إعادة الاستهداف وأوقف التوسيع الرخيص.",
      insightSlug: "ad-roi-dilution",
      effectSar: 12000,
    },
  ];

  const briefingItemsEn = [
    {
      rank: 1,
      kind: "urgent",
      title: "Checkout conversion is quietly breaking",
      body: "From 8.2% to 5.7% in two weeks. Traffic is up; sales are not. Start with the payment path, not more ads.",
      insightSlug: "checkout-conversion-drop",
      effectSar: 84000,
    },
    {
      rank: 2,
      kind: "risk",
      title: "Cash is tightening after the inventory buy",
      body: "Balance is under SAR 170k and hospitality invoices are late. Move collections this week before operations hits the safety line.",
      insightSlug: "cash-runway-risk",
      effectSar: 54000,
    },
    {
      rank: 3,
      kind: "opportunity",
      title: "Argan oil earns — then vanishes from the shelf",
      body: "Highest catalogue margin, weakest availability. A 200-unit PO turns a stockout into growth without a new product.",
      insightSlug: "argan-margin-opportunity",
      effectSar: 41000,
    },
    {
      rank: 4,
      kind: "growth",
      title: "WhatsApp holds paid demand with no reply",
      body: "More than twenty cold threads. Acquisition is already paid — a reply today is cheaper than any campaign.",
      insightSlug: "neglected-whatsapp-leads",
      effectSar: 28000,
    },
    {
      rank: 5,
      kind: "recommendation",
      title: "Cut ad noise, not marketing",
      body: "Broad TikTok and Snap are eating margin. Keep retargeting; pause cheap reach.",
      insightSlug: "ad-roi-dilution",
      effectSar: 12000,
    },
  ];

  await prisma.briefing.createMany({
    data: [
      {
        organizationId: org.id,
        date: today,
        locale: "ar",
        greeting: "صباح الخير. هذه أهم 5 أشياء تحتاج انتباهك اليوم",
        summary:
          "المنشأة ليست مريضة في الطلب — هي متعبة في التحويل والسيولة والتوفر. أصلح مسار الدفع، حصّل الفواتير، وأعد الأرغان إلى الرف قبل أن تشتري مزيداً من الزيارات.",
        itemsJson: JSON.stringify(briefingItemsAr),
        source: "seed",
      },
      {
        organizationId: org.id,
        date: today,
        locale: "en",
        greeting: "Good morning. These are the 5 things that need your attention today",
        summary:
          "Demand is not the disease — conversion, cash timing, and availability are. Fix checkout, collect invoices, and put Argan back on the shelf before buying more traffic.",
        itemsJson: JSON.stringify(briefingItemsEn),
        source: "seed",
      },
    ],
  });

  const last = dailyRows[dailyRows.length - 1];
  const last14 = dailyRows.slice(-14);
  const prev14 = dailyRows.slice(-28, -14);
  const conv =
    last14.reduce((s, d) => s + d.conversions, 0) /
    Math.max(1, last14.reduce((s, d) => s + d.sessions, 0));
  const prevConv =
    prev14.reduce((s, d) => s + d.conversions, 0) /
    Math.max(1, prev14.reduce((s, d) => s + d.sessions, 0));

  console.log("Seeded مؤسسة النور للتجارة");
  console.log("  login: demo@businessdoctor.ai / demo1234");
  console.log(`  days: ${dailyRows.length}`);
  console.log(`  cash now: ${last.cashBalance} SAR`);
  console.log(`  conversion last14: ${(conv * 100).toFixed(1)}%  prev14: ${(prevConv * 100).toFixed(1)}%`);

  if (options?.disconnect) await prisma.$disconnect();
  return { seeded: true, skipped: false as const };
}
