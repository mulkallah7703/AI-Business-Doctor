import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireOrg } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { computeHealth } from "@/lib/analytics/health";
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

  const [metrics, insights, products, leads, campaigns] = await Promise.all([
    prisma.dailyMetric.findMany({
      where: { organizationId: organization.id },
      orderBy: { date: "asc" },
    }),
    prisma.insight.findMany({ where: { organizationId: organization.id } }),
    prisma.product.findMany({ where: { organizationId: organization.id } }),
    prisma.lead.findMany({ where: { organizationId: organization.id } }),
    prisma.campaign.findMany({ where: { organizationId: organization.id } }),
  ]);

  const model = computeHealth({ metrics, insights, products, leads, campaigns });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("lead")}</p>
      </div>
      {metrics.length === 0 ? (
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
