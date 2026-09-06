export type ImportErrorCode =
  | "EMPTY_FILE"
  | "NO_COLUMNS"
  | "EMPTY_SHEET"
  | "MISSING_MAPPING"
  | "NO_VALID_ROWS"
  | "INVALID_DATE"
  | "INVALID_NUMBER"
  | "INVALID_UPLOAD"
  | "FILE_TOO_LARGE"
  | "UNKNOWN_KIND"
  | "IMPORT_FAILED";

const MESSAGES: Record<ImportErrorCode, { ar: string; en: string }> = {
  EMPTY_FILE: {
    ar: "الملف فارغ. أضف صف رأس ثم صفاً واحداً على الأقل من البيانات.",
    en: "The file is empty. Add a header row and at least one data row.",
  },
  NO_COLUMNS: {
    ar: "لا توجد أعمدة في صف الرأس. استخدم CSV أو Excel بعناوين واضحة.",
    en: "No columns found in the header row. Use CSV or Excel with named headers.",
  },
  EMPTY_SHEET: {
    ar: "ورقة العمل فارغة.",
    en: "The worksheet is empty.",
  },
  MISSING_MAPPING: {
    ar: "أعمدة مطلوبة غير مطابقة. اربط كل حقل مطلوب بعمود من الملف.",
    en: "Required columns are not mapped. Match each required field to a file column.",
  },
  NO_VALID_ROWS: {
    ar: "لا توجد صفوف صالحة. تحقق من التواريخ والأرقام في الملف.",
    en: "No valid rows. Check dates and numbers in the file.",
  },
  INVALID_DATE: {
    ar: "تاريخ غير صالح. استخدم YYYY-MM-DD أو DD/MM/YYYY.",
    en: "Invalid date. Use YYYY-MM-DD or DD/MM/YYYY.",
  },
  INVALID_NUMBER: {
    ar: "رقم غير صالح في أحد الحقول المطلوبة.",
    en: "Invalid number in a required field.",
  },
  INVALID_UPLOAD: {
    ar: "رفع غير صالح. اختر نوع البيانات وملف CSV أو Excel.",
    en: "Invalid upload. Choose a data type and a CSV or Excel file.",
  },
  FILE_TOO_LARGE: {
    ar: "الملف أكبر من 5 ميغابايت.",
    en: "The file is larger than 5 MB.",
  },
  UNKNOWN_KIND: {
    ar: "نوع البيانات غير معروف.",
    en: "Unknown data type.",
  },
  IMPORT_FAILED: {
    ar: "تعذّر الاستيراد. تحقق من الأعمدة المطلوبة وأعد المحاولة.",
    en: "Import failed. Check the required columns and try again.",
  },
};

export function importMessage(code: ImportErrorCode, locale: "ar" | "en" = "ar") {
  return MESSAGES[code][locale];
}

export function importMessages(code: ImportErrorCode) {
  return { code, messageAr: MESSAGES[code].ar, messageEn: MESSAGES[code].en };
}

export function rowErrorMessage(
  kind: "missing" | "date" | "number",
  field: string,
  locale: "ar" | "en" = "en",
) {
  if (kind === "missing") {
    return locale === "ar" ? `الحقل المطلوب فارغ: ${field}` : `Missing required field: ${field}`;
  }
  if (kind === "date") {
    return locale === "ar"
      ? `تاريخ غير صالح للحقل ${field}`
      : `Invalid date for ${field}`;
  }
  return locale === "ar" ? `رقم غير صالح للحقل ${field}` : `Invalid number for ${field}`;
}
