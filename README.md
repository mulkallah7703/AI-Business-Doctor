# طبيب الأعمال الذكي · AI Business Doctor

A bilingual (Arabic-first, English toggle) SaaS MVP that acts as a continuous AI CEO advisor for SMEs. It is a briefing and diagnosis tool, not a traditional BI dashboard.

Core loop: **Detect → Diagnose → Predict → Recommend → Act → Measure**

## Demo

```
Email:    demo@businessdoctor.ai
Password: demo1234
Org:      مؤسسة النور للتجارة (Al-Noor Trading Establishment)
```

The seed is a 90-day Saudi retail / e-commerce story with intentional anomalies:

- checkout conversion falling from ~8.2% to ~5.7%
- cash-flow pressure after a cash inventory buy
- rising warehouse overtime and shipping cost
- neglected WhatsApp leads
- high-margin Royal Argan oil understocked
- diluted ad ROI from broad TikTok / Snap prospecting

## Quick start

```bash
cp .env.example .env
npm install
npx prisma db push
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Locale defaults to Arabic (`/ar`) with RTL. Toggle to English from the header.

`OPENAI_API_KEY` is optional. When it is missing, a deterministic mock AI layer still writes a high-quality daily briefing and what-if narrative from live seed metrics. Briefings are persisted per organization / day / locale.

## Stack

- Next.js 15 App Router + TypeScript
- Tailwind CSS v4 + shadcn-style primitives
- Prisma + SQLite (swap `provider` to `postgresql` when you are ready)
- NextAuth credentials
- next-intl (`ar` default, `en` toggle)
- Recharts
- OpenAI-compatible client behind `lib/ai` (`OPENAI_BASE_URL` supported)

## Architecture

```
app/
  [locale]/                 # landing, login, authenticated app
  api/auth|actions|sources|simulator
components/                 # shell, KPI cards, health board, UI primitives
lib/ai/                     # provider abstraction (mock | openai)
lib/analytics/              # live KPIs, health score, simulator model
prisma/                     # portable schema + rich seed
messages/ar.json|en.json    # chrome copy
```

The organization / membership models are multi-tenant ready. MVP auth is a single seeded owner. Connectors on `/sources` only toggle mock connection state — no OAuth.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js + Turbopack |
| `npx prisma db push` | Create / sync SQLite schema |
| `npm run seed` | Reset demo org, 90 days of metrics, insights, actions, briefing |
| `npm run build` | Production build |

## Environment

See `.env.example`. Do not commit secrets.

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | `file:./dev.db` for local SQLite |
| `NEXTAUTH_SECRET` | yes | any long string locally |
| `NEXTAUTH_URL` | yes | `http://localhost:3000` |
| `OPENAI_API_KEY` | no | live briefing / simulator JSON |
| `OPENAI_BASE_URL` | no | OpenAI-compatible gateways |
| `OPENAI_MODEL` | no | defaults to `gpt-4o-mini` |

## Out of scope (intentionally)

Real WhatsApp / CRM / ads OAuth, multi-user RBAC, Stripe billing, native mobile, and true ML forecasting. Phase 2 can hang real connectors off `DataSource` and replace the mock layer in `lib/ai` without rewriting the product surfaces.
