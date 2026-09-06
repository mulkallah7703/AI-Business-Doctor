import { NextResponse } from "next/server";
import { requireApiOrg } from "@/lib/api-session";
import { parseTabular } from "@/lib/import/parse";
import { isImportKind, suggestMapping, KIND_FIELDS } from "@/lib/import/kinds";
import { importMessages, type ImportErrorCode } from "@/lib/import/messages";

const MAX_BYTES = 5 * 1024 * 1024;

function fail(code: ImportErrorCode, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ ...importMessages(code), ...extra }, { status });
}

export async function POST(request: Request) {
  const auth = await requireApiOrg();
  if (!auth.ok) return auth.response;

  const form = await request.formData();
  const kind = String(form.get("kind") ?? "");
  const file = form.get("file");
  if (!isImportKind(kind) || !(file instanceof File)) {
    return fail("INVALID_UPLOAD", 400);
  }
  if (file.size === 0) {
    return fail("EMPTY_FILE", 422);
  }
  if (file.size > MAX_BYTES) {
    return fail("FILE_TOO_LARGE", 413);
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
      suggestedMapping: suggestMapping(parsed.columns, kind),
      fields: KIND_FIELDS[kind],
      rows: parsed.rows,
    });
  } catch (error) {
    const code = error instanceof Error && error.message in {
      EMPTY_FILE: 1,
      NO_COLUMNS: 1,
      EMPTY_SHEET: 1,
    }
      ? (error.message as ImportErrorCode)
      : "EMPTY_FILE";
    return fail(code === "EMPTY_SHEET" || code === "NO_COLUMNS" || code === "EMPTY_FILE" ? code : "EMPTY_FILE", 422);
  }
}
