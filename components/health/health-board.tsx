"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, healthVariant } from "@/components/ui/badge";
import type { HealthModel, HealthPillarKey } from "@/lib/analytics/health";
import { healthTone } from "@/lib/analytics/health";
import { cn } from "@/lib/utils";

const keys: HealthPillarKey[] = [
  "financial",
  "sales",
  "customer",
  "operational",
  "marketing",
  "cashflow",
];

function ringColor(score: number) {
  const tone = healthTone(score);
  if (tone === "green") return "#34d399";
  if (tone === "orange") return "#f59e0b";
  return "#fb7185";
}

export function HealthBoard({
  model,
  locale,
}: {
  model: HealthModel;
  locale: string;
}) {
  const t = useTranslations("health");
  const [active, setActive] = useState<HealthPillarKey>("sales");
  const pillar = model.pillars.find((p) => p.key === active) ?? model.pillars[0];
  const color = ringColor(model.overall);
  const radius = 58;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (model.overall / 100) * circ;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="flex items-center justify-center">
        <CardContent className="flex flex-col items-center py-10">
          <div className="relative h-44 w-44">
            <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
              <circle cx="80" cy="80" r={radius} stroke="#1e293b" strokeWidth="12" fill="none" />
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke={color}
                strokeWidth="12"
                fill="none"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-semibold">{model.overall}</span>
              <span className="text-xs text-muted-foreground">{t("overall")}</span>
            </div>
          </div>
          <Badge variant={healthVariant(model.overall)} className="mt-4">
            {model.overall >= 75
              ? t("statusHealthy")
              : model.overall >= 55
                ? t("statusWatch")
                : t("statusCritical")}
          </Badge>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {keys.map((key) => {
            const item = model.pillars.find((p) => p.key === key)!;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActive(key)}
                className={cn(
                  "rounded-xl border p-4 text-start transition-colors",
                  active === key ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t(key)}</span>
                  <Badge variant={healthVariant(item.score)}>{item.score}</Badge>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.score}%`,
                      background: ringColor(item.score),
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {t("drivers")} — {t(pillar.key)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pillar.drivers.map((driver) => (
              <div key={driver.en} className="rounded-lg border border-border/70 bg-muted/40 p-3">
                <p className="text-sm">{locale === "en" ? driver.en : driver.ar}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {Math.round(driver.weight * 100)}%
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
