"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { field } from "@/lib/utils";
import { KIND_FIELDS, kindLabels } from "@/lib/import/kinds";
import { defaultImportKind, sourceAcceptsUpload, type ImportKind } from "@/lib/connectors";

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

function ColumnContract({
  kind,
  locale,
  requiredLabel,
  optionalLabel,
}: {
  kind: ImportKind;
  locale: string;
  requiredLabel: string;
  optionalLabel: string;
}) {
  const fields = KIND_FIELDS[kind];
  return (
    <div className="mt-3 space-y-1 text-xs leading-6 text-muted-foreground">
      <p>
        <span className="text-primary">{requiredLabel}: </span>
        {fields
          .filter((item) => item.required)
          .map((item) => field(locale, item.labelAr, item.labelEn))
          .join(" · ")}
      </p>
      <p>
        <span className="text-slate-400">{optionalLabel}: </span>
        {fields
          .filter((item) => !item.required)
          .map((item) => field(locale, item.labelAr, item.labelEn))
          .join(" · ")}
      </p>
    </div>
  );
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
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const pendingRef = useRef<{ source: SourceRow; kind: ImportKind } | null>(null);
  const [active, setActive] = useState<SourceRow | null>(null);
  const [kind, setKind] = useState<ImportKind>("sales");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  const fields = useMemo(() => (preview ? KIND_FIELDS[preview.kind] : KIND_FIELDS[kind]), [preview, kind]);

  function revealSource(source: SourceRow, nextKind?: ImportKind) {
    const selectedKind = nextKind ?? defaultImportKind(source) ?? "sales";
    pendingRef.current = { source, kind: selectedKind };
    setMessage("");
    setPreview(null);
    setActive(source);
    setKind(selectedKind);
  }

  function startUpload(source: SourceRow) {
    if (!sourceAcceptsUpload(source)) return;
    const nextKind = active?.id === source.id ? kind : (defaultImportKind(source) ?? "sales");
    revealSource(source, nextKind);
    fileRefs.current[source.id]?.click();
    requestAnimationFrame(() => {
      document.getElementById(`source-card-${source.id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function readError(body: { messageAr?: string; messageEn?: string; missingRequired?: string[]; error?: string }) {
    const base = locale === "en" ? body.messageEn || body.error : body.messageAr || body.error;
    if (body.missingRequired?.length) {
      const labels = body.missingRequired
        .map((key) => {
          const def = fields.find((item) => item.key === key);
          return def ? field(locale, def.labelAr, def.labelEn) : key;
        })
        .join(", ");
      return `${base ?? t("importError")} (${labels})`;
    }
    return base || t("importError");
  }

  async function onFile(file: File, source: SourceRow, selectedKind: ImportKind) {
    setBusy(true);
    setMessage("");
    const form = new FormData();
    form.set("kind", selectedKind);
    form.set("file", file);
    const response = await fetch("/api/import/preview", { method: "POST", body: form });
    const body = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(readError(body) || t("parseError"));
      return;
    }
    setPreview({
      kind: selectedKind,
      sourceKey: source.key,
      fileName: body.fileName,
      columns: body.columns,
      preview: body.preview,
      rows: body.rows,
      mapping: body.suggestedMapping ?? {},
    });
  }

  function handleFileChosen(source: SourceRow, file?: File | null) {
    if (!file) return;
    const selectedKind =
      pendingRef.current?.source.id === source.id
        ? pendingRef.current.kind
        : (defaultImportKind(source) ?? "sales");
    pendingRef.current = { source, kind: selectedKind };
    setActive(source);
    setKind(selectedKind);
    void onFile(file, source, selectedKind);
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
      setMessage(readError(body));
      return;
    }
    setMessage(t("imported", { count: body.imported ?? 0 }));
    setPreview(null);
    setActive(null);
    pendingRef.current = null;
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
      fulfillmentHours: Number(form.get("fulfillmentHours") || 0),
      headcount: Number(form.get("headcount") || 0),
      payroll: Number(form.get("payroll") || 0),
      utilization: Number(form.get("utilization") || 0),
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
                  ["fulfillmentHours", "number"],
                  ["headcount", "number"],
                  ["payroll", "number"],
                  ["utilization", "number"],
                ] as const
              ).map(([name, type]) => (
                <div key={name} className="space-y-1">
                  <label className="text-xs">{t(`fields.${name}`)}</label>
                  <Input
                    name={name}
                    type={type === "date" ? "date" : "number"}
                    step={type === "number" ? "0.01" : undefined}
                    required={name === "date"}
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
        {sources.map((source) => {
          const uploadable = sourceAcceptsUpload(source);
          const isActive = active?.id === source.id;
          const panelKind = isActive ? kind : (defaultImportKind(source) ?? "sales");
          return (
            <Card
              key={source.id}
              id={`source-card-${source.id}`}
              className={isActive ? "ring-2 ring-primary/70" : undefined}
            >
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-start"
                    onClick={() => {
                      if (uploadable) startUpload(source);
                    }}
                  >
                    <div>
                      <h2 className="font-semibold">{field(locale, source.nameAr, source.nameEn)}</h2>
                      <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                        {source.category}
                      </p>
                      <p className="mt-2 text-xs leading-6 text-muted-foreground">
                        {field(locale, source.descriptionAr, source.descriptionEn)}
                      </p>
                      {source.importKinds[0] ? (
                        <ColumnContract
                          kind={source.importKinds[0]}
                          locale={locale}
                          requiredLabel={t("required")}
                          optionalLabel={t("optional")}
                        />
                      ) : null}
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
                  </button>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge variant={statusVariant(source.status)}>{t(`status.${source.status}`)}</Badge>
                    {uploadable ? (
                      <>
                        <input
                          ref={(el) => {
                            fileRefs.current[source.id] = el;
                          }}
                          id={`upload-${source.key}`}
                          data-testid={`upload-input-${source.key}`}
                          type="file"
                          accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                          className="sr-only"
                          disabled={busy}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            handleFileChosen(source, file);
                          }}
                        />
                        <Button asChild size="sm">
                          <label
                            htmlFor={`upload-${source.key}`}
                            className="cursor-pointer"
                            data-testid={`upload-button-${source.key}`}
                            onClick={() => {
                              const nextKind =
                                active?.id === source.id ? kind : (defaultImportKind(source) ?? "sales");
                              revealSource(source, nextKind);
                            }}
                          >
                            {t("connect")}
                          </label>
                        </Button>
                        {source.importKinds.map((item) => (
                          <a
                            key={item}
                            className="text-[11px] text-primary"
                            href={`/api/import/sample?kind=${item}`}
                          >
                            {t("sample")}
                            {source.importKinds.length > 1
                              ? ` · ${field(locale, kindLabels(item).ar, kindLabels(item).en)}`
                              : ""}
                          </a>
                        ))}
                      </>
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        {t("comingSoon")}
                      </Button>
                    )}
                  </div>
                </div>

                {isActive && uploadable ? (
                  <div className="space-y-4 border-t border-border/70 pt-4">
                    <div>
                      <h3 className="text-sm font-medium">
                        {t("uploadTitle")} · {field(locale, source.nameAr, source.nameEn)}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">{t("uploadLead")}</p>
                    </div>
                    {source.comingSoonProvider ? (
                      <p className="text-xs text-muted-foreground">
                        {t("oauthSoon", { provider: source.comingSoonProvider })}
                      </p>
                    ) : null}
                    {source.importKinds.length > 1 ? (
                      <div className="space-y-1">
                        <label className="text-sm" htmlFor={`kind-${source.key}`}>
                          {t("kind")}
                        </label>
                        <select
                          id={`kind-${source.key}`}
                          value={kind}
                          onChange={(event) => {
                            const nextKind = event.target.value as ImportKind;
                            pendingRef.current = { source, kind: nextKind };
                            setKind(nextKind);
                            setPreview(null);
                          }}
                          className="flex h-11 w-full max-w-xs rounded-md border border-border bg-navy px-3 text-sm"
                        >
                          {source.importKinds.map((item) => (
                            <option key={item} value={item}>
                              {t(`kinds.${item}`)}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                    <ColumnContract
                      kind={panelKind}
                      locale={locale}
                      requiredLabel={t("required")}
                      optionalLabel={t("optional")}
                    />
                    <label
                      htmlFor={`upload-${source.key}`}
                      className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-primary/50 bg-navy/40 px-4 py-6 text-center text-sm text-muted-foreground"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        handleFileChosen(source, event.dataTransfer.files?.[0]);
                      }}
                    >
                      {t("chooseOrDrop")}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" disabled={busy} onClick={() => startUpload(source)}>
                        {t("connect")}
                      </Button>
                      <Button variant="outline" asChild>
                        <a href={`/api/import/sample?kind=${panelKind}`}>{t("sample")}</a>
                      </Button>
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => {
                          setActive(null);
                          setPreview(null);
                          pendingRef.current = null;
                        }}
                      >
                        {t("close")}
                      </Button>
                    </div>

                    {preview && preview.sourceKey === source.key ? (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          {t("previewNote", { count: preview.rows.length, file: preview.fileName })}
                        </p>
                        <div className="grid gap-3 md:grid-cols-2">
                          {fields.map((fieldDef) => (
                            <div key={fieldDef.key} className="space-y-1">
                              <label className="text-xs">
                                {field(locale, fieldDef.labelAr, fieldDef.labelEn)}
                                {fieldDef.required ? (
                                  <span className="text-primary"> · {t("required")}</span>
                                ) : (
                                  <span className="text-muted-foreground"> · {t("optional")}</span>
                                )}
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
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {message ? <p className="text-sm text-primary">{message}</p> : null}
    </div>
  );
}
