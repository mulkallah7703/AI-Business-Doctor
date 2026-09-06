import { setRequestLocale } from "next-intl/server";
import { requireOnboardedOrg } from "@/lib/session";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { field } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { organization, user } = await requireOnboardedOrg();

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border/80 px-4 py-4 lg:px-8">
          <div>
            <p className="text-sm font-medium">
              {field(locale, organization.name, organization.nameEn)}
            </p>
            <p className="text-xs text-muted-foreground">{user.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 px-4 pb-24 pt-6 lg:px-8 lg:pb-10">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
