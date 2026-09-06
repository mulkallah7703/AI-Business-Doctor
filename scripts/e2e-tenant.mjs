import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const base = "http://localhost:3000";

async function signup(payload) {
  const res = await fetch(`${base}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`signup failed ${res.status} ${JSON.stringify(body)}`);
  return body;
}

async function sessionCookie(email, password) {
  const csrfRes = await fetch(`${base}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const cookieHeader = (csrfRes.headers.getSetCookie?.() ?? [])
    .map((item) => item.split(";")[0])
    .join("; ");
  const login = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader,
    },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      redirect: "false",
      json: "true",
    }),
    redirect: "manual",
  });
  const setCookie = login.headers.getSetCookie?.() ?? [];
  const cookie = [...(csrfRes.headers.getSetCookie?.() ?? []), ...setCookie]
    .map((item) => item.split(";")[0])
    .join("; ");
  if (!cookie.includes("next-auth.session-token") && !cookie.includes("__Secure-next-auth.session-token")) {
    throw new Error(`login did not set session cookie (${login.status})`);
  }
  return cookie;
}

async function json(cookie, path, init = {}) {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Cookie: cookie,
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} ${res.status} ${JSON.stringify(body)}`);
  return body;
}

async function main() {
  const stamp = Date.now();
  const a = {
    name: "مؤسس أ",
    email: `founder-a-${stamp}@example.com`,
    password: "password12",
    organizationName: "منشأة الأفق",
  };
  const b = {
    name: "مؤسس ب",
    email: `founder-b-${stamp}@example.com`,
    password: "password12",
    organizationName: "منشأة النخيل",
  };

  const createdA = await signup(a);
  const createdB = await signup(b);
  if (createdA.organizationId === createdB.organizationId) {
    throw new Error("signup reused an organization");
  }

  const cookieA = await sessionCookie(a.email, a.password);
  const cookieB = await sessionCookie(b.email, b.password);
  const demoCookie = await sessionCookie("demo@businessdoctor.ai", "demo1234");

  await json(cookieA, "/api/org/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "منشأة الأفق",
      nameEn: "Ufuq Co",
      city: "الرياض",
      currency: "SAR",
      sector: "retail_ecommerce",
      selectedSources: ["sales"],
    }),
  });
  await json(cookieB, "/api/org/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "منشأة النخيل",
      nameEn: "Nakheel Co",
      city: "جدة",
      currency: "SAR",
      sector: "hospitality",
      selectedSources: ["sales"],
    }),
  });

  const rows = [
    { date: "2026-08-01", revenue: "18400", orders: "42", sessions: "610", conversions: "42" },
    { date: "2026-08-02", revenue: "21150", orders: "49", sessions: "640", conversions: "49" },
    { date: "2026-08-03", revenue: "19680", orders: "45", sessions: "590", conversions: "45" },
  ];
  const imported = await json(cookieA, "/api/import/commit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: "sales",
      sourceKey: "sales",
      fileName: "sales.csv",
      mapping: {
        date: "date",
        revenue: "revenue",
        orders: "orders",
        sessions: "sessions",
        conversions: "conversions",
      },
      rows,
    }),
  });
  if (imported.imported !== 3) throw new Error(`expected 3 rows, got ${imported.imported}`);

  const metricsA = await prisma.dailyMetric.aggregate({
    where: { organizationId: createdA.organizationId },
    _sum: { revenue: true },
    _count: true,
  });
  const metricsB = await prisma.dailyMetric.count({
    where: { organizationId: createdB.organizationId },
  });
  if (metricsA._count !== 3) throw new Error("org A missing imported metrics");
  if (Math.round(metricsA._sum.revenue) !== 18400 + 21150 + 19680) {
    throw new Error(`org A revenue mismatch ${metricsA._sum.revenue}`);
  }
  if (metricsB !== 0) throw new Error("org B leaked org A data");

  const demoCount = await prisma.dailyMetric.count({
    where: { organizationId: "org_alnoor" },
  });
  if (demoCount < 80) throw new Error("demo tenant was damaged");

  const hashOk = await bcrypt.compare(
    "demo1234",
    (await prisma.user.findUnique({ where: { email: "demo@businessdoctor.ai" } })).passwordHash,
  );
  if (!hashOk) throw new Error("demo password broken");

  // Cross-tenant: B must not see A's source ids
  const sourceA = await prisma.dataSource.findFirst({
    where: { organizationId: createdA.organizationId, key: "sales" },
  });
  const sneak = await fetch(`${base}/api/sources/${sourceA.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookieB },
    body: JSON.stringify({ connected: true }),
  });
  if (sneak.status !== 404) throw new Error(`expected 404 on cross-tenant PATCH, got ${sneak.status}`);

  const sessionDemo = await json(demoCookie, "/api/auth/session");
  if (sessionDemo?.user?.organizationId !== "org_alnoor") {
    throw new Error("demo session not scoped to Al-Noor");
  }

  console.log("e2e tenant isolation passed", {
    orgA: createdA.organizationId,
    orgB: createdB.organizationId,
    revenueA: metricsA._sum.revenue,
    demoDays: demoCount,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
