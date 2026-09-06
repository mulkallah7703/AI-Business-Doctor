import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BrandMark } from "@/components/brand-mark";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const pipeline = ["detect", "diagnose", "predict", "recommend", "act", "measure"] as const;
const featureKeys = ["briefing", "health", "insights", "simulator"] as const;

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const pipe = await getTranslations("pipeline");
  const pricing = await getTranslations("pricing");
  const nav = await getTranslations("nav");
  const brand = await getTranslations("brand");

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <div className="text-sm font-semibold">{brand("name")}</div>
            <div className="text-xs text-muted-foreground">{brand("tagline")}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <Button variant="ghost" asChild>
            <Link href="/login">{nav("login")}</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">{nav("signup")}</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-8">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">{t("kicker")}</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-5xl">
          {t("headline")}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
          {t("subhead")}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link href="/signup">{t("ctaPrimary")}</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login?demo=1">{t("ctaDemo")}</Link>
          </Button>
        </div>
        <p className="mt-5 text-sm text-muted-foreground">{t("trust")}</p>
        <div className="ecg-line mt-10 h-10 rounded-lg border border-border/60 opacity-80" />
      </section>

      <section id="pipeline" className="border-y border-border/70 bg-[#08101c]/70">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-2xl font-semibold">{t("pipelineTitle")}</h2>
          <p className="mt-2 text-muted-foreground">{t("pipelineLead")}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {pipeline.map((key, index) => (
              <Card key={key}>
                <CardContent className="space-y-2">
                  <div className="text-xs text-primary">0{index + 1}</div>
                  <div className="font-semibold">{pipe(`${key}.title`)}</div>
                  <p className="text-sm leading-6 text-muted-foreground">{pipe(`${key}.body`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-semibold">{t("featuresTitle")}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {featureKeys.map((key) => (
            <Card key={key}>
              <CardContent>
                <h3 className="font-semibold">{nav(key)}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-300">{t(`feature.${key}`)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border/70 bg-[#08101c]/70">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-2xl font-semibold">{t("pricingTitle")}</h2>
          <p className="mt-2 text-muted-foreground">{t("pricingLead")}</p>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {(["starter", "growth", "enterprise"] as const).map((tier) => (
              <Card
                key={tier}
                className={tier === "growth" ? "border-primary/50 bg-primary/5" : ""}
              >
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-primary">{pricing(`${tier}.name`)}</div>
                    <div className="mt-2 text-3xl font-semibold">{pricing(`${tier}.price`)}</div>
                    <div className="text-xs text-muted-foreground">{pricing("sar")}</div>
                  </div>
                  <p className="text-sm text-slate-300">{pricing(`${tier}.desc`)}</p>
                  <ul className="space-y-2 text-sm text-slate-300">
                    {(pricing.raw(`${tier}.features`) as string[]).map((item) => (
                      <li key={item}>— {item}</li>
                    ))}
                  </ul>
                  <Button asChild variant={tier === "growth" ? "default" : "outline"}>
                    <Link href="/signup">{t("ctaPrimary")}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-semibold">{t("ctaBand")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("ctaBandLead")}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/signup">{t("ctaPrimary")}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login?demo=1">{t("ctaDemo")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
