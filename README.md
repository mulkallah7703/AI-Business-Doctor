# طبيب الأعمال الذكي · AI Business Doctor

A bilingual (Arabic-first, English toggle) SaaS MVP that acts as a continuous AI CEO advisor for SMEs. It is a briefing and diagnosis tool, not a traditional BI dashboard.

Core loop: **Detect → Diagnose → Predict → Recommend → Act → Measure**

## Demo

```
Email:    demo@businessdoctor.ai
Password: demo1234
Org:      مؤسسة النور للتجارة (Al-Noor Trading Establishment)
```

The seed is a 90-day Saudi retail / e-commerce story with intentional anomalies: conversion drop, cash-flow pressure, rising ops cost, neglected WhatsApp leads, high-margin Argan opportunity, and diluted ad ROI.

## Quick start (local / SQLite)

```bash
cp .env.example .env
npm install
npm run db:push
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Locale defaults to Arabic (`/ar`) with RTL.

`DATABASE_URL=file:./dev.db` keeps Prisma on SQLite locally. Do not point a Vercel deploy at a `file:` URL — the serverless filesystem will not persist it.

## Deploy on Vercel (Postgres)

This repo is wired for **Vercel + Neon or Vercel Postgres**. There is no Vercel token in the cloud agent, so finish the first deploy from the Vercel dashboard / GitHub connector.

### 1. Import the repo

1. [vercel.com/new](https://vercel.com/new) → Import `mulkallah7703/AI-Business-Doctor`
2. Framework: Next.js (auto)
3. Build command is already `npm run build:vercel` via `vercel.json`
4. Preview deploys succeed without a database (marketing pages render). Add Postgres before relying on login / seed.

### 2. Create the database

**Option A — Neon (recommended)**  
Vercel → Storage → Create Database → Neon.  
Copy the **pooled** connection string and the **direct / unpooled** string.

**Option B — Vercel Postgres**  
Vercel → Storage → Create Database → Postgres.  
The integration usually injects `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`. The build script maps those onto Prisma automatically.

### 3. Environment variables

Set these for **Production** (and Preview if you want login there too):

| Variable | Required | What to put |
| --- | --- | --- |
| `DATABASE_URL` | yes* | Pooled Postgres URL (`sslmode=require`). *Skip if Vercel already set `POSTGRES_PRISMA_URL`. |
| `DIRECT_URL` | yes* | Unpooled / direct URL for `db push`. *Skip if `POSTGRES_URL_NON_POOLING` is set. |
| `NEXTAUTH_SECRET` | **yes** | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | yes | `https://YOUR_PROJECT.vercel.app` (no trailing slash). Falls back to `https://$VERCEL_URL` if omitted. |
| `SEED_SECRET` | recommended | `openssl rand -base64 32` — gates `POST /api/admin/seed` |
| `SEED_ON_BUILD` | first deploy | `true` so an empty database is seeded during build |
| `SEED_RESET` | no | `true` only if you want the build to wipe and reseed. Leave unset after go-live. |
| `OPENAI_API_KEY` | no | Live model. Mock AI is used when empty. |
| `OPENAI_BASE_URL` | no | Default `https://api.openai.com/v1` |
| `OPENAI_MODEL` | no | Default `gpt-4o-mini` |

`NEXTAUTH_SECRET` and a Postgres URL are the two things that will break a live login if missing.

### 4. Deploy

Click **Deploy**. The build will:

1. `prisma generate` (Postgres client)
2. `prisma db push` (create tables, non-destructive)
3. Seed **only if** `SEED_ON_BUILD=true` **and** the demo user is missing
4. `next build`

After the first successful deploy, you can set `SEED_ON_BUILD` back to `false`. Later deploys will not wipe demo actions.

### 5. Seed if you skipped `SEED_ON_BUILD`

```bash
curl -X POST "https://YOUR_PROJECT.vercel.app/api/admin/seed" \
  -H "x-seed-secret: $SEED_SECRET"
```

Add `?force=1` only to wipe and rebuild the demo tenant.

Then open `https://YOUR_PROJECT.vercel.app` and sign in with the demo credentials.

## Environment (local reference)

See `.env.example`. Never commit `.env`.

| Variable | Local | Production |
| --- | --- | --- |
| `DATABASE_URL` | `file:./dev.db` | Neon / Vercel Postgres pooled URL |
| `DIRECT_URL` | same as `DATABASE_URL` | Unpooled URL |
| `NEXTAUTH_SECRET` | any long string | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` | `https://….vercel.app` |
| `SEED_SECRET` | optional | required for the seed HTTP route |
| `OPENAI_API_KEY` | optional | optional |

## Stack

- Next.js 15 App Router + TypeScript
- Tailwind CSS v4 + shadcn-style primitives
- Prisma + SQLite locally, PostgreSQL on Vercel
- NextAuth credentials
- next-intl (`ar` default, `en` toggle)
- Recharts
- OpenAI-compatible client behind `lib/ai`

## Architecture

```
app/            [locale] pages + api/auth|actions|sources|simulator|admin/seed
components/     shell, KPI cards, health board
lib/ai/         mock | openai
lib/analytics/  KPIs, health, simulator
lib/seed.ts     shared demo seed (CLI + gated HTTP)
scripts/        prisma.cjs (sqlite|postgres) + vercel-build.cjs
prisma/         Postgres schema (SQLite derived at generate time)
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js + Turbopack |
| `npm run db:push` | Sync schema (SQLite or Postgres from `DATABASE_URL`) |
| `npm run seed` | Rebuild demo org (local; `SEED_RESET=false` to skip if present) |
| `npm run build` | Local production build (no db push) |
| `npm run build:vercel` | Generate + `db push` + optional seed + Next build |

## Out of scope (intentionally)

Real WhatsApp / CRM / ads OAuth, multi-user RBAC, Stripe billing, native mobile, and true ML forecasting.
