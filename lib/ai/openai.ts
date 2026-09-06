import type { BriefingPayload, SimulationResult, SimulationScenario } from "./types";
import type { DashboardModel } from "@/lib/analytics/metrics";
import { loadSnapshotFacts } from "@/lib/analytics/metrics";
import type { Product } from "@prisma/client";

function endpoint() {
  const base = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  return `${base.replace(/\/$/, "")}/chat/completions`;
}

async function complete(system: string, user: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY missing");

  const response = await fetch(endpoint(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI-compatible error ${response.status}`);
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty model response");
  return content;
}

export async function openaiBriefing(
  dashboard: DashboardModel,
  locale: string,
): Promise<BriefingPayload> {
  const facts = loadSnapshotFacts(dashboard);
  const language = locale === "en" ? "English" : "Arabic (MSA, professional, calm)";
  const raw = await complete(
    `You are AI Business Doctor, a bilingual executive physician for Saudi SMEs. Currency is SAR. Return strict JSON: { "greeting": string, "summary": string, "items": [{ "rank": number, "kind": "urgent"|"opportunity"|"risk"|"growth"|"recommendation", "title": string, "body": string, "insightSlug": string, "effectSar": number }] }. Write in ${language}. Tone: CEO briefing, not a dashboard. Exactly 5 items. Prefer these slugs when relevant: checkout-conversion-drop, cash-runway-risk, argan-margin-opportunity, neglected-whatsapp-leads, ad-roi-dilution.`,
    `Live metrics: ${JSON.stringify(facts)}`,
  );
  const parsed = JSON.parse(raw) as BriefingPayload;
  return { ...parsed, source: "openai" };
}

export async function openaiSimulation(input: {
  scenario: SimulationScenario;
  dashboard: DashboardModel;
  products: Product[];
  productId?: string;
  locale: string;
}): Promise<SimulationResult> {
  const facts = loadSnapshotFacts(input.dashboard);
  const product = input.products.find((p) => p.id === input.productId);
  const language = input.locale === "en" ? "English" : "Arabic (MSA)";
  const raw = await complete(
    `You are AI Business Doctor. Return JSON: { "scenario": string, "revenueDelta": number, "profitDelta": number, "cashDelta": number, "assumptions": string[], "narrative": string }. Numbers are monthly SAR deltas. Write narrative and assumptions in ${language}. Be conservative and explicit.`,
    JSON.stringify({
      scenario: input.scenario,
      facts,
      product: product
        ? { nameAr: product.nameAr, nameEn: product.nameEn, price: product.price, cost: product.cost, stock: product.stock }
        : null,
    }),
  );
  const parsed = JSON.parse(raw) as SimulationResult;
  return { ...parsed, scenario: input.scenario, source: "openai" };
}
