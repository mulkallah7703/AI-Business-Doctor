import type { BriefingPayload } from "./types";

export function emptyBriefing(locale: string): BriefingPayload {
  const ar = locale !== "en";
  return {
    source: "empty",
    greeting: ar
      ? "مرحباً. منشأتك جاهزة — بانتظار أول دفعة بيانات"
      : "Welcome. Your organization is ready — waiting for the first ingest",
    summary: ar
      ? "لا توجد مقاييس بعد. ارفع ملف مبيعات أو أدخل مؤشرات يومية ليعمل مركز القيادة والإحاطة ودرجة الصحة على بياناتك فقط."
      : "No metrics yet. Upload a sales file or enter daily KPIs so the command center, briefing, and health score run on your data only.",
    items: [],
  };
}
