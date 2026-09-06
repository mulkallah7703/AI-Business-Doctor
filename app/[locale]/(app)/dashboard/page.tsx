import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireOrg } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { computeDashboard } from "@/lib/analytics/metrics";
import { computeHealth } from "@/lib/analytics/health";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, healthVariant } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { formatNumber } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { organization } = await requireOrg();
  const t = await getTranslations("kpis");
  const healthT = await getTranslations("health");
  const nav = await getTranslations("nav");

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

  const dashboard = computeDashboard({ metrics, insights, products, leads, campaigns });
  const health = computeHealth({ metrics, insights, products, leads, campaigns });
  const emptyT = await getTranslations("empty");

  if (metrics.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">{nav("dashboard")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("vsPrev")}</p>
        </div>
        <EmptyState
          title={emptyT("dashboardTitle")}
          body={emptyT("dashboardBody")}
          actionLabel={emptyT("connectCta")}
          secondaryHref="/sources"
          secondaryLabel={emptyT("manualCta")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{nav("dashboard")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("vsPrev")}</p>
        </div>
        <Link href="/health">
          <Card>
            <CardContent className="flex items-center gap-3 py-3">
              <div>
                <p className="text-xs text-muted-foreground">{healthT("overall")}</p>
                <p className="text-xl font-semibold">{formatNumber(health.overall, locale)}</p>
              </div>
              <Badge variant={healthVariant(health.overall)}>{health.overall}</Badge>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dashboard.cards.map((card) => (
          <KpiCard key={card.key} card={card} title={t(card.key)} locale={locale} />
        ))}
      </div>
    </div>
  );
}
