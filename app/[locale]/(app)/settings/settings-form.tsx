"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CURRENCIES, SECTORS } from "@/lib/connectors";

export function SettingsForm({
  organization,
  locale,
  role,
}: {
  locale: string;
  role: string;
  organization: {
    name: string;
    nameEn: string;
    city: string;
    currency: string;
    sector: string;
  };
}) {
  const t = useTranslations("settings");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/org", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        nameEn: form.get("nameEn"),
        city: form.get("city"),
        currency: form.get("currency"),
        sector: form.get("sector"),
      }),
    });
    setPending(false);
    setMessage(response.ok ? t("saved") : t("error"));
    if (response.ok) router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("profile")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm">{t("name")}</label>
              <Input name="name" defaultValue={organization.name} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm">{t("nameEn")}</label>
              <Input name="nameEn" defaultValue={organization.nameEn} />
            </div>
            <div className="space-y-2">
              <label className="text-sm">{t("city")}</label>
              <Input name="city" defaultValue={organization.city} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm">{t("currency")}</label>
              <select
                name="currency"
                defaultValue={organization.currency}
                className="flex h-11 w-full rounded-md border border-border bg-navy px-3 text-sm"
              >
                {CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm">{t("sector")}</label>
              <select
                name="sector"
                defaultValue={organization.sector}
                className="flex h-11 w-full rounded-md border border-border bg-navy px-3 text-sm"
              >
                {SECTORS.map((sector) => (
                  <option key={sector.key} value={sector.key}>
                    {locale === "en" ? sector.en : sector.ar}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Button disabled={pending || role !== "owner"}>
                {pending ? "…" : t("save")}
              </Button>
              {message ? <p className="mt-2 text-sm text-muted-foreground">{message}</p> : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("inviteTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("inviteLead")}</p>
          <div className="flex flex-wrap gap-2">
            <Input disabled placeholder={t("invitePlaceholder")} className="max-w-sm" />
            <Button disabled variant="outline">
              {t("inviteSoon")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t("roleNote")}: {role}</p>
        </CardContent>
      </Card>
    </div>
  );
}
