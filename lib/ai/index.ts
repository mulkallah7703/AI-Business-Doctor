import { utcDay } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { computeDashboard } from "@/lib/analytics/metrics";
import { loadOrgSnapshot, orgHasData } from "@/lib/analytics/snapshot";
import { mockBriefing, mockSimulation } from "./mock";
import { openaiBriefing, openaiSimulation } from "./openai";
import { emptyBriefing } from "./empty";
import type { SimulationScenario } from "./types";

export async function getOrCreateBriefing(organizationId: string, locale: string) {
  const date = utcDay();
  const existing = await prisma.briefing.findUnique({
    where: {
      organizationId_date_locale: { organizationId, date, locale },
    },
  });
  if (existing) return existing;

  const snapshot = await loadOrgSnapshot(organizationId);
  const { metrics, insights, products, leads, campaigns, customers, employees } = snapshot;

  if (!orgHasData(snapshot) && insights.length === 0) {
    const payload = emptyBriefing(locale);
    return {
      id: "empty",
      organizationId,
      date,
      locale,
      greeting: payload.greeting,
      summary: payload.summary,
      itemsJson: JSON.stringify(payload.items),
      source: payload.source,
      createdAt: date,
    };
  }

  const dashboard = computeDashboard({
    metrics,
    insights,
    products,
    leads,
    campaigns,
    customers,
    employees,
  });
  let payload = mockBriefing(dashboard, locale, insights);

  if (process.env.OPENAI_API_KEY) {
    try {
      payload = await openaiBriefing(dashboard, locale);
    } catch {
      payload = mockBriefing(dashboard, locale, insights);
    }
  }

  return prisma.briefing.create({
    data: {
      organizationId,
      date,
      locale,
      greeting: payload.greeting,
      summary: payload.summary,
      itemsJson: JSON.stringify(payload.items),
      source: payload.source,
    },
  });
}

export async function simulateScenario(input: {
  organizationId: string;
  scenario: SimulationScenario;
  productId?: string;
  locale: string;
}) {
  const snapshot = await loadOrgSnapshot(input.organizationId);
  const { products } = snapshot;
  const dashboard = computeDashboard(snapshot);

  if (process.env.OPENAI_API_KEY) {
    try {
      return await openaiSimulation({
        scenario: input.scenario,
        dashboard,
        products,
        productId: input.productId,
        locale: input.locale,
      });
    } catch {
      // fall through to mock
    }
  }

  return mockSimulation({
    scenario: input.scenario,
    dashboard,
    products,
    productId: input.productId,
    locale: input.locale,
  });
}
