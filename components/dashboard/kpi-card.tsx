import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, severityVariant } from "@/components/ui/badge";
import { Sparkline } from "@/components/charts/sparkline";
import type { KpiCardModel } from "@/lib/analytics/metrics";
import { formatNumber, formatPct, formatSar } from "@/lib/format";
import { field } from "@/lib/utils";

export function KpiCard({
  card,
  title,
  locale,
}: {
  card: KpiCardModel;
  title: string;
  locale: string;
}) {
  const value =
    card.format === "sar"
      ? formatSar(card.value, locale)
      : card.format === "pct"
        ? formatPct(card.value, locale)
        : formatNumber(card.value, locale, card.key === "marketing" ? 1 : 0);

  const deltaPositive = card.delta >= 0;
  const invert = card.key === "costs" || card.key === "inventory";
  const good = invert ? !deltaPositive : deltaPositive;

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {field(locale, card.subtitleAr, card.subtitleEn)}
            </p>
          </div>
          <span className={good ? "text-xs text-emerald-300" : "text-xs text-rose-300"}>
            {card.delta > 0 ? "+" : ""}
            {formatNumber(card.delta, locale, 1)}
            {card.format === "pct" ? "pp" : "%"}
          </span>
        </div>
        <Sparkline data={card.series} color={good ? "#2dd4bf" : "#fb7185"} />
        {card.chip ? (
          <Link href={`/insights/${card.chip.insightId}`}>
            <Badge variant={severityVariant(card.chip.severity)} className="max-w-full truncate">
              {field(locale, card.chip.labelAr, card.chip.labelEn)}
            </Badge>
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
