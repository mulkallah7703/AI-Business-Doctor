import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireOnboardedOrg } from "@/lib/session";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { organization, membership } = await requireOnboardedOrg();
  const t = await getTranslations("settings");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("lead")}</p>
      </div>
      <SettingsForm
        locale={locale}
        role={membership.role}
        organization={{
          name: organization.name,
          nameEn: organization.nameEn,
          city: organization.city,
          currency: organization.currency,
          sector: organization.sector,
        }}
      />
    </div>
  );
}
