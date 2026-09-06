import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireOrg } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SimulatorForm } from "./simulator-form";
import { field } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";

export default async function SimulatorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { organization } = await requireOrg();
  const t = await getTranslations("simulator");
  const emptyT = await getTranslations("empty");
  const metricCount = await prisma.dailyMetric.count({
    where: { organizationId: organization.id },
  });
  const products = await prisma.product.findMany({
    where: { organizationId: organization.id },
    orderBy: { nameAr: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("lead")}</p>
      </div>
      {metricCount === 0 ? (
        <EmptyState
          title={emptyT("simulatorTitle")}
          body={emptyT("simulatorBody")}
          actionLabel={emptyT("connectCta")}
        />
      ) : (
        <SimulatorForm
          locale={locale}
          products={products.map((product) => ({
            id: product.id,
            name: field(locale, product.nameAr, product.nameEn),
          }))}
        />
      )}
    </div>
  );
}
