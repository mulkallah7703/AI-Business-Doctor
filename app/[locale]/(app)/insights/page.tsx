import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireOrg } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, severityVariant } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { field } from "@/lib/utils";
import { formatSar } from "@/lib/format";

const rank = { critical: 0, high: 1, medium: 2, low: 3 };

export default async function InsightsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { organization } = await requireOrg();
  const t = await getTranslations("insights");
  const insights = await prisma.insight.findMany({
    where: { organizationId: organization.id },
  });
  const sorted = [...insights].sort(
    (a, b) => (rank[a.severity as keyof typeof rank] ?? 9) - (rank[b.severity as keyof typeof rank] ?? 9),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("lead")}</p>
      </div>
      <div className="grid gap-4">
        {sorted.map((insight) => (
          <Card key={insight.id}>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={severityVariant(insight.severity)}>{insight.severity}</Badge>
                <Badge variant="muted">{insight.type}</Badge>
                <Badge variant="muted">{insight.pillar}</Badge>
                <span className="text-xs text-muted-foreground">
                  {t("effect")}: {formatSar(insight.financialEffect, locale)}
                </span>
              </div>
              <h2 className="text-lg font-semibold">
                {field(locale, insight.titleAr, insight.titleEn)}
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                <p className="text-sm leading-7 text-slate-300">
                  <span className="text-primary">{t("detect")}: </span>
                  {field(locale, insight.detectAr, insight.detectEn)}
                </p>
                <p className="text-sm leading-7 text-slate-300">
                  <span className="text-primary">{t("diagnose")}: </span>
                  {field(locale, insight.diagnoseAr, insight.diagnoseEn)}
                </p>
                <p className="text-sm leading-7 text-slate-300">
                  <span className="text-primary">{t("predict")}: </span>
                  {field(locale, insight.predictAr, insight.predictEn)}
                </p>
                <p className="text-sm leading-7 text-slate-300">
                  <span className="text-primary">{t("recommend")}: </span>
                  {field(locale, insight.recommendAr, insight.recommendEn)}
                </p>
              </div>
              <Link href={`/insights/${insight.id}`} className="inline-block text-sm text-primary">
                {t("open")}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
