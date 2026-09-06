import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function pickLocale<T extends { ar: string; en: string }>(
  locale: string,
  value: T,
): string {
  return locale === "en" ? value.en : value.ar;
}

export function field(locale: string, ar: string, en: string) {
  return locale === "en" ? en : ar;
}

export function utcDay(date = new Date()) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}
