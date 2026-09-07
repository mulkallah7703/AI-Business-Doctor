export const DEMO_ORG_ID = "org_alnoor";
export const DEMO_USER_ID = "user_demo";
export const DEMO_EMAIL = "demo@businessdoctor.ai";

export type IngestMode = "upload" | "manual" | "oauth";
export type SourceStatus = "disconnected" | "connected" | "syncing" | "error" | "coming_soon";
export const IMPORT_KINDS = [
  "sales",
  "expenses",
  "customers",
  "leads",
  "inventory",
  "campaigns",
  "employees",
  "ops",
] as const;

export type ImportKind = (typeof IMPORT_KINDS)[number];

export type ConnectorDef = {
  key: string;
  nameAr: string;
  nameEn: string;
  category: string;
  ingestMode: IngestMode;
  importKinds: ImportKind[];
  comingSoonProvider?: string;
  descriptionAr: string;
  descriptionEn: string;
};

export const CONNECTOR_CATALOG: ConnectorDef[] = [
  {
    key: "sales",
    nameAr: "المبيعات والطلبات",
    nameEn: "Sales / orders",
    category: "finance",
    ingestMode: "upload",
    importKinds: ["sales"],
    descriptionAr: "ارفع ملف CSV أو Excel للمبيعات اليومية — يظهر الإيراد في مركز القيادة فوراً.",
    descriptionEn: "Upload a CSV or Excel of daily sales — revenue appears on the command center immediately.",
  },
  {
    key: "expenses",
    nameAr: "المصروفات",
    nameEn: "Expenses",
    category: "finance",
    ingestMode: "upload",
    importKinds: ["expenses"],
    descriptionAr: "استورد المصروف اليومي أو الأسبوعي ليحسب الربح والتكاليف على بيانات منشأتك.",
    descriptionEn: "Import daily or weekly expenses so profit and cost run on your own numbers.",
  },
  {
    key: "banking",
    nameAr: "البنك والسيولة",
    nameEn: "Banking / cash",
    category: "finance",
    ingestMode: "oauth",
    importKinds: [],
    comingSoonProvider: "Open Banking",
    descriptionAr: "ربط الحساب البنكي قادم في المرحلة التالية. أدخل الرصيد يدوياً حتى ذلك الحين.",
    descriptionEn: "Bank linking ships in a later phase. Enter cash manually until then.",
  },
  {
    key: "inventory",
    nameAr: "المخزون",
    nameEn: "Inventory",
    category: "ops",
    ingestMode: "upload",
    importKinds: ["inventory"],
    descriptionAr: "ارفع الأصناف: الرمز، السعر، التكلفة، والكمية — لرصد النفاد ونقطة إعادة الطلب.",
    descriptionEn: "Upload SKUs with price, cost, and stock to watch stockouts and reorder points.",
  },
  {
    key: "crm",
    nameAr: "العملاء والفرص",
    nameEn: "Customers / leads",
    category: "customer",
    ingestMode: "upload",
    importKinds: ["customers", "leads"],
    descriptionAr: "استورد العملاء أو العملاء المحتملين من ملف واحد — بلا نسخ من بيانات العرض.",
    descriptionEn: "Import customers or leads from a file — never copied from the demo tenant.",
  },
  {
    key: "ecommerce",
    nameAr: "المتجر الإلكتروني",
    nameEn: "E-commerce",
    category: "sales",
    ingestMode: "oauth",
    importKinds: [],
    comingSoonProvider: "Salla",
    descriptionAr: "ربط سلة وزد قادم. استخدم رفع المبيعات اليوم.",
    descriptionEn: "Salla and Zid OAuth is coming. Use the sales upload today.",
  },
  {
    key: "ads",
    nameAr: "الإعلانات",
    nameEn: "Ads",
    category: "marketing",
    ingestMode: "oauth",
    importKinds: ["campaigns"],
    comingSoonProvider: "Meta Ads",
    descriptionAr: "ربط ميتا وجوجل قادم. يمكنك رفع ملف الحملات يدوياً الآن.",
    descriptionEn: "Meta and Google OAuth is coming. You can upload a campaigns file today.",
  },
  {
    key: "whatsapp",
    nameAr: "واتساب",
    nameEn: "WhatsApp",
    category: "customer",
    ingestMode: "oauth",
    importKinds: [],
    comingSoonProvider: "WhatsApp Business",
    descriptionAr: "واجهة واتساب للأعمال قيد التجهيز. ارفع العملاء المحتملين من ملف مؤقتاً.",
    descriptionEn: "WhatsApp Business API is in progress. Upload leads from a file for now.",
  },
  {
    key: "employees",
    nameAr: "الموظفون",
    nameEn: "Employees",
    category: "ops",
    ingestMode: "upload",
    importKinds: ["employees", "ops"],
    descriptionAr: "ارفع كشف الموظفين أو مؤشرات التشغيل اليومية: العدد، الرواتب، والاستغلال.",
    descriptionEn: "Upload a staff roster or daily ops KPIs: headcount, payroll, and utilization.",
  },
  {
    key: "bookings",
    nameAr: "الحجوزات",
    nameEn: "Bookings",
    category: "sales",
    ingestMode: "oauth",
    importKinds: [],
    comingSoonProvider: "Booking platforms",
    descriptionAr: "موصل الحجوزات قادم. المبيعات اليومية تغطي معظم الأثر حتى ذلك الحين.",
    descriptionEn: "Bookings connectors are coming. Daily sales cover most of the effect until then.",
  },
];

export function connectorByKey(key: string) {
  return CONNECTOR_CATALOG.find((item) => item.key === key);
}

/** True when the Sources card must open the CSV/Excel upload flow. */
export function sourceAcceptsUpload(source: { importKinds: readonly string[] }) {
  return source.importKinds.length > 0;
}

export function defaultImportKind(source: { importKinds: readonly ImportKind[] }): ImportKind | null {
  return source.importKinds[0] ?? null;
}

export const SECTORS = [
  { key: "retail_ecommerce", ar: "تجزئة وتجارة إلكترونية", en: "Retail & e-commerce" },
  { key: "hospitality", ar: "ضيافة ومطاعم", en: "Hospitality & restaurants" },
  { key: "services", ar: "خدمات مهنية", en: "Professional services" },
  { key: "manufacturing", ar: "تصنيع", en: "Manufacturing" },
  { key: "healthcare", ar: "صحة", en: "Healthcare" },
  { key: "other", ar: "أخرى", en: "Other" },
] as const;

export const CURRENCIES = ["SAR", "AED", "KWD", "BHD", "OMR", "QAR", "USD", "EUR"] as const;
