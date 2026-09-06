"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { field } from "@/lib/utils";

export type SourceRow = {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  connected: boolean;
  lastSyncAt: string | null;
};

export function SourcesBoard({
  sources,
  locale,
}: {
  sources: SourceRow[];
  locale: string;
}) {
  const t = useTranslations("sources");
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function toggle(id: string, connected: boolean) {
    setBusy(id);
    await fetch(`/api/sources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connected: !connected }),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sources.map((source) => (
        <Card key={source.id}>
          <CardContent className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">{field(locale, source.nameAr, source.nameEn)}</h2>
              <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                {source.category}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("lastSync")}:{" "}
                {source.lastSyncAt
                  ? new Date(source.lastSyncAt).toLocaleString(locale === "en" ? "en-GB" : "ar-SA")
                  : t("never")}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={source.connected ? "success" : "muted"}>
                {source.connected ? t("connected") : t("disconnected")}
              </Badge>
              <Button
                size="sm"
                variant={source.connected ? "outline" : "default"}
                disabled={busy === source.id}
                onClick={() => toggle(source.id, source.connected)}
              >
                {source.connected ? t("disconnect") : t("connect")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
