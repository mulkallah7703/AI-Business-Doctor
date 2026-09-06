import type { Campaign, Customer, DailyMetric, Employee, Insight, Lead, Product } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type OrgSnapshot = {
  metrics: DailyMetric[];
  insights: Insight[];
  products: Product[];
  leads: Lead[];
  campaigns: Campaign[];
  customers: Customer[];
  employees: Employee[];
};

export async function loadOrgSnapshot(organizationId: string): Promise<OrgSnapshot> {
  const [metrics, insights, products, leads, campaigns, customers, employees] = await Promise.all([
    prisma.dailyMetric.findMany({ where: { organizationId }, orderBy: { date: "asc" } }),
    prisma.insight.findMany({ where: { organizationId } }),
    prisma.product.findMany({ where: { organizationId } }),
    prisma.lead.findMany({ where: { organizationId } }),
    prisma.campaign.findMany({ where: { organizationId } }),
    prisma.customer.findMany({ where: { organizationId } }),
    prisma.employee.findMany({ where: { organizationId } }),
  ]);
  return { metrics, insights, products, leads, campaigns, customers, employees };
}

export function orgHasData(input: {
  metrics: unknown[];
  products: unknown[];
  leads: unknown[];
  campaigns: unknown[];
  customers?: unknown[];
  employees?: unknown[];
}) {
  return (
    input.metrics.length > 0 ||
    input.products.length > 0 ||
    input.leads.length > 0 ||
    input.campaigns.length > 0 ||
    (input.customers?.length ?? 0) > 0 ||
    (input.employees?.length ?? 0) > 0
  );
}
