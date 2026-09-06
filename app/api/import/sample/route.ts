import { NextResponse } from "next/server";
import { requireApiOrg } from "@/lib/api-session";
import { isImportKind, sampleCsv } from "@/lib/import/kinds";
import { importMessages } from "@/lib/import/messages";

export async function GET(request: Request) {
  const auth = await requireApiOrg();
  if (!auth.ok) return auth.response;
  const kind = new URL(request.url).searchParams.get("kind") ?? "";
  if (!isImportKind(kind)) {
    return NextResponse.json({ ...importMessages("UNKNOWN_KIND") }, { status: 400 });
  }
  const body = sampleCsv(kind);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${kind}-sample.csv"`,
    },
  });
}
