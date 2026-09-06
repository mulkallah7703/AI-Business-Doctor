import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiOrg } from "@/lib/api-session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiOrg();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = (await request.json()) as { connected?: boolean };

  const existing = await prisma.dataSource.findFirst({
    where: { id, organizationId: auth.organization.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const connected = Boolean(body.connected);
  const updated = await prisma.dataSource.update({
    where: { id },
    data: {
      connected,
      lastSyncAt: connected ? new Date() : existing.lastSyncAt,
    },
  });

  return NextResponse.json(updated);
}
