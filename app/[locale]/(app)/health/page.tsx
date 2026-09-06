import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireOrg } from "@/lib/session";
import { computeHealth } from "@/lib/analytics/health";
import { loadOrgSnapshot, orgHasData } from "@/lib/analytics/snapshot";
import { HealthBoard } from "@/components/health/health-board";
import { EmptyState } from "@/components/empty-state";

export default async function HealthPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { organization } = await requireOrg();
  const t = await getTranslations("health");
  const emptyT = await getTranslations("empty");
  const snapshot = await loadOrgSnapshot(organization.id);
  const model = computeHealth(snapshot);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("lead")}</p>
      </div>
      {!orgHasData(snapshot) ? (
        <EmptyState
          title={emptyT("healthTitle")}
          body={emptyT("healthBody")}
          actionLabel={emptyT("connectCta")}
        />
      ) : (
        <HealthBoard model={model} locale={locale} />
      )}
    </div>
  );
}
