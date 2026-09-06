import { connection } from "next/server";
import { getServerSession } from "next-auth";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

export async function requireOrg() {
  await connection();
  const session = await getServerSession(authOptions);
  const locale = await getLocale();

  if (!session?.user?.email) {
    redirect(`/${locale}/login`);
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      memberships: { include: { organization: true } },
    },
  });

  const preferredId = session.user.organizationId;
  const membership =
    user?.memberships.find((item) => item.organizationId === preferredId) ??
    user?.memberships[0];
  const organization = membership?.organization;
  if (!user || !organization) {
    redirect(`/${locale}/login`);
  }

  return { user, organization, membership, locale, session };
}

export async function requireOnboardedOrg() {
  const ctx = await requireOrg();
  if (!ctx.organization.onboardingCompletedAt) {
    redirect(`/${ctx.locale}/onboarding`);
  }
  return ctx;
}
