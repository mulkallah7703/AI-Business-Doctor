import assert from "node:assert/strict";
import { applyMapping } from "./validate";
import { sampleCsv, suggestMapping } from "./kinds";
import { parseDate, parseNumber, parseTabular } from "./parse";
import {
  bucketExpenseCategory,
  groupExpensesByDate,
  groupSalesByDate,
  normalizeEmail,
  normalizePhone,
} from "./aggregate";
import { commitImport, markSourceImported } from "./commit";
import { CONNECTOR_CATALOG, IMPORT_KINDS, sourceAcceptsUpload, type ImportKind } from "@/lib/connectors";

const mustOpenUpload = ["sales", "expenses", "crm", "inventory", "ads", "employees"];
const comingSoonOnly = ["banking", "ecommerce", "whatsapp", "bookings"];

for (const key of mustOpenUpload) {
  const item = CONNECTOR_CATALOG.find((connector) => connector.key === key);
  assert.ok(item, `${key} should exist in the catalog`);
  assert.equal(sourceAcceptsUpload(item), true, `${key} must open the CSV/Excel upload flow`);
}

for (const key of comingSoonOnly) {
  const item = CONNECTOR_CATALOG.find((connector) => connector.key === key);
  assert.ok(item, `${key} should exist in the catalog`);
  assert.equal(sourceAcceptsUpload(item), false, `${key} stays coming-soon (no upload kinds)`);
}

function mapKind(kind: ImportKind, rows: Record<string, string>[], columns = Object.keys(rows[0] ?? {})) {
  return applyMapping(rows, suggestMapping(columns, kind), kind);
}

const salesColumns = ["التاريخ", "المبيعات", "الطلبات"];
const salesMapping = suggestMapping(salesColumns, "sales");
assert.equal(salesMapping.date, "التاريخ");
assert.equal(salesMapping.revenue, "المبيعات");
assert.equal(salesMapping.orders, "الطلبات");

const validated = applyMapping(
  [
    { التاريخ: "2026-08-01", المبيعات: "18,400", الطلبات: "42" },
    { التاريخ: "bad", المبيعات: "x", الطلبات: "1" },
  ],
  salesMapping,
  "sales",
);
assert.equal(validated.ok, true);
assert.equal(validated.rows.length, 1);
assert.equal(validated.rows[0].revenue, 18400);
assert.ok(validated.errors.length >= 1);

assert.ok(parseDate("2026-08-01"));
assert.ok(parseDate("01/08/2026"));
assert.equal(parseNumber("١٢٠٠"), 1200);

const missing = applyMapping([], {}, "sales");
assert.equal(missing.ok, false);
assert.deepEqual(missing.missingRequired, ["date", "revenue"]);

const emptyMapped = applyMapping([], { date: "date", revenue: "revenue" }, "sales");
assert.equal(emptyMapped.ok, false);
assert.equal(emptyMapped.error, "EMPTY_FILE");

assert.equal(bucketExpenseCategory("cogs"), "cogs");
assert.equal(bucketExpenseCategory("تكلفة البضاعة"), "cogs");
assert.equal(bucketExpenseCategory("ads"), "adSpend");
assert.equal(bucketExpenseCategory("إعلان"), "adSpend");
assert.equal(bucketExpenseCategory("opex"), "expenses");
assert.equal(normalizeEmail("  A@B.COM "), "a@b.com");
assert.equal(normalizePhone("050-111-2222"), "0501112222");

const arabicCases: Record<ImportKind, string[]> = {
  sales: ["التاريخ", "الإيراد"],
  expenses: ["التاريخ", "المبلغ"],
  customers: ["الاسم", "البريد", "الجوال"],
  leads: ["الاسم", "المصدر", "الحالة"],
  inventory: ["الرمز", "السعر", "الكمية"],
  campaigns: ["الاسم", "القناة", "الإنفاق"],
  employees: ["الاسم", "الدور", "الراتب"],
  ops: ["التاريخ", "العدد", "الرواتب"],
};

const requiredByKind: Record<ImportKind, string[]> = {
  sales: ["date", "revenue"],
  expenses: ["date", "amount"],
  customers: ["name"],
  leads: ["name"],
  inventory: ["sku", "price", "stock"],
  campaigns: ["nameAr", "channel", "spend"],
  employees: ["name"],
  ops: ["date"],
};

for (const kind of IMPORT_KINDS) {
  const mapping = suggestMapping(arabicCases[kind], kind);
  for (const key of requiredByKind[kind]) {
    assert.ok(mapping[key], `${kind} should map required ${key} from Arabic headers`);
  }

  const sample = sampleCsv(kind);
  const parsed = parseTabular(Buffer.from(sample, "utf8"), `${kind}.csv`);
  const fromSample = mapKind(kind, parsed.rows, parsed.columns);
  assert.equal(fromSample.ok, true, `${kind} sample must map cleanly`);
  assert.ok(fromSample.rows.length >= 3, `${kind} sample should have 3+ rows`);
}

const expenseRows = mapKind("expenses", [
  { date: "2026-08-01", amount: "4200", category: "opex" },
  { date: "2026-08-01", amount: "8100", category: "cogs" },
  { date: "2026-08-01", amount: "1600", category: "ads" },
]);
assert.equal(expenseRows.ok, true);
const grouped = groupExpensesByDate(expenseRows.rows);
assert.equal(grouped.length, 1);
assert.equal(grouped[0].expenses, 4200);
assert.equal(grouped[0].cogs, 8100);
assert.equal(grouped[0].adSpend, 1600);

const salesGroup = groupSalesByDate(
  mapKind("sales", [
    { date: "2026-08-01", revenue: "1000", orders: "2" },
    { date: "2026-08-01", revenue: "500", orders: "1" },
  ]).rows,
);
assert.equal(salesGroup[0].revenue, 1500);
assert.equal(salesGroup[0].orders, 3);

const optionalBad = applyMapping(
  [{ sku: "A1", price: "10", quantity: "4", cost: "not-a-number" }],
  { sku: "sku", price: "price", stock: "quantity", cost: "cost" },
  "inventory",
);
assert.equal(optionalBad.ok, true);
assert.equal(optionalBad.rows[0].cost, null);

type Row = Record<string, unknown> & { id?: string };
type Where = Record<string, unknown>;

function memoryDb() {
  const tables: Record<string, Row[]> = {
    dailyMetric: [],
    customer: [],
    lead: [],
    product: [],
    campaign: [],
    employee: [],
    dataSource: [
      { id: "src_sales", organizationId: "org_test", key: "sales", connected: false, status: "disconnected" },
      { id: "src_expenses", organizationId: "org_test", key: "expenses", connected: false, status: "disconnected" },
      { id: "src_crm", organizationId: "org_test", key: "crm", connected: false, status: "disconnected" },
      { id: "src_inventory", organizationId: "org_test", key: "inventory", connected: false, status: "disconnected" },
      { id: "src_ads", organizationId: "org_test", key: "ads", connected: false, status: "disconnected" },
      { id: "src_employees", organizationId: "org_test", key: "employees", connected: false, status: "disconnected" },
    ],
  };

  const match = (row: Row, where: Where = {}) =>
    Object.entries(where).every(([key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const nested = value as Record<string, unknown>;
        if ("equals" in nested) return row[key] === nested.equals;
        return Object.entries(nested).every(([inner, innerValue]) => row[inner] === innerValue);
      }
      return row[key] === value;
    });

  const repo = (name: string) => ({
    findMany: async ({ where }: { where?: Where } = {}) => tables[name].filter((row) => match(row, where)),
    findFirst: async ({ where }: { where?: Where } = {}) => tables[name].find((row) => match(row, where)) ?? null,
    findUnique: async ({ where }: { where?: Where } = {}) => {
      const compound = (where?.organizationId_date ||
        where?.organizationId_sku ||
        where?.organizationId_key) as Where | undefined;
      if (compound) return tables[name].find((row) => match(row, compound)) ?? null;
      return tables[name].find((row) => match(row, where)) ?? null;
    },
    create: async ({ data }: { data: Row }) => {
      const row = { id: String(data.id ?? `${name}_${tables[name].length + 1}`), ...data };
      tables[name].push(row);
      return row;
    },
    update: async ({ where, data }: { where: { id: string }; data: Row }) => {
      const row = tables[name].find((item) => item.id === where.id);
      if (!row) throw new Error("missing row");
      Object.assign(row, data);
      return row;
    },
    upsert: async ({
      where,
      update,
      create,
    }: {
      where: Where;
      update: Row;
      create: Row;
    }) => {
      const compound = (where.organizationId_sku as Where | undefined) ?? where;
      const existing = tables[name].find((row) => match(row, compound));
      if (existing) {
        Object.assign(existing, update);
        return existing;
      }
      const row = { id: String(create.id ?? `${name}_${tables[name].length + 1}`), ...create };
      tables[name].push(row);
      return row;
    },
  });

  return {
    tables,
    dailyMetric: repo("dailyMetric"),
    customer: repo("customer"),
    lead: repo("lead"),
    product: repo("product"),
    campaign: repo("campaign"),
    employee: repo("employee"),
    dataSource: repo("dataSource"),
  };
}

async function runCommitCases() {
  const commits: Array<{ kind: ImportKind; sourceKey: string }> = [
    { kind: "sales", sourceKey: "sales" },
    { kind: "expenses", sourceKey: "expenses" },
    { kind: "customers", sourceKey: "crm" },
    { kind: "leads", sourceKey: "crm" },
    { kind: "inventory", sourceKey: "inventory" },
    { kind: "campaigns", sourceKey: "ads" },
    { kind: "employees", sourceKey: "employees" },
    { kind: "ops", sourceKey: "employees" },
  ];

  for (const item of commits) {
    const db = memoryDb();
    const parsed = parseTabular(Buffer.from(sampleCsv(item.kind), "utf8"), `${item.kind}.csv`);
    const mapped = mapKind(item.kind, parsed.rows, parsed.columns);
    assert.equal(mapped.ok, true, `${item.kind} mapping failed before commit`);
    const written = await commitImport({
      db: db as never,
      organizationId: "org_test",
      kind: item.kind,
      rows: mapped.rows,
    });
    assert.ok(written >= 3, `${item.kind} should write several rows`);
    await markSourceImported(db as never, "org_test", item.sourceKey);
    const source = db.tables.dataSource.find((row) => row.key === item.sourceKey);
    assert.equal(source?.connected, true, `${item.sourceKey} should be connected after ${item.kind}`);
    assert.equal(source?.status, "connected");
    assert.ok(source?.lastSyncAt);
  }

  const dedupeDb = memoryDb();
  const customerMapped = mapKind("customers", [
    { name: "نورة", email: "noura@example.com", phone: "0502222222", status: "regular" },
    { name: "نورة 2", email: "noura@example.com", phone: "0509999999", status: "vip" },
  ]);
  await commitImport({
    db: dedupeDb as never,
    organizationId: "org_test",
    kind: "customers",
    rows: customerMapped.rows,
  });
  assert.equal(dedupeDb.tables.customer.length, 1);
  assert.equal(dedupeDb.tables.customer[0].status, "vip");
}

runCommitCases()
  .then(() => {
    const bom = parseTabular(Buffer.from("\uFEFFdate,revenue\n2026-08-01,10\n", "utf8"), "bom.csv");
    assert.equal(bom.columns[0], "date");
    console.log("import mapping and commit tests passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
