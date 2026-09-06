"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SimulationResult, SimulationScenario } from "@/lib/ai/types";
import { formatSar } from "@/lib/format";

const scenarios: SimulationScenario[] = [
  "raise_prices",
  "cut_ads",
  "hire_staff",
  "focus_product",
];

type ProductOption = { id: string; name: string };

export function SimulatorForm({
  products,
  locale,
}: {
  products: ProductOption[];
  locale: string;
}) {
  const t = useTranslations("simulator");
  const [scenario, setScenario] = useState<SimulationScenario>("raise_prices");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  async function run() {
    setPending(true);
    const response = await fetch("/api/simulator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario, productId, locale }),
    });
    const json = (await response.json()) as SimulationResult;
    setResult(json);
    setPending(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {scenarios.map((item) => (
              <label key={item} className="flex items-center gap-3 text-sm">
                <input
                  type="radio"
                  name="scenario"
                  checked={scenario === item}
                  onChange={() => setScenario(item)}
                />
                {t(item)}
              </label>
            ))}
          </div>
          {scenario === "focus_product" ? (
            <div className="space-y-2">
              <label className="text-sm">{t("product")}</label>
              <select
                className="h-11 w-full rounded-md border border-border bg-navy px-3 text-sm"
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <Button className="w-full" onClick={run} disabled={pending}>
            {pending ? t("running") : t("run")}
          </Button>
        </CardContent>
      </Card>

      {result ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent>
                <p className="text-xs text-muted-foreground">{t("revenue")}</p>
                <p className="mt-2 text-lg font-semibold">{formatSar(result.revenueDelta, locale)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-xs text-muted-foreground">{t("profit")}</p>
                <p className="mt-2 text-lg font-semibold">{formatSar(result.profitDelta, locale)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-xs text-muted-foreground">{t("cash")}</p>
                <p className="mt-2 text-lg font-semibold">{formatSar(result.cashDelta, locale)}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="space-y-3">
              <p className="text-sm leading-7 text-slate-200">{result.narrative}</p>
              <div>
                <p className="text-xs text-muted-foreground">{t("assumptions")}</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  {result.assumptions.map((item) => (
                    <li key={item}>— {item}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="text-sm leading-7 text-muted-foreground">
            {t("lead")}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
