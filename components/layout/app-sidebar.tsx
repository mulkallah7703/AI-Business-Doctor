"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import {
  Activity,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  Plug,
  SlidersHorizontal,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand-mark";

const items = [
  { href: "/briefing", key: "briefing", icon: Stethoscope },
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/health", key: "health", icon: Gauge },
  { href: "/insights", key: "insights", icon: Activity },
  { href: "/simulator", key: "simulator", icon: SlidersHorizontal },
  { href: "/actions", key: "actions", icon: ClipboardList },
  { href: "/sources", key: "sources", icon: Plug },
] as const;

export function AppSidebar() {
  const t = useTranslations("nav");
  const brand = useTranslations("brand");
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-e border-border/80 bg-[#08101c] lg:flex lg:flex-col">
      <div className="flex items-center gap-3 px-5 py-6">
        <BrandMark />
        <div>
          <div className="text-sm font-semibold leading-tight">{brand("name")}</div>
          <div className="text-xs text-muted-foreground">{brand("tagline")}</div>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-slate-300 hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-5 text-xs text-muted-foreground">
        Detect → Diagnose → Predict → Recommend → Act → Measure
      </div>
    </aside>
  );
}
