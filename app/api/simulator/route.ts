import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiOrg } from "@/lib/api-session";
import { simulateScenario } from "@/lib/ai";

const schema = z.object({
  scenario: z.enum(["raise_prices", "cut_ads", "hire_staff", "focus_product"]),
  productId: z.string().optional(),
  locale: z.enum(["ar", "en"]).default("ar"),
});

export async function POST(request: Request) {
  const auth = await requireApiOrg();
  if (!auth.ok) return auth.response;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await simulateScenario({
    organizationId: auth.organization.id,
    scenario: parsed.data.scenario,
    productId: parsed.data.productId,
    locale: parsed.data.locale,
  });

  return NextResponse.json(result);
}
