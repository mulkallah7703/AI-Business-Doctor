export type BriefingKind =
  | "urgent"
  | "opportunity"
  | "risk"
  | "growth"
  | "recommendation";

export type BriefingItem = {
  rank: number;
  kind: BriefingKind;
  title: string;
  body: string;
  insightSlug?: string;
  effectSar?: number;
};

export type BriefingPayload = {
  greeting: string;
  summary: string;
  items: BriefingItem[];
  source: "openai" | "mock" | "seed";
};

export type SimulationScenario =
  | "raise_prices"
  | "cut_ads"
  | "hire_staff"
  | "focus_product";

export type SimulationResult = {
  scenario: SimulationScenario;
  revenueDelta: number;
  profitDelta: number;
  cashDelta: number;
  assumptions: string[];
  narrative: string;
  source: "openai" | "mock";
};
