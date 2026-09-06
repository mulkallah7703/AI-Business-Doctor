import { IMPORT_KINDS, type ImportKind } from "@/lib/connectors";

export type FieldDef = {
  key: string;
  required: boolean;
  aliases: string[];
  labelAr: string;
  labelEn: string;
};

export const KIND_FIELDS: Record<ImportKind, FieldDef[]> = {
  sales: [
    { key: "date", required: true, labelAr: "التاريخ", labelEn: "Date", aliases: ["date", "day", "التاريخ", "اليوم", "تاريخ"] },
    {
      key: "revenue",
      required: true,
      labelAr: "الإيراد",
      labelEn: "Revenue",
      aliases: ["revenue", "sales", "amount", "total", "الإيراد", "المبيعات", "المبلغ", "قيمة"],
    },
    { key: "orders", required: false, labelAr: "الطلبات", labelEn: "Orders", aliases: ["orders", "order_count", "الطلبات", "عدد_الطلبات"] },
    { key: "sessions", required: false, labelAr: "الزيارات", labelEn: "Sessions", aliases: ["sessions", "visits", "الزيارات", "جلسات"] },
    { key: "conversions", required: false, labelAr: "التحويلات", labelEn: "Conversions", aliases: ["conversions", "التحويلات"] },
    { key: "refunds", required: false, labelAr: "المرتجعات", labelEn: "Refunds", aliases: ["refunds", "المرتجعات"] },
    { key: "cogs", required: false, labelAr: "تكلفة البضاعة", labelEn: "COGS", aliases: ["cogs", "cost_of_goods", "تكلفة_البضاعه", "التكلفة"] },
  ],
  expenses: [
    { key: "date", required: true, labelAr: "التاريخ", labelEn: "Date", aliases: ["date", "day", "التاريخ", "تاريخ"] },
    {
      key: "amount",
      required: true,
      labelAr: "المبلغ",
      labelEn: "Amount",
      aliases: ["amount", "expenses", "expense", "cost", "المصروفات", "المصروف", "المبلغ"],
    },
    {
      key: "category",
      required: false,
      labelAr: "التصنيف",
      labelEn: "Category",
      aliases: ["category", "type", "الفئه", "التصنيف", "النوع"],
    },
    { key: "note", required: false, labelAr: "ملاحظة", labelEn: "Note", aliases: ["note", "notes", "description", "ملاحظه", "الوصف"] },
    { key: "cogs", required: false, labelAr: "تكلفة البضاعة", labelEn: "COGS", aliases: ["cogs", "cost_of_goods", "تكلفة_البضاعه"] },
    { key: "adSpend", required: false, labelAr: "الإنفاق الإعلاني", labelEn: "Ad spend", aliases: ["ad_spend", "ads", "الإنفاق_الإعلاني", "اعلان"] },
    { key: "cashOut", required: false, labelAr: "الصادر النقدي", labelEn: "Cash out", aliases: ["cash_out", "الصادر", "نقد_خارج"] },
  ],
  customers: [
    { key: "name", required: true, labelAr: "الاسم", labelEn: "Name", aliases: ["name", "customer", "الاسم", "العميل"] },
    { key: "email", required: false, labelAr: "البريد", labelEn: "Email", aliases: ["email", "e_mail", "البريد", "الايميل"] },
    { key: "phone", required: false, labelAr: "الجوال", labelEn: "Phone", aliases: ["phone", "mobile", "whatsapp", "الجوال", "الهاتف", "واتساب"] },
    { key: "segment", required: false, labelAr: "الشريحة", labelEn: "Segment", aliases: ["segment", "الشريحه"] },
    { key: "status", required: false, labelAr: "الحالة", labelEn: "Status", aliases: ["status", "الحاله"] },
    { key: "source", required: false, labelAr: "المصدر", labelEn: "Source", aliases: ["source", "المصدر"] },
    { key: "lifetimeValue", required: false, labelAr: "القيمة مدى الحياة", labelEn: "Lifetime value", aliases: ["ltv", "lifetime_value", "القيمه_مدى_الحياه"] },
    { key: "ordersCount", required: false, labelAr: "عدد الطلبات", labelEn: "Orders count", aliases: ["orders", "orders_count", "الطلبات"] },
    { key: "lastOrderAt", required: false, labelAr: "آخر طلب", labelEn: "Last order", aliases: ["last_order", "last_order_at", "اخر_طلب"] },
  ],
  leads: [
    { key: "name", required: true, labelAr: "الاسم", labelEn: "Name", aliases: ["name", "lead", "الاسم"] },
    { key: "email", required: false, labelAr: "البريد", labelEn: "Email", aliases: ["email", "e_mail", "البريد", "الايميل"] },
    { key: "phone", required: false, labelAr: "الجوال", labelEn: "Phone", aliases: ["phone", "mobile", "whatsapp", "الجوال", "الهاتف", "واتساب"] },
    { key: "source", required: false, labelAr: "المصدر", labelEn: "Source", aliases: ["source", "المصدر"] },
    { key: "status", required: false, labelAr: "الحالة", labelEn: "Status", aliases: ["status", "الحاله"] },
    { key: "estimatedValue", required: false, labelAr: "القيمة التقديرية", labelEn: "Estimated value", aliases: ["value", "estimated_value", "القيمه"] },
    { key: "createdAt", required: false, labelAr: "تاريخ الإنشاء", labelEn: "Created at", aliases: ["created", "created_at", "التاريخ"] },
  ],
  inventory: [
    { key: "sku", required: true, labelAr: "الرمز", labelEn: "SKU", aliases: ["sku", "code", "الرمز", "الكود"] },
    { key: "nameAr", required: false, labelAr: "الاسم", labelEn: "Name", aliases: ["name_ar", "name", "الاسم", "المنتج"] },
    { key: "nameEn", required: false, labelAr: "الاسم الإنجليزي", labelEn: "English name", aliases: ["name_en", "english_name"] },
    { key: "category", required: false, labelAr: "الفئة", labelEn: "Category", aliases: ["category", "الفئه"] },
    { key: "price", required: true, labelAr: "السعر", labelEn: "Price", aliases: ["price", "السعر"] },
    { key: "cost", required: false, labelAr: "التكلفة", labelEn: "Cost", aliases: ["cost", "التكلفه"] },
    { key: "stock", required: true, labelAr: "الكمية", labelEn: "Quantity", aliases: ["stock", "qty", "quantity", "المخزون", "الكميه"] },
    { key: "reorderPoint", required: false, labelAr: "نقطة إعادة الطلب", labelEn: "Reorder point", aliases: ["reorder", "reorder_point", "نقطه_الطلب"] },
  ],
  campaigns: [
    { key: "nameAr", required: true, labelAr: "اسم الحملة", labelEn: "Campaign name", aliases: ["name_ar", "name", "campaign", "الاسم", "الحمله"] },
    { key: "nameEn", required: false, labelAr: "الاسم الإنجليزي", labelEn: "English name", aliases: ["name_en"] },
    { key: "channel", required: true, labelAr: "القناة", labelEn: "Channel", aliases: ["channel", "platform", "القناه"] },
    { key: "spend", required: true, labelAr: "الإنفاق", labelEn: "Spend", aliases: ["spend", "cost", "ad_spend", "الإنفاق"] },
    { key: "revenue", required: false, labelAr: "إيراد الحملة", labelEn: "Campaign revenue", aliases: ["revenue", "revenue_or_conversions", "الإيراد"] },
    { key: "clicks", required: false, labelAr: "النقرات", labelEn: "Clicks", aliases: ["clicks", "النقرات"] },
    { key: "conversions", required: false, labelAr: "التحويلات", labelEn: "Conversions", aliases: ["conversions", "التحويلات"] },
    { key: "startDate", required: false, labelAr: "تاريخ البداية", labelEn: "Start date", aliases: ["start", "start_date", "البدايه"] },
    { key: "endDate", required: false, labelAr: "تاريخ النهاية", labelEn: "End date", aliases: ["end", "end_date", "النهايه"] },
  ],
  employees: [
    { key: "name", required: true, labelAr: "الاسم", labelEn: "Name", aliases: ["name", "employee", "الاسم", "الموظف"] },
    { key: "role", required: false, labelAr: "الدور", labelEn: "Role", aliases: ["role", "title", "الدور", "المسمى"] },
    { key: "department", required: false, labelAr: "القسم", labelEn: "Department", aliases: ["department", "dept", "القسم"] },
    { key: "salary", required: false, labelAr: "الراتب", labelEn: "Salary", aliases: ["salary", "payroll", "pay", "الراتب", "الاجر"] },
    { key: "utilization", required: false, labelAr: "الاستغلال", labelEn: "Utilization", aliases: ["utilization", "util", "الاستغلال"] },
    { key: "overtimeHours", required: false, labelAr: "ساعات إضافية", labelEn: "Overtime hours", aliases: ["overtime", "overtime_hours", "ساعات_اضافيه"] },
  ],
  ops: [
    { key: "date", required: true, labelAr: "التاريخ", labelEn: "Date", aliases: ["date", "day", "التاريخ", "تاريخ"] },
    { key: "headcount", required: false, labelAr: "عدد الموظفين", labelEn: "Headcount", aliases: ["headcount", "staff", "employees", "العدد", "الموظفون"] },
    { key: "payroll", required: false, labelAr: "الرواتب", labelEn: "Payroll", aliases: ["payroll", "salaries", "wages", "الرواتب", "الاجور"] },
    { key: "utilization", required: false, labelAr: "الاستغلال", labelEn: "Utilization", aliases: ["utilization", "util", "الاستغلال"] },
    { key: "fulfillmentHours", required: false, labelAr: "ساعات التجهيز", labelEn: "Fulfillment hours", aliases: ["fulfillment", "fulfillment_hours", "ساعات_التجهيز"] },
    { key: "overtimeHours", required: false, labelAr: "ساعات إضافية", labelEn: "Overtime hours", aliases: ["overtime", "overtime_hours", "ساعات_اضافيه"] },
  ],
};

export function isImportKind(value: string): value is ImportKind {
  return (IMPORT_KINDS as readonly string[]).includes(value);
}

export function normalizeHeader(value: string) {
  return value
    .trim()
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "");
}

export function suggestMapping(columns: string[], kind: ImportKind) {
  const mapping: Record<string, string> = {};
  const used = new Set<string>();
  const normalized = columns.map((column) => ({
    column,
    key: normalizeHeader(column),
  }));

  for (const field of KIND_FIELDS[kind]) {
    const aliases = new Set(field.aliases.map(normalizeHeader).concat(normalizeHeader(field.key)));
    const match = normalized.find((item) => !used.has(item.column) && aliases.has(item.key));
    if (match) {
      mapping[field.key] = match.column;
      used.add(match.column);
    }
  }
  return mapping;
}

const SAMPLE_ROWS: Record<ImportKind, string> = {
  sales: [
    "date,revenue,orders,sessions,conversions,cogs",
    "2026-08-01,18400,42,610,42,8100",
    "2026-08-02,21150,49,640,49,9300",
    "2026-08-03,19680,45,590,45,8600",
    "2026-08-04,17320,39,560,38,7900",
    "2026-08-05,22840,52,680,51,10100",
  ].join("\n") + "\n",
  expenses: [
    "date,amount,category,note",
    "2026-08-01,4200,opex,إيجار المستودع",
    "2026-08-01,8100,cogs,تكلفة البضاعة",
    "2026-08-02,1750,ads,إعلان ميتا",
    "2026-08-03,3900,opex,رواتب تشغيل",
    "2026-08-04,2100,ads,إعلان جوجل",
  ].join("\n") + "\n",
  customers: [
    "name,email,phone,status,source,lifetimeValue,ordersCount,lastOrderAt",
    "شركة أفق,ofoq@example.com,0501111111,vip,referral,42000,18,2026-08-20",
    "نورة العتيبي,noura@example.com,0502222222,regular,store,5400,7,2026-08-28",
    "خالد السبيعي,khaled@example.com,0503333333,at_risk,whatsapp,2100,3,2026-07-15",
    "سارة الدوسري,sara@example.com,0504444444,new,instagram,189,1,2026-08-30",
  ].join("\n") + "\n",
  leads: [
    "name,email,phone,source,status,estimatedValue,createdAt",
    "أمل الحمود,amal@example.com,0551111111,whatsapp,new,1200,2026-08-25",
    "بدر العيسى,badr@example.com,0552222222,instagram,neglected,900,2026-08-18",
    "جواهر السالم,jawaher@example.com,0553333333,website,new,2400,2026-08-22",
    "حسن القحطاني,hassan@example.com,0554444444,referral,open,1800,2026-08-27",
  ].join("\n") + "\n",
  inventory: [
    "sku,name,price,cost,quantity,reorder_point",
    "ARG-50,زيت الأرغان,189,48,18,60",
    "HOSP-01,طقم ضيافة,289,142,80,40",
    "SIDR-500,عسل سدر,249,96,12,35",
    "COF-01,دلة قهوة,329,148,41,15",
  ].join("\n") + "\n",
  campaigns: [
    "name,channel,spend,revenue,conversions,start_date,end_date",
    "حملة رمضان,meta,12000,48000,190,2026-07-01,2026-07-30",
    "عروض القهوة,google,8400,22100,88,2026-07-10,2026-07-31",
    "سناب العناية,snapchat,6100,9800,41,2026-08-01,2026-08-20",
    "تيك توك واسع,tiktok,9300,7200,29,2026-08-05,2026-08-25",
  ].join("\n") + "\n",
  employees: [
    "name,role,department,salary,utilization,overtime_hours",
    "سلطان الدوسري,مدير العمليات,ops,14500,0.94,18",
    "مشاعل الحربي,مشرفة المستودع,warehouse,8200,0.97,26",
    "ليان العتيبي,خدمة العملاء,support,6200,0.88,9",
    "فارس الزهراني,مسؤول مبيعات,sales,7800,0.73,4",
  ].join("\n") + "\n",
  ops: [
    "date,headcount,payroll,utilization,fulfillment_hours",
    "2026-08-01,8,62000,0.91,19.5",
    "2026-08-02,8,62000,0.88,21.0",
    "2026-08-03,9,65500,0.93,18.4",
    "2026-08-04,9,65500,0.86,22.2",
  ].join("\n") + "\n",
};

export function sampleCsv(kind: ImportKind) {
  return SAMPLE_ROWS[kind];
}

export function kindLabels(kind: ImportKind) {
  return {
    sales: { ar: "مبيعات / طلبات", en: "Sales / orders" },
    expenses: { ar: "مصروفات", en: "Expenses" },
    customers: { ar: "عملاء", en: "Customers" },
    leads: { ar: "فرص", en: "Leads" },
    inventory: { ar: "مخزون", en: "Inventory" },
    campaigns: { ar: "حملات", en: "Campaigns" },
    employees: { ar: "موظفون", en: "Employees" },
    ops: { ar: "مؤشرات تشغيل", en: "Ops KPIs" },
  }[kind];
}
