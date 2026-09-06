import type { ImportKind } from "@/lib/connectors";

export type FieldDef = {
  key: string;
  required: boolean;
  aliases: string[];
};

export const KIND_FIELDS: Record<ImportKind, FieldDef[]> = {
  sales: [
    { key: "date", required: true, aliases: ["date", "day", "التاريخ", "اليوم", "تاريخ"] },
    {
      key: "revenue",
      required: true,
      aliases: ["revenue", "sales", "amount", "total", "الإيراد", "المبيعات", "المبلغ", "قيمة"],
    },
    { key: "orders", required: false, aliases: ["orders", "order_count", "الطلبات", "عدد_الطلبات"] },
    { key: "sessions", required: false, aliases: ["sessions", "visits", "الزيارات", "جلسات"] },
    { key: "conversions", required: false, aliases: ["conversions", "التحويلات"] },
    { key: "refunds", required: false, aliases: ["refunds", "المرتجعات"] },
    { key: "cogs", required: false, aliases: ["cogs", "cost_of_goods", "تكلفة_البضاعه", "التكلفة"] },
  ],
  expenses: [
    { key: "date", required: true, aliases: ["date", "day", "التاريخ", "تاريخ"] },
    { key: "expenses", required: true, aliases: ["expenses", "expense", "amount", "المصروفات", "المصروف", "المبلغ"] },
    { key: "cogs", required: false, aliases: ["cogs", "تكلفة_البضاعه"] },
    { key: "adSpend", required: false, aliases: ["ad_spend", "ads", "الإنفاق_الإعلاني", "اعلان"] },
    { key: "cashOut", required: false, aliases: ["cash_out", "الصادر", "نقد_خارج"] },
  ],
  customers: [
    { key: "name", required: true, aliases: ["name", "customer", "الاسم", "العميل"] },
    { key: "segment", required: false, aliases: ["segment", "الشريحه"] },
    { key: "lifetimeValue", required: false, aliases: ["ltv", "lifetime_value", "القيمه_مدى_الحياه"] },
    { key: "ordersCount", required: false, aliases: ["orders", "orders_count", "الطلبات"] },
    { key: "lastOrderAt", required: false, aliases: ["last_order", "last_order_at", "اخر_طلب"] },
  ],
  leads: [
    { key: "name", required: true, aliases: ["name", "lead", "الاسم"] },
    { key: "source", required: false, aliases: ["source", "المصدر"] },
    { key: "status", required: false, aliases: ["status", "الحاله"] },
    { key: "estimatedValue", required: false, aliases: ["value", "estimated_value", "القيمه"] },
    { key: "createdAt", required: false, aliases: ["created", "created_at", "التاريخ"] },
  ],
  inventory: [
    { key: "sku", required: true, aliases: ["sku", "code", "الرمز", "الكود"] },
    { key: "nameAr", required: false, aliases: ["name_ar", "name", "الاسم", "المنتج"] },
    { key: "nameEn", required: false, aliases: ["name_en", "english_name"] },
    { key: "category", required: false, aliases: ["category", "الفئه"] },
    { key: "price", required: true, aliases: ["price", "السعر"] },
    { key: "cost", required: false, aliases: ["cost", "التكلفه"] },
    { key: "stock", required: true, aliases: ["stock", "qty", "quantity", "المخزون", "الكميه"] },
    { key: "reorderPoint", required: false, aliases: ["reorder", "reorder_point", "نقطه_الطلب"] },
  ],
  campaigns: [
    { key: "nameAr", required: false, aliases: ["name_ar", "name", "الاسم", "الحمله"] },
    { key: "nameEn", required: false, aliases: ["name_en"] },
    { key: "channel", required: true, aliases: ["channel", "القناه"] },
    { key: "spend", required: true, aliases: ["spend", "cost", "الإنفاق"] },
    { key: "revenue", required: false, aliases: ["revenue", "الإيراد"] },
    { key: "clicks", required: false, aliases: ["clicks", "النقرات"] },
    { key: "conversions", required: false, aliases: ["conversions", "التحويلات"] },
    { key: "startDate", required: false, aliases: ["start", "start_date", "البدايه"] },
    { key: "endDate", required: false, aliases: ["end", "end_date", "النهايه"] },
  ],
};

export function normalizeHeader(value: string) {
  return value
    .trim()
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

export function sampleCsv(kind: ImportKind) {
  const samples: Record<ImportKind, string> = {
    sales: "date,revenue,orders,sessions,conversions\n2026-08-01,18400,42,610,42\n2026-08-02,21150,49,640,49\n2026-08-03,19680,45,590,45\n",
    expenses: "date,expenses,cogs,adSpend\n2026-08-01,4200,8100,1600\n2026-08-02,3900,9300,1750\n2026-08-03,4100,8600,1500\n",
    customers: "name,segment,lifetimeValue,ordersCount,lastOrderAt\nشركة أفق,vip,42000,18,2026-08-20\nنورة العتيبي,regular,5400,7,2026-08-28\n",
    leads: "name,source,status,estimatedValue,createdAt\nأمل الحمود,whatsapp,new,1200,2026-08-25\nبدر العيسى,instagram,neglected,900,2026-08-18\n",
    inventory: "sku,nameAr,nameEn,category,price,cost,stock,reorderPoint\nARG-50,زيت الأرغان,Argan oil,wellness,189,48,18,60\nHOSP-01,طقم ضيافة,Hospitality set,home,289,142,80,40\n",
    campaigns: "nameAr,nameEn,channel,spend,revenue,clicks,conversions,startDate,endDate\nحملة رمضان,Ramadan,meta,12000,48000,8200,190,2026-07-01,2026-07-30\n",
  };
  return samples[kind];
}
