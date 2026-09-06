import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiOrg } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { CONNECTOR_CATALOG, CURRENCIES, SECTORS } from "@/lib/connectors";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  nameEn: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2).max(80),
  currency: z.enum(CURRENCIES).default("SAR"),
  sector: z.enum(SECTORS.map((item) => item.key) as [string, ...string[]]),
  selectedSources: z.array(z.string()).default([]),
});

export async function POST(request: Request) {
  const auth = await requireApiOrg();
  if (!auth.ok) return auth.response;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const allowed = new Set(CONNECTOR_CATALOG.map((item) => item.key));
  const selected = parsed.data.selectedSources.filter((key) => allowed.has(key));

  const organization = await prisma.organization.update({
    where: { id: auth.organization.id },
    data: {
      name: parsed.data.name,
      nameEn: parsed.data.nameEn?.trim() || parsed.data.name,
      city: parsed.data.city,
      currency: parsed.data.currency,
      sector: parsed.data.sector,
      onboardingCompletedAt: new Date(),
    },
  });

  return NextResponse.json({
    organizationId: organization.id,
    selectedSources: selected,
  });
}
