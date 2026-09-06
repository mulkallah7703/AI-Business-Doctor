import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiOrg } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { applyMapping } from "@/lib/import/validate";
import { commitImport, markSourceImported } from "@/lib/import/commit";
import { refreshOrgIntelligence } from "@/lib/ai/refresh";
import type { ImportKind } from "@/lib/connectors";

const schema = z.object({
  kind: z.enum(["sales", "expenses", "customers", "leads", "inventory", "campaigns"]),
  sourceKey: z.string().min(1),
  fileName: z.string().min(1),
  mapping: z.record(z.string(), z.string()),
  rows: z.array(z.record(z.string(), z.string())),
});

export async function POST(request: Request) {
  const auth = await requireApiOrg();
  if (!auth.ok) return auth.response;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const source = await prisma.dataSource.findFirst({
    where: { organizationId: auth.organization.id, key: parsed.data.sourceKey },
  });
  if (!source) {
    return NextResponse.json({ error: "Unknown data source" }, { status: 404 });
  }

  const mapped = applyMapping(parsed.data.rows, parsed.data.mapping, parsed.data.kind as ImportKind);
  if (!mapped.ok) {
    return NextResponse.json(
      { error: mapped.error, missingRequired: mapped.missingRequired, errors: mapped.errors },
      { status: 422 },
    );
  }

  try {
    await prisma.dataSource.update({
      where: { id: source.id },
      data: { status: "syncing", lastError: null },
    });

    const written = await prisma.$transaction(async (tx) => {
      const count = await commitImport({
        db: tx,
        organizationId: auth.organization.id,
        kind: parsed.data.kind,
        rows: mapped.rows,
      });
      await markSourceImported(tx, auth.organization.id, parsed.data.sourceKey);
      await tx.importBatch.create({
        data: {
          organizationId: auth.organization.id,
          dataSourceKey: parsed.data.sourceKey,
          kind: parsed.data.kind,
          fileName: parsed.data.fileName,
          rowCount: count,
          status: "imported",
        },
      });
      return count;
    });

    const intelligence = await refreshOrgIntelligence(auth.organization.id);
    return NextResponse.json({
      imported: written,
      skipped: mapped.errors.length,
      errors: mapped.errors.slice(0, 12),
      intelligence,
    });
  } catch (error) {
    await prisma.dataSource.update({
      where: { id: source.id },
      data: {
        status: "error",
        lastError: error instanceof Error ? error.message : "Import failed",
      },
    });
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
