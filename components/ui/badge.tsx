import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-primary/30 bg-primary/10 text-primary",
        muted: "border-border bg-muted text-muted-foreground",
        danger: "border-rose-500/30 bg-rose-500/10 text-rose-300",
        warning: "border-amber-500/30 bg-amber-500/10 text-amber-200",
        success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function severityVariant(severity: string) {
  if (severity === "critical") return "danger" as const;
  if (severity === "high") return "warning" as const;
  if (severity === "low") return "muted" as const;
  return "default" as const;
}

export function healthVariant(score: number) {
  if (score >= 75) return "success" as const;
  if (score >= 55) return "warning" as const;
  return "danger" as const;
}
