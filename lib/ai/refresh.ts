import { prisma } from "@/lib/prisma";
import { computeDashboard } from "@/lib/analytics/metrics";
import { loadOrgSnapshot } from "@/lib/analytics/snapshot";
import { DEMO_ORG_ID } from "@/lib/connectors";
import { actionsFromInsights, buildInsightsFromOrg } from "./insights";

export async function refreshOrgIntelligence(organizationId: string) {
  if (organizationId === DEMO_ORG_ID) {
    return { skipped: true as const, insights: 0, actions: 0 };
  }

  const snapshot = await loadOrgSnapshot(organizationId);
  const { metrics, products, leads, campaigns, customers, employees } = snapshot;

  const dashboard = computeDashboard({
    metrics,
    insights: [],
    products,
    leads,
    campaigns,
    customers,
    employees,
  });
  const drafts = buildInsightsFromOrg({
    dashboard,
    metrics,
    products,
    leads,
    campaigns,
    customers,
    employees,
  });

  await prisma.$transaction(async (tx) => {
    await tx.action.deleteMany({ where: { organizationId } });
    await tx.insight.deleteMany({ where: { organizationId } });
    await tx.briefing.deleteMany({ where: { organizationId } });
    if (drafts.length) {
      await tx.insight.createMany({
        data: drafts.map((draft) => ({ ...draft, organizationId })),
      });
      await tx.action.createMany({
        data: actionsFromInsights(organizationId, drafts),
      });
    }
  });

  return { skipped: false as const, insights: drafts.length, actions: Math.min(4, drafts.length) };
}
