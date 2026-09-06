#!/usr/bin/env node
/**
 * Vercel build: generate client, sync schema (non-destructive),
 * optionally seed an empty database, then build Next.js.
 *
 * SEED_ON_BUILD=true  → seed only if the demo user is missing (safe to leave on)
 * SEED_RESET=true     → wipe and reseed (do not leave on after first deploy)
 * SKIP_DB_PUSH=1      → skip prisma db push
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

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    "";
}

if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL =
    process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
}

if (!process.env.NEXTAUTH_SECRET) {
  console.warn(
    "NEXTAUTH_SECRET is not set. Login will fail until you add it in Vercel → Settings → Environment Variables.",
  );
}

const prismaWrapper = path.join(__dirname, "prisma.cjs");
run(prismaWrapper, ["generate"]);

if (process.env.SKIP_DB_PUSH !== "1") {
  run(prismaWrapper, ["db", "push", "--skip-generate"]);
}

if (process.env.SEED_ON_BUILD === "true") {
  const tsx = require.resolve("tsx/cli");
  const seed = path.join(__dirname, "..", "prisma", "seed.ts");
  if (process.env.SEED_RESET !== "true") {
    process.env.SEED_RESET = "false";
  }
  run(tsx, [seed]);
}

const nextBin = require.resolve("next/dist/bin/next");
run(nextBin, ["build"]);
