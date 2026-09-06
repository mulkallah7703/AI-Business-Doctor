export function formatSar(value: number, locale: string) {
  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat(locale === "en" ? "en-SA" : "ar-SA", {
    maximumFractionDigits: abs >= 1000 ? 0 : 1,
  }).format(abs);
  const sign = value < 0 ? (locale === "en" ? "-" : "−") : "";
  return locale === "en" ? `${sign}SAR ${formatted}` : `${sign}${formatted} ر.س`;
}

export function formatNumber(value: number, locale: string, digits = 0) {
  return new Intl.NumberFormat(locale === "en" ? "en-SA" : "ar-SA", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function formatPct(value: number, locale: string, digits = 1) {
  return `${formatNumber(value, locale, digits)}%`;
}

export function formatDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ar-SA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function deltaPct(current: number, previous: number) {
  if (!previous) return 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}
