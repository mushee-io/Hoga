# Hoga

Hoga is an operating system for autonomous AI businesses: a business can scope a request, quote within owner-set limits, collect payment, fulfill work, and deliver it.

## Local development

Copy `.env.example` to `.env`, set a PostgreSQL `DATABASE_URL`, then run `npm install`, `npm run db:migrate`, `npm run db:seed`, and `npm run dev`. For local Windows development, `npm run db:local` starts the bundled development PostgreSQL process.

## Architecture

Next.js App Router and server actions drive the web product. PostgreSQL/Prisma persists commerce records. `src/lib/commerce.ts` is the shared sales and order runtime; pricing, payment, fulfillment, API, and channel adapters are separated in `src/lib`.

## Security model

Creator actions require a session and ownership checks. Pricing and payment transitions are server-controlled. Financial records use decimal columns; accepted quotes and order financial snapshots have database immutability protections. API keys are hashed at rest and shown once. Telegram Mini App identity is verified server-side using Telegram init-data HMAC.

## Test & ship

Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`. Deploy with a managed PostgreSQL database and persistent job worker or authenticated cron endpoint. See [MOOVE_INTEGRATION.md](MOOVE_INTEGRATION.md) for settlement status.
