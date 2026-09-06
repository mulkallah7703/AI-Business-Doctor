#!/usr/bin/env node
/**
 * Routes Prisma to SQLite (local file: URLs) or Postgres (Vercel / Neon).
 * Generates a throwaway SQLite schema from prisma/schema.prisma so models stay DRY.
 *
 * On Vercel without a Postgres URL we still generate a Postgres client using a
 * dummy URL so `npm install` / `next build` succeed. Runtime queries need a real DB.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const DUMMY_POSTGRES =
  "postgresql://prisma:prisma@127.0.0.1:5432/prisma?schema=public";

function loadDotEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  for (const raw of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function isSqliteUrl(url) {
  return !url || /^(file:|sqlite:)/i.test(url);
}

function postgresCandidate() {
  const url = process.env.DATABASE_URL;
  if (url && !isSqliteUrl(url)) return url;
  return (
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    ""
  );
}

loadDotEnv();

const onVercel = Boolean(process.env.VERCEL);
const realPostgres = postgresCandidate();
const forwarded = process.argv.slice(2);
const isGenerate = forwarded[0] === "generate";
const writesDatabase = ["db", "migrate", "studio"].includes(forwarded[0]);

if (onVercel || realPostgres) {
  process.env.DATABASE_URL = realPostgres || (isGenerate ? DUMMY_POSTGRES : realPostgres);
  process.env.DIRECT_URL =
    process.env.DIRECT_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL;

  if (writesDatabase && !realPostgres) {
    console.warn(
      "No Postgres DATABASE_URL (or POSTGRES_PRISMA_URL) on Vercel — skipping Prisma DB command.\n" +
        "Attach Neon / Vercel Postgres, then redeploy (or POST /api/admin/seed).",
    );
    process.exit(0);
  }

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = DUMMY_POSTGRES;
  }
  if (!process.env.DIRECT_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
  }
} else {
  if (!process.env.DATABASE_URL) process.env.DATABASE_URL = "file:./dev.db";
  if (!process.env.DIRECT_URL) process.env.DIRECT_URL = process.env.DATABASE_URL;
}

const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";
const useSqlite = !onVercel && isSqliteUrl(databaseUrl);
const postgresSchema = path.join("prisma", "schema.prisma");
let schema = postgresSchema;

if (useSqlite) {
  const source = fs.readFileSync(postgresSchema, "utf8");
  const sqlite = source
    .replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"')
    .replace(/\n\s*directUrl\s*=\s*env\("DIRECT_URL"\)/, "");
  schema = path.join("prisma", "schema.sqlite.prisma");
  fs.writeFileSync(
    schema,
    `// Generated from schema.prisma for local SQLite. Do not edit.\n${sqlite}`,
  );
}

const prismaCli = require.resolve("prisma/build/index.js");
const args = [...forwarded, "--schema", schema];

const result = spawnSync(process.execPath, [prismaCli, ...args], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
