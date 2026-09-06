#!/usr/bin/env node
/**
 * Vercel build: generate client, sync schema when a real Postgres URL exists,
 * optionally seed an empty database, then build Next.js.
 *
 * A missing database must not fail the Next.js build — preview deploys can
 * go live, then attach Neon and redeploy.
 */
const { spawnSync } = require("child_process");
const path = require("path");

function run(bin, args) {
  const result = spawnSync(process.execPath, [bin, ...args], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status) process.exit(result.status);
}

function isSqliteUrl(url) {
  return !url || /^(file:|sqlite:)/i.test(url);
}

const postgresUrl =
  (process.env.DATABASE_URL && !isSqliteUrl(process.env.DATABASE_URL)
    ? process.env.DATABASE_URL
    : "") ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  "";

if (postgresUrl) {
  process.env.DATABASE_URL = postgresUrl;
}

if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL =
    process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
}

if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET =
    process.env.VERCEL_GIT_COMMIT_SHA || "preview-only-set-NEXTAUTH_SECRET";
  console.warn(
    "NEXTAUTH_SECRET missing — using a preview fallback. Set a real secret before production login.",
  );
}

const prismaWrapper = path.join(__dirname, "prisma.cjs");
run(prismaWrapper, ["generate"]);

if (postgresUrl && process.env.SKIP_DB_PUSH !== "1") {
  run(prismaWrapper, ["db", "push", "--skip-generate"]);
} else if (!postgresUrl) {
  console.warn(
    "Skipping prisma db push (no Postgres URL). Landing will deploy; login needs Neon / Vercel Postgres.",
  );
}

if (postgresUrl && process.env.SEED_ON_BUILD === "true") {
  const tsx = require.resolve("tsx/cli");
  const seed = path.join(__dirname, "..", "prisma", "seed.ts");
  if (process.env.SEED_RESET !== "true") {
    process.env.SEED_RESET = "false";
  }
  run(tsx, [seed]);
}

const nextBin = require.resolve("next/dist/bin/next");
run(nextBin, ["build"]);
