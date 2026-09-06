import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireApiOrg() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { memberships: { include: { organization: true }, take: 1 } },
  });
  const organization = user?.memberships[0]?.organization;
  if (!user || !organization) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "No organization" }, { status: 403 }),
    };
  }

  return { ok: true as const, user, organization };
}
