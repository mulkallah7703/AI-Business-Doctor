import { getServerSession } from "next-auth";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

export async function requireOrg() {
  const session = await getServerSession(authOptions);
  const locale = await getLocale();

  if (!session?.user?.email) {
    redirect(`/${locale}/login`);
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      memberships: { include: { organization: true }, take: 1 },
    },
  });

  const organization = user?.memberships[0]?.organization;
  if (!user || !organization) {
    redirect(`/${locale}/login`);
  }

  return { user, organization, locale, session };
}
