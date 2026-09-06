import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  title,
  body,
  actionHref = "/sources",
  actionLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-4 py-10">
        <div className="h-1 w-24 rounded-full bg-primary/70" />
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="max-w-2xl text-sm leading-7 text-slate-300">{body}</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
          {secondaryHref && secondaryLabel ? (
            <Button variant="outline" asChild>
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
