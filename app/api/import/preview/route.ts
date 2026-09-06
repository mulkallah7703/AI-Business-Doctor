import { NextResponse } from "next/server";
import { requireApiOrg } from "@/lib/api-session";
import { parseTabular } from "@/lib/import/parse";
import { suggestMapping } from "@/lib/import/kinds";
import type { ImportKind } from "@/lib/connectors";

const KINDS = new Set(["sales", "expenses", "customers", "leads", "inventory", "campaigns"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const auth = await requireApiOrg();
  if (!auth.ok) return auth.response;

  const form = await request.formData();
  const kind = String(form.get("kind") ?? "");
  const file = form.get("file");
  if (!KINDS.has(kind) || !(file instanceof File)) {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = parseTabular(buffer, file.name);
    return NextResponse.json({
      kind,
      fileName: file.name,
      columns: parsed.columns,
      preview: parsed.rows.slice(0, 6),
      rowCount: parsed.rows.length,
      suggestedMapping: suggestMapping(parsed.columns, kind as ImportKind),
      rows: parsed.rows,
    });
  } catch {
    return NextResponse.json({ error: "Could not parse file" }, { status: 422 });
  }
}
