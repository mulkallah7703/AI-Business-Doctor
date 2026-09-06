import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { requireOrg } from "@/lib/session";
import { CONNECTOR_CATALOG } from "@/lib/connectors";
import { OnboardingWizard } from "./onboarding-wizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { organization } = await requireOrg();
  if (organization.onboardingCompletedAt) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <OnboardingWizard
      locale={locale}
      organization={{
        name: organization.name,
        nameEn: organization.nameEn,
        city: organization.city,
        currency: organization.currency,
        sector: organization.sector,
      }}
      connectors={CONNECTOR_CATALOG.map((item) => ({
        key: item.key,
        nameAr: item.nameAr,
        nameEn: item.nameEn,
        ingestMode: item.ingestMode,
        comingSoonProvider: item.comingSoonProvider ?? null,
        descriptionAr: item.descriptionAr,
        descriptionEn: item.descriptionEn,
      }))}
    />
  );
}
