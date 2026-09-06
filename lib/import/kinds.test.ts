import assert from "node:assert/strict";
import { applyMapping } from "./validate";
import { suggestMapping } from "./kinds";
import { parseDate, parseNumber } from "./parse";

const salesColumns = ["التاريخ", "المبيعات", "الطلبات"];
const mapping = suggestMapping(salesColumns, "sales");
assert.equal(mapping.date, "التاريخ");
assert.equal(mapping.revenue, "المبيعات");
assert.equal(mapping.orders, "الطلبات");

const validated = applyMapping(
  [
    { التاريخ: "2026-08-01", المبيعات: "18,400", الطلبات: "42" },
    { التاريخ: "bad", المبيعات: "x", الطلبات: "1" },
  ],
  mapping,
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

console.log("import mapping tests passed");
