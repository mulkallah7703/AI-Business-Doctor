import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireOrg } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SourcesBoard } from "./sources-board";

export default async function SourcesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { organization } = await requireOrg();
  const t = await getTranslations("sources");
  const sources = await prisma.dataSource.findMany({
    where: { organizationId: organization.id },
    orderBy: { nameEn: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("lead")}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t("note")}</p>
      </div>
      <SourcesBoard
        locale={locale}
        sources={sources.map((source) => ({
          id: source.id,
          nameAr: source.nameAr,
          nameEn: source.nameEn,
          category: source.category,
          connected: source.connected,
          lastSyncAt: source.lastSyncAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
