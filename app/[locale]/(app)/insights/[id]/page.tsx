import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireOrg } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, severityVariant } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { field } from "@/lib/utils";
import { formatSar } from "@/lib/format";

export default async function InsightDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const { organization } = await requireOrg();
  const t = await getTranslations("insights");
  const insight = await prisma.insight.findFirst({
    where: { id, organizationId: organization.id },
    include: { actions: true },
  });
  if (!insight) notFound();
  const drivers = JSON.parse(insight.driversJson) as { ar: string; en: string }[];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/insights" className="text-sm text-primary">
        {t("back")}
      </Link>
      <div className="flex flex-wrap gap-2">
        <Badge variant={severityVariant(insight.severity)}>{insight.severity}</Badge>
        <Badge variant="muted">{insight.type}</Badge>
        <Badge variant="muted">{insight.pillar}</Badge>
      </div>
      <h1 className="text-3xl font-semibold">
        {field(locale, insight.titleAr, insight.titleEn)}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t("effect")}: {formatSar(insight.financialEffect, locale)}
      </p>

      <Card>
        <CardContent className="space-y-4 leading-8 text-slate-200">
          {field(locale, insight.narrativeAr, insight.narrativeEn)}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {(
          [
            ["detect", insight.detectAr, insight.detectEn],
            ["diagnose", insight.diagnoseAr, insight.diagnoseEn],
            ["predict", insight.predictAr, insight.predictEn],
            ["recommend", insight.recommendAr, insight.recommendEn],
          ] as const
        ).map(([key, ar, en]) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle>{t(key)}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-slate-300">
              {field(locale, ar, en)}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{locale === "en" ? "Drivers" : "المحركات"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {drivers.map((driver) => (
            <div key={driver.en} className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
              {field(locale, driver.ar, driver.en)}
            </div>
          ))}
        </CardContent>
      </Card>

      {insight.actions.length ? (
        <Card>
          <CardHeader>
            <CardTitle>{locale === "en" ? "Linked actions" : "مهام مرتبطة"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insight.actions.map((action) => (
              <Link key={action.id} href="/actions" className="block text-sm text-primary">
                {field(locale, action.titleAr, action.titleEn)}
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
