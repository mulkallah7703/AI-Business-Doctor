import { utcDay } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { computeDashboard } from "@/lib/analytics/metrics";
import { mockBriefing, mockSimulation } from "./mock";
import { openaiBriefing, openaiSimulation } from "./openai";
import type { SimulationScenario } from "./types";

export async function getOrCreateBriefing(organizationId: string, locale: string) {
  const date = utcDay();
  const existing = await prisma.briefing.findUnique({
    where: {
      organizationId_date_locale: { organizationId, date, locale },
    },
  });
  if (existing) return existing;

  const [metrics, insights, products, leads, campaigns] = await Promise.all([
    prisma.dailyMetric.findMany({ where: { organizationId }, orderBy: { date: "asc" } }),
    prisma.insight.findMany({ where: { organizationId } }),
    prisma.product.findMany({ where: { organizationId } }),
    prisma.lead.findMany({ where: { organizationId } }),
    prisma.campaign.findMany({ where: { organizationId } }),
  ]);

  const dashboard = computeDashboard({ metrics, insights, products, leads, campaigns });
  let payload = mockBriefing(dashboard, locale);

  if (process.env.OPENAI_API_KEY) {
    try {
      payload = await openaiBriefing(dashboard, locale);
    } catch {
      payload = mockBriefing(dashboard, locale);
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
  const [metrics, insights, products, leads, campaigns] = await Promise.all([
    prisma.dailyMetric.findMany({
      where: { organizationId: input.organizationId },
      orderBy: { date: "asc" },
    }),
    prisma.insight.findMany({ where: { organizationId: input.organizationId } }),
    prisma.product.findMany({ where: { organizationId: input.organizationId } }),
    prisma.lead.findMany({ where: { organizationId: input.organizationId } }),
    prisma.campaign.findMany({ where: { organizationId: input.organizationId } }),
  ]);

  const dashboard = computeDashboard({ metrics, insights, products, leads, campaigns });

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
