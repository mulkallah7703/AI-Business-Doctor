import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiOrg } from "@/lib/api-session";
import { connectorByKey } from "@/lib/connectors";
import { sealConfig } from "@/lib/crypto";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiOrg();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = (await request.json()) as {
    connected?: boolean;
    config?: Record<string, unknown>;
  };

  const existing = await prisma.dataSource.findFirst({
    where: { id, organizationId: auth.organization.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const catalog = connectorByKey(existing.key);
  if (catalog?.ingestMode === "oauth") {
    return NextResponse.json(
      {
        error: "coming_soon",
        provider: catalog.comingSoonProvider,
        message: "OAuth connectors are not enabled in this release.",
      },
      { status: 409 },
    );
  }

  const connected = Boolean(body.connected);
  const updated = await prisma.dataSource.update({
    where: { id },
    data: {
      connected,
      status: connected ? "connected" : "disconnected",
      lastSyncAt: connected ? new Date() : existing.lastSyncAt,
      lastError: connected ? null : existing.lastError,
      configJson: body.config ? sealConfig(body.config) : existing.configJson,
    },
  });

  return NextResponse.json({
    id: updated.id,
    key: updated.key,
    connected: updated.connected,
    status: updated.status,
    lastSyncAt: updated.lastSyncAt,
  });
}
