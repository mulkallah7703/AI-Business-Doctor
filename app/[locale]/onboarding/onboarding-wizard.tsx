"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { BrandMark } from "@/components/brand-mark";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CURRENCIES, SECTORS } from "@/lib/connectors";
import { field } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

type Connector = {
  key: string;
  nameAr: string;
  nameEn: string;
  ingestMode: string;
  comingSoonProvider: string | null;
  descriptionAr: string;
  descriptionEn: string;
};

export function OnboardingWizard({
  locale,
  organization,
  connectors,
}: {
  locale: string;
  organization: {
    name: string;
    nameEn: string;
    city: string;
    currency: string;
    sector: string;
  };
  connectors: Connector[];
}) {
  const t = useTranslations("onboarding");
  const [step, setStep] = useState(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string[]>(["sales", "expenses"]);
  const [profile, setProfile] = useState({
    name: organization.name,
    nameEn: organization.nameEn,
    city: organization.city || (locale === "en" ? "Riyadh" : "الرياض"),
    currency: organization.currency || "SAR",
    sector: organization.sector || "retail_ecommerce",
  });

  function toggle(key: string) {
    setSelected((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  }

  async function finish() {
    if (profile.name.trim().length < 2 || profile.city.trim().length < 2) {
      setError(t("error"));
      setStep(1);
      return;
    }
    setPending(true);
    setError("");
    const response = await fetch("/api/org/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...profile,
        selectedSources: selected,
      }),
    });
    setPending(false);
    if (!response.ok) {
      setError(t("error"));
      return;
    }
    window.location.href = `/${locale}${selected.length ? "/sources" : "/dashboard"}`;
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-5 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="text-sm font-semibold">{t("title")}</p>
            <p className="text-xs text-muted-foreground">{t("step", { n: step })}</p>
          </div>
        </div>
        <LocaleSwitcher />
      </div>

      <div className="space-y-6">
        {step === 1 ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("profileTitle")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("profileLead")}</p>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm">{t("name")}</label>
                <Input
                  value={profile.name}
                  onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm">{t("nameEn")}</label>
                <Input
                  value={profile.nameEn}
                  onChange={(event) => setProfile({ ...profile, nameEn: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm">{t("city")}</label>
                <Input
                  value={profile.city}
                  onChange={(event) => setProfile({ ...profile, city: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm">{t("currency")}</label>
                <select
                  value={profile.currency}
                  onChange={(event) => setProfile({ ...profile, currency: event.target.value })}
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
                  value={profile.sector}
                  onChange={(event) => setProfile({ ...profile, sector: event.target.value })}
                  className="flex h-11 w-full rounded-md border border-border bg-navy px-3 text-sm"
                >
                  {SECTORS.map((sector) => (
                    <option key={sector.key} value={sector.key}>
                      {locale === "en" ? sector.en : sector.ar}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {step === 2 ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("sourcesTitle")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("sourcesLead")}</p>
            </CardHeader>
            <CardContent className="grid gap-3">
              {connectors.map((connector) => (
                <label
                  key={connector.key}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/80 bg-muted/30 p-3"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selected.includes(connector.key)}
                    onChange={() => toggle(connector.key)}
                  />
                  <div>
                    <div className="font-medium">
                      {field(locale, connector.nameAr, connector.nameEn)}
                    </div>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      {field(locale, connector.descriptionAr, connector.descriptionEn)}
                    </p>
                  </div>
                </label>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {step === 3 ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("connectTitle")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("connectLead")}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {connectors
                .filter((item) => selected.includes(item.key))
                .map((connector) => (
                  <div key={connector.key} className="rounded-lg border border-border/80 p-3">
                    <div className="font-medium">
                      {field(locale, connector.nameAr, connector.nameEn)}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {connector.ingestMode === "oauth"
                        ? t("comingSoon", { provider: connector.comingSoonProvider || connector.key })
                        : connector.ingestMode === "manual"
                          ? t("manualHint")
                          : t("uploadHint")}
                    </p>
                  </div>
                ))}
              {!selected.length ? (
                <p className="text-sm text-muted-foreground">{t("noneSelected")}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">{t("skipNote")}</p>
            </CardContent>
          </Card>
        ) : null}

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <div className="flex flex-wrap justify-between gap-3">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
              {t("back")}
            </Button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <Button type="button" onClick={() => setStep(step + 1)}>
              {t("next")}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button type="button" variant="outline" disabled={pending} onClick={finish}>
                {t("skip")}
              </Button>
              <Button type="button" disabled={pending} onClick={finish}>
                {pending ? "…" : t("finish")}
              </Button>
            </div>
          )}
        </div>
      </div>
      <p className="mt-8 text-xs text-muted-foreground">
        <Link href="/login">{t("signOutHint")}</Link>
      </p>
    </div>
  );
}
