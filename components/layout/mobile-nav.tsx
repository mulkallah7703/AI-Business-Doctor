"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Activity, ClipboardList, Gauge, LayoutDashboard, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/briefing", key: "briefing", icon: Stethoscope },
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/health", key: "health", icon: Gauge },
  { href: "/insights", key: "insights", icon: Activity },
  { href: "/actions", key: "actions", icon: ClipboardList },
] as const;

export function MobileNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-[#08101c]/95 px-1 py-2 backdrop-blur lg:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 px-1 py-1 text-[10px]",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
