"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { field } from "@/lib/utils";
import { formatSar } from "@/lib/format";

export type ActionRow = {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  status: string;
  priority: string;
  estimatedEffect: number;
  beforeMetric: string | null;
  afterMetric: string | null;
  outcomeAr: string | null;
  outcomeEn: string | null;
};

export function ActionsBoard({
  actions,
  locale,
}: {
  actions: ActionRow[];
  locale: string;
}) {
  const t = useTranslations("actions");
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function execute(id: string) {
    setBusy(id);
    await fetch(`/api/actions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      {actions.map((action) => (
        <Card key={action.id}>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  action.status === "done"
                    ? "success"
                    : action.status === "in_progress"
                      ? "warning"
                      : "muted"
                }
              >
                {t(action.status as "pending" | "in_progress" | "done")}
              </Badge>
              <Badge variant={action.priority === "urgent" ? "danger" : "default"}>
                {action.priority}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatSar(action.estimatedEffect, locale)}
              </span>
            </div>
            <h2 className="text-lg font-semibold">
              {field(locale, action.titleAr, action.titleEn)}
            </h2>
            <p className="text-sm leading-7 text-slate-300">
              {field(locale, action.descriptionAr, action.descriptionEn)}
            </p>
            {action.status === "done" && action.outcomeAr ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                <p className="text-xs text-emerald-200">{t("measured")}</p>
                <p className="mt-1 text-sm">
                  {t("before")}: {action.beforeMetric} → {t("after")}: {action.afterMetric}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  {field(locale, action.outcomeAr, action.outcomeEn ?? "")}
                </p>
              </div>
            ) : (
              <Button
                size="sm"
                disabled={busy === action.id}
                onClick={() => execute(action.id)}
              >
                {busy === action.id ? t("executing") : t("execute")}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
