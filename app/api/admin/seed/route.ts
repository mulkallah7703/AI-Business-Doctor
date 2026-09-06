import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { seedDemo } from "@/lib/seed";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(request: Request) {
  const expected = process.env.SEED_SECRET;
  if (!expected || expected.length < 16) return false;

  const header =
    request.headers.get("x-seed-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";

  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const force =
    new URL(request.url).searchParams.get("force") === "1" ||
    new URL(request.url).searchParams.get("reset") === "1";

  try {
    const result = await seedDemo({ reset: force });
    return NextResponse.json({
      ok: true,
      ...result,
      login: "demo@businessdoctor.ai / demo1234",
    });
  } catch (error) {
    console.error("seed failed", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
