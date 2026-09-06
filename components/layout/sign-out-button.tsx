"use client";

import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const t = useTranslations("nav");
  const locale = useLocale();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => signOut({ callbackUrl: `/${locale}` })}
    >
      {t("logout")}
    </Button>
  );
}
