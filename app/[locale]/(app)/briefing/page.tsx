import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireOrg } from "@/lib/session";
import { getOrCreateBriefing } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import type { BriefingItem } from "@/lib/ai/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { formatSar } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";

const kindVariant = {
  urgent: "danger",
  risk: "warning",
  opportunity: "success",
  growth: "default",
  recommendation: "muted",
} as const;

export default async function BriefingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { organization } = await requireOrg();
  const t = await getTranslations("briefing");
  const emptyT = await getTranslations("empty");
  const briefing = await getOrCreateBriefing(organization.id, locale);
  const items = JSON.parse(briefing.itemsJson) as BriefingItem[];
  const insights = await prisma.insight.findMany({
    where: { organizationId: organization.id },
  });

  if (briefing.source === "empty" || items.length === 0) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-primary">{t("eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-semibold leading-snug">{briefing.greeting}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{briefing.summary}</p>
        </div>
        <EmptyState
          title={emptyT("briefingTitle")}
          body={emptyT("briefingBody")}
          actionLabel={emptyT("connectCta")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-primary">{t("eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-semibold leading-snug">{briefing.greeting}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{briefing.summary}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{briefing.source === "seed" || briefing.source === "mock" ? t("cached") : t("live")}</span>
          {briefing.source !== "openai" ? <span>· {t("mockNote")}</span> : null}
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const insight = insights.find((row) => row.slug === item.insightSlug);
          return (
            <Card key={item.rank}>
              <CardContent className="flex flex-col gap-4 md:flex-row md:items-start">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {item.rank}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={kindVariant[item.kind]}>{t(`kind.${item.kind}`)}</Badge>
                    {item.effectSar ? (
                      <span className="text-xs text-muted-foreground">
                        {formatSar(item.effectSar, locale)}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="text-lg font-semibold">{item.title}</h2>
                  <p className="text-sm leading-7 text-slate-300">{item.body}</p>
                  {insight ? (
                    <Link href={`/insights/${insight.id}`} className="text-sm text-primary">
                      {locale === "en" ? "Open full diagnosis" : "افتح التشخيص الكامل"}
                    </Link>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
