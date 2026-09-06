import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiOrg } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { CURRENCIES, SECTORS } from "@/lib/connectors";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  nameEn: z.string().trim().max(120).optional(),
  city: z.string().trim().max(80).optional(),
  currency: z.enum(CURRENCIES).optional(),
  sector: z.enum(SECTORS.map((item) => item.key) as [string, ...string[]]).optional(),
  timezone: z.string().trim().max(60).optional(),
});

export async function PATCH(request: Request) {
  const auth = await requireApiOrg();
  if (!auth.ok) return auth.response;
  if (auth.membership.role !== "owner") {
    return NextResponse.json({ error: "Owner role required" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const organization = await prisma.organization.update({
    where: { id: auth.organization.id },
    data: {
      name: parsed.data.name,
      nameEn: parsed.data.nameEn?.trim() || parsed.data.name,
      city: parsed.data.city ?? auth.organization.city,
      currency: parsed.data.currency ?? auth.organization.currency,
      sector: parsed.data.sector ?? auth.organization.sector,
      timezone: parsed.data.timezone ?? auth.organization.timezone,
    },
  });

  return NextResponse.json({
    id: organization.id,
    name: organization.name,
    nameEn: organization.nameEn,
    city: organization.city,
    currency: organization.currency,
    sector: organization.sector,
  });
}
