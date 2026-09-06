"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { field } from "@/lib/utils";
import { KIND_FIELDS } from "@/lib/import/kinds";
import type { ImportKind } from "@/lib/connectors";

export type SourceRow = {
  id: string;
  key: string;
  nameAr: string;
  nameEn: string;
  category: string;
  connected: boolean;
  status: string;
  ingestMode: string;
  lastSyncAt: string | null;
  lastError: string | null;
  importKinds: ImportKind[];
  comingSoonProvider: string | null;
  descriptionAr: string;
  descriptionEn: string;
};

type PreviewState = {
  kind: ImportKind;
  sourceKey: string;
  fileName: string;
  columns: string[];
  preview: Record<string, string>[];
  rows: Record<string, string>[];
  mapping: Record<string, string>;
};

function statusVariant(status: string) {
  if (status === "connected") return "success" as const;
  if (status === "error") return "danger" as const;
  if (status === "syncing") return "warning" as const;
  return "muted" as const;
}

export function SourcesBoard({
  sources,
  locale,
}: {
  sources: SourceRow[];
  locale: string;
}) {
  const t = useTranslations("sources");
  const router = useRouter();
  const [active, setActive] = useState<SourceRow | null>(null);
  const [kind, setKind] = useState<ImportKind>("sales");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  const fields = useMemo(() => (preview ? KIND_FIELDS[preview.kind] : []), [preview]);

  function openSource(source: SourceRow) {
    setMessage("");
    setPreview(null);
    setActive(source);
    setKind(source.importKinds[0] ?? "sales");
  }

  async function onFile(file: File) {
    if (!active) return;
    setBusy(true);
    setMessage("");
    const form = new FormData();
    form.set("kind", kind);
    form.set("file", file);
    const response = await fetch("/api/import/preview", { method: "POST", body: form });
    const body = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(t("parseError"));
      return;
    }
    setPreview({
      kind,
      sourceKey: active.key,
      fileName: body.fileName,
      columns: body.columns,
      preview: body.preview,
      rows: body.rows,
      mapping: body.suggestedMapping ?? {},
    });
  }

  async function commit() {
    if (!preview) return;
    setBusy(true);
    const response = await fetch("/api/import/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: preview.kind,
        sourceKey: preview.sourceKey,
        fileName: preview.fileName,
        mapping: preview.mapping,
        rows: preview.rows,
      }),
    });
    const body = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(t("importError"));
      return;
    }
    setMessage(t("imported", { count: body.imported ?? 0 }));
    setPreview(null);
    setActive(null);
    router.refresh();
  }

  async function submitManual(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      date: String(form.get("date")),
      revenue: Number(form.get("revenue") || 0),
      orders: Number(form.get("orders") || 0),
      expenses: Number(form.get("expenses") || 0),
      cogs: Number(form.get("cogs") || 0),
      cashBalance: Number(form.get("cashBalance") || 0),
      leads: Number(form.get("leads") || 0),
      conversions: Number(form.get("conversions") || 0),
      sessions: Number(form.get("sessions") || 0),
      adSpend: Number(form.get("adSpend") || 0),
    };
    const response = await fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!response.ok) {
      setMessage(t("importError"));
      return;
    }
    setMessage(t("manualSaved"));
    setManualOpen(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("manualTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("manualLead")}</p>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => setManualOpen((value) => !value)}>
            {manualOpen ? t("close") : t("manualOpen")}
          </Button>
          {manualOpen ? (
            <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={submitManual}>
              {(
                [
                  ["date", "date"],
                  ["revenue", "number"],
                  ["orders", "number"],
                  ["expenses", "number"],
                  ["cogs", "number"],
                  ["cashBalance", "number"],
                  ["sessions", "number"],
                  ["conversions", "number"],
                  ["leads", "number"],
                  ["adSpend", "number"],
                ] as const
              ).map(([name, type]) => (
                <div key={name} className="space-y-1">
                  <label className="text-xs">{t(`fields.${name}`)}</label>
                  <Input
                    name={name}
                    type={type === "date" ? "date" : "number"}
                    step={type === "number" ? "0.01" : undefined}
                    required={name === "date" || name === "revenue"}
                  />
                </div>
              ))}
              <div className="md:col-span-2">
                <Button disabled={busy}>{busy ? "…" : t("manualSave")}</Button>
              </div>
            </form>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {sources.map((source) => (
          <Card key={source.id}>
            <CardContent className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">{field(locale, source.nameAr, source.nameEn)}</h2>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                  {source.category}
                </p>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  {field(locale, source.descriptionAr, source.descriptionEn)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("lastSync")}:{" "}
                  {source.lastSyncAt
                    ? new Date(source.lastSyncAt).toLocaleString(locale === "en" ? "en-GB" : "ar-SA")
                    : t("never")}
                </p>
                {source.lastError ? (
                  <p className="mt-1 text-xs text-rose-300">{source.lastError}</p>
                ) : null}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={statusVariant(source.status)}>{t(`status.${source.status}`)}</Badge>
                {source.ingestMode === "oauth" && !source.importKinds.length ? (
                  <Button size="sm" variant="outline" disabled>
                    {t("comingSoon")}
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => openSource(source)}>
                    {source.ingestMode === "oauth" ? t("uploadInstead") : t("connect")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {active ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {t("uploadTitle")} · {field(locale, active.nameAr, active.nameEn)}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{t("uploadLead")}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {active.ingestMode === "oauth" && !active.importKinds.length ? (
              <p className="text-sm text-muted-foreground">
                {t("oauthSoon", { provider: active.comingSoonProvider || active.key })}
              </p>
            ) : (
              <>
                {active.importKinds.length > 1 ? (
                  <div className="space-y-1">
                    <label className="text-sm">{t("kind")}</label>
                    <select
                      value={kind}
                      onChange={(event) => setKind(event.target.value as ImportKind)}
                      className="flex h-11 w-full max-w-xs rounded-md border border-border bg-navy px-3 text-sm"
                    >
                      {active.importKinds.map((item) => (
                        <option key={item} value={item}>
                          {t(`kinds.${item}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    disabled={busy}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void onFile(file);
                    }}
                  />
                  <Button variant="outline" asChild>
                    <a href={`/api/import/sample?kind=${kind}`}>{t("sample")}</a>
                  </Button>
                  <Button variant="ghost" type="button" onClick={() => setActive(null)}>
                    {t("close")}
                  </Button>
                </div>
              </>
            )}

            {preview ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t("previewNote", { count: preview.rows.length, file: preview.fileName })}
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {fields.map((fieldDef) => (
                    <div key={fieldDef.key} className="space-y-1">
                      <label className="text-xs">
                        {fieldDef.key}
                        {fieldDef.required ? " *" : ""}
                      </label>
                      <select
                        value={preview.mapping[fieldDef.key] ?? ""}
                        onChange={(event) =>
                          setPreview({
                            ...preview,
                            mapping: { ...preview.mapping, [fieldDef.key]: event.target.value },
                          })
                        }
                        className="flex h-11 w-full rounded-md border border-border bg-navy px-3 text-sm"
                      >
                        <option value="">{t("skipColumn")}</option>
                        {preview.columns.map((column) => (
                          <option key={column} value={column}>
                            {column}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr>
                        {preview.columns.map((column) => (
                          <th key={column} className="border-b border-border px-2 py-2 text-start">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.preview.map((row, index) => (
                        <tr key={index}>
                          {preview.columns.map((column) => (
                            <td key={column} className="border-b border-border/60 px-2 py-1">
                              {row[column]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button disabled={busy} onClick={commit}>
                  {busy ? "…" : t("confirmImport")}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {message ? <p className="text-sm text-primary">{message}</p> : null}
    </div>
  );
}
