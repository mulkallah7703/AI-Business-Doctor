import type { Prisma, PrismaClient } from "@prisma/client";
import { CONNECTOR_CATALOG } from "./connectors";
import { makeSlug, prefixedId } from "./ids";

type Db = PrismaClient | Prisma.TransactionClient;

export async function provisionDataSources(db: Db, organizationId: string) {
  await db.dataSource.createMany({
    data: CONNECTOR_CATALOG.map((source) => ({
      id: `${organizationId}_${source.key}`,
      organizationId,
      key: source.key,
      nameAr: source.nameAr,
      nameEn: source.nameEn,
      category: source.category,
      connected: false,
      status: "disconnected",
      ingestMode: source.ingestMode,
    })),
  });
}

export async function createTenant(db: Db, input: {
  userId?: string;
  email: string;
  name: string;
  passwordHash: string;
  organizationName: string;
  organizationNameEn?: string;
  city?: string;
  sector?: string;
  currency?: string;
}) {
  const organization = await db.organization.create({
    data: {
      id: prefixedId("org"),
      name: input.organizationName,
      nameEn: input.organizationNameEn?.trim() || input.organizationName,
      slug: makeSlug(input.organizationNameEn || input.organizationName),
      currency: input.currency || "SAR",
      timezone: "Asia/Riyadh",
      sector: input.sector || "retail_ecommerce",
      city: input.city?.trim() || "",
    },
  });

  const user = await db.user.create({
    data: {
      id: input.userId ?? prefixedId("user"),
      email: input.email,
      name: input.name,
      passwordHash: input.passwordHash,
      memberships: {
        create: { role: "owner", organizationId: organization.id },
      },
    },
  });

  await provisionDataSources(db, organization.id);
  return { user, organization };
}
