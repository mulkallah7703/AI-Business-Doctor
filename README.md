# طبيب الأعمال الذكي · AI Business Doctor

A bilingual (Arabic-first, English toggle) **multi-tenant SaaS** that acts as a continuous AI CEO advisor for SMEs. It is a briefing and diagnosis tool, not a traditional BI dashboard.

Core loop: **Detect → Diagnose → Predict → Recommend → Act → Measure**

Each founder signs up, creates an organization, completes onboarding, and connects data (CSV / Excel or manual KPIs). Dashboards, health, briefing, and insights run on **that org’s data only**. The seeded Al-Noor workspace is an optional “Try demo” path — never the only path.

## Demo (optional)

```
Email:    demo@businessdoctor.ai
Password: demo1234
Org:      مؤسسة النور للتجارة (Al-Noor Trading Establishment)
```

The seed is a 90-day Saudi retail / e-commerce story with intentional anomalies. Reseeding **only** rebuilds this tenant. Signup organizations are never copied from it and are never wiped by `npm run seed`.

## Quick start (local / SQLite)

```bash
cp .env.example .env
npm install
npm run db:push
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Locale defaults to Arabic (`/ar`) with RTL.

### Test signup + CSV (the real product loop)

1. Open `/ar` → **إنشاء حساب**
2. Register a new email (not the demo address). You land on a 3-step Arabic-first onboarding wizard (profile → sources → connect/skip).
3. Finish onboarding. The command center is empty until data arrives.
4. Go to **مصادر البيانات**. Every uploadable card shows required vs optional columns and a sample CSV.
5. Upload a sample for **sales, expenses, customers, inventory, and campaigns** (and optionally employees / ops KPIs). Confirm the column mapping each time.
6. Each source should show **متصل** with `lastSyncAt`. Command center / health update from that org’s rows only.
7. Open a second browser profile, sign up another org, and confirm no data bleed.
8. Optional: `/ar/login?demo=1` still opens Al-Noor.

### Accepted file formats

CSV or Excel (`.csv`, `.xlsx`, `.xls`) with a header row. Arabic and English headers both map. Samples live in `public/samples/` and on **مصادر البيانات**.

| Source | Kind | Required | Optional aliases |
| --- | --- | --- | --- |
| Sales / orders | `sales` | `date` / التاريخ, `revenue` / الإيراد | orders, sessions, conversions, refunds, cogs |
| Expenses | `expenses` | `date`, `amount` / المبلغ | category (opex / cogs / ads), note, cash_out |
| Customers / leads | `customers` or `leads` | `name` / الاسم | email, phone (dedupe key), status, source, LTV / value, dates |
| Inventory | `inventory` | `sku` / الرمز, `price` / السعر, `quantity` / الكمية | name, cost, reorder_point |
| Ads / campaigns | `campaigns` | `name`, `channel` / القناة, `spend` / الإنفاق | revenue, conversions, start_date, end_date |
| Employees | `employees` | `name` | role, department, salary, utilization, overtime |
| Ops KPIs | `ops` | `date` | headcount, payroll, utilization, fulfillment_hours |

OAuth connectors (WhatsApp, banking, Salla, bookings) stay **coming soon** — they never fake a connection. Meta/Google ads can still be uploaded as a campaigns file today.

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
| `DATA_SOURCE_SECRET` | no | Encrypts connector `configJson`. Falls back to `NEXTAUTH_SECRET`. |

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
app/            [locale] pages + api/auth|signup|org|import|metrics|actions|sources|simulator|admin/seed
components/     shell, KPI cards, health board, empty states
lib/ai/         mock | openai | org-scoped insight refresh
lib/import/     CSV/Excel parse, column map, tenant-scoped commit
lib/analytics/  KPIs, health, simulator
lib/seed.ts     demo tenant only (CLI + gated HTTP)
scripts/        prisma.cjs (sqlite|postgres) + vercel-build.cjs
prisma/         Postgres schema (SQLite derived at generate time)
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js + Turbopack |
| `npm run db:push` | Sync schema (SQLite or Postgres from `DATABASE_URL`) |
| `npm run seed` | Rebuild **demo org only** (local; `SEED_RESET=false` to skip if present) |
| `npm test` | Import mapping + happy-path commit for every upload type |
| `npm run build` | Local production build (no db push) |
| `npm run build:vercel` | Generate + `db push` + optional seed + Next build |

## Out of scope (intentionally)

Full production OAuth for WhatsApp / Meta / Salla / banks, Stripe billing, mobile apps, and true ML models. Owner role works; team invite is a placeholder.
