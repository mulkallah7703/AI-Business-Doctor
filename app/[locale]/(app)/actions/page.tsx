import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireOrg } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ActionsBoard } from "./actions-board";
import { EmptyState } from "@/components/empty-state";

export default async function ActionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { organization } = await requireOrg();
  const t = await getTranslations("actions");
  const emptyT = await getTranslations("empty");
  const actions = await prisma.action.findMany({
    where: { organizationId: organization.id },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("lead")}</p>
      </div>
      {actions.length === 0 ? (
        <EmptyState
          title={emptyT("actionsTitle")}
          body={emptyT("actionsBody")}
          actionLabel={emptyT("connectCta")}
        />
      ) : (
        <ActionsBoard locale={locale} actions={actions} />
      )}
    </div>
  );
}
