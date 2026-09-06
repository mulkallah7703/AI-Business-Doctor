import { NextResponse } from "next/server";
import { requireApiOrg } from "@/lib/api-session";
import { sampleCsv } from "@/lib/import/kinds";
import type { ImportKind } from "@/lib/connectors";

const KINDS = new Set(["sales", "expenses", "customers", "leads", "inventory", "campaigns"]);

export async function GET(request: Request) {
  const auth = await requireApiOrg();
  if (!auth.ok) return auth.response;
  const kind = new URL(request.url).searchParams.get("kind") ?? "";
  if (!KINDS.has(kind)) {
    return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
  }
  const body = sampleCsv(kind as ImportKind);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${kind}-sample.csv"`,
    },
  });
}
