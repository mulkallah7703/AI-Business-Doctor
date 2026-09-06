"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const next = locale === "ar" ? "en" : "ar";

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => router.replace(pathname, { locale: next })}
      className="min-w-16"
    >
      {locale === "ar" ? "EN" : "عربي"}
    </Button>
  );
}
