# Autooksjonid — Car Insurance Auction Platform

A full-featured car auction website in Estonian, modeled after romu.ee/oksjonid. Built for an insurance/salvage broker running auctions of accident-damaged vehicles sold by insurance companies.

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 + shadcn-style components |
| Database | PostgreSQL (Neon) via Prisma ORM |
| Auth | Auth.js v5 (credentials) with email verification |
| Email | Resend (verification, password reset, outbid, auction-won, welcome) |
| Uploads | Uploadthing (multi-image drag & drop, max 20 per auction) |
| Real-time | Pusher (live bids, countdowns, status changes) |
| i18n | next-intl — ET (default, no prefix) / EN / RU / LV / LT |
| Deployment | Vercel (cron for auction status transitions) |

## Features

- **Public site** — homepage with hero + categories + live auctions; filterable/sortable listing pages (`/autooksjonid`, `/varuosad`, `/muud`); auction detail page with Swiper gallery + lightbox, romu.ee-style specifications table, real-time bid panel with countdown (red under 1 h) and bid history (initials only).
- **Bidding** — verified users only, configurable minimum increment (default 50 €), row-level locking against concurrent bids, Pusher events (`bid-placed`, `auction-ended`, `phone-auction-started`), outbid email notifications. Estonian currency/date formatting throughout ("1 650,00 €").
- **Phone auction module** (`/admin/telefonoksjon`) — after the online auction ends, auctions with the phone-auction flag transition to `PHONE_AUCTION`; admins see the ranked call list of top online bidders, log phone bids (Contacted/Confirmed/Declined/No answer) with a full audit trail, and close the auction with the winning bid.
- **Admin panel** (`/admin`) — dashboard stats, WordPress-style auction editor (per-language title/description tabs with TipTap, image upload + reorder + primary, custom key-value attributes, reserve price hidden from public), user management (roles, manual verify, disable), site settings, and a translation manager for both UI strings and content pages (Reeglid/KKK/Privaatsuspoliitika/Teenused).
- **Auth** — registration with email confirmation (unverified users cannot bid), login with remember-me, password reset, account dashboard with bid history.

## Getting started

```bash
npm install
cp .env.example .env        # fill in values (see below)
npx prisma migrate deploy    # or: npm run db:push
npm run db:seed              # admin user + sample data
npm run dev
```

The seed creates the admin account **gertmaeste@gmail.com / KAStead22!** (change it after first login in `/admin/seaded`), default settings, sample content pages, and 3 active sample auctions.

### Environment variables

See `.env.example`. Minimum for local development: `DATABASE_URL` and `AUTH_SECRET` (`npx auth secret`). Resend, Uploadthing, and Pusher are optional — the app degrades gracefully (emails are logged to console, real-time falls back to refresh, image URLs can be added manually in the admin form).

## Deployment (Vercel)

1. Create a Neon PostgreSQL database and set `DATABASE_URL` (pooled connection string).
2. Set all environment variables in the Vercel project settings.
3. `vercel.json` registers a cron (`/api/cron/transition`, every 10 minutes) that auto-transitions expired auctions: `ACTIVE → PHONE_AUCTION` (when enabled) or `ACTIVE → ENDED`, and `PHONE_AUCTION → ENDED`. Set `CRON_SECRET` to protect the endpoint. Transitions also run opportunistically on page loads, so nothing breaks without the cron.
4. Run migrations + seed once: `npx prisma migrate deploy && npm run db:seed`.

## Project structure

```
app/
  (site)/[locale]/   Public pages (ET default, /en /ru /lv /lt prefixes)
  (admin)/admin/     Admin panel (separate root layout, sidebar nav)
  api/               Auth, bids, auctions, contact, uploadthing, pusher, cron
components/          ui/ (primitives), auction/, admin/, layout/
lib/                 db, auth, email, pusher, settings, auctions, i18n helpers
messages/            et/en/ru/lv/lt UI translations (DB overrides via admin)
prisma/              schema, initial migration, seed
```
