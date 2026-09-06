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
  const body = (await request.json()) as { status?: string };
  const status = body.status ?? "done";

  const existing = await prisma.action.findFirst({
    where: { id, organizationId: auth.organization.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.action.update({
    where: { id },
    data: {
      status,
      executedAt: status === "done" ? new Date() : existing.executedAt,
    },
  });

  return NextResponse.json(updated);
}
