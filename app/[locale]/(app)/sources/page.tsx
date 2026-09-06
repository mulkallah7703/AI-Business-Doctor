import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireOnboardedOrg } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { connectorByKey } from "@/lib/connectors";
import { SourcesBoard } from "./sources-board";

export default async function SourcesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { organization } = await requireOnboardedOrg();
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
        sources={sources.map((source) => {
          const catalog = connectorByKey(source.key);
          return {
            id: source.id,
            key: source.key,
            nameAr: source.nameAr,
            nameEn: source.nameEn,
            category: source.category,
            connected: source.connected,
            status: source.status,
            ingestMode: source.ingestMode,
            lastSyncAt: source.lastSyncAt?.toISOString() ?? null,
            lastError: source.lastError,
            importKinds: catalog?.importKinds ?? [],
            comingSoonProvider: catalog?.comingSoonProvider ?? null,
            descriptionAr: catalog?.descriptionAr ?? "",
            descriptionEn: catalog?.descriptionEn ?? "",
          };
        })}
      />
    </div>
  );
}
