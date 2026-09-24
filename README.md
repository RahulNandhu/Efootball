# eFootball League

A tournament tracker for eFootball leagues: admin-managed tournaments (single/double
round robin, optional groups with a random draw, and an optional knockout stage),
auto-scheduled fixtures, player-submitted results with admin approval, a live point
table (GF/GA/GD/W/D/L/Pts + last 5 results) with team photos, and head-to-head /
common-opponent comparisons between any two teams.

Stack: **Next.js (App Router) + Prisma + PostgreSQL (Supabase) + Auth.js (NextAuth v5)**,
deployed free on **Vercel**. Profile photos are stored in **Supabase Storage** and
compressed server-side to under 100KB on upload.

## Roles

- **Admin** — creates tournaments (picking from registered users) and chooses:
  - **Format**: single or double round robin.
  - **Groups**: none, or split the entrants into 2–8 groups via a random draw.
  - **Knockout stage**: none, a final only (top 2), or semi-finals (top 4, seeded
    1v4 / 2v3) with an optional 3rd-place play-off.
  - **Start date**: fixtures are auto-scheduled from there, one match per team per
    matchday (the classic circle-method round robin).

  Once the table is decided, the admin clicks through the knockout stage one round at
  a time ("Draw semi-finals" → both results approved → "Advance to final & 3rd place").
  Qualification for the knockout stage, with groups, ranks all group winners first
  (by points/GD/GF), then all runners-up, and so on.

  Admins can also enter/edit any match result directly (auto-approved), approve or
  reject results submitted by players, and promote/demote users to admin. A seeded
  default admin (`admin` / `Admin123`) always exists and can't be demoted or deleted.
- **User** — registers with a mandatory profile photo, gets added to tournaments by an
  admin, and can submit a result for their own matches. A user-submitted result goes
  to `PENDING_APPROVAL` until an admin approves it; the point table keeps showing the
  last **approved** score in the meantime. Draws aren't allowed in knockout matches —
  a decisive score is required. The home page shows each player's own upcoming
  fixtures and recent results, and any two teams can be compared head-to-head
  (including a shared-opponents breakdown) on the **Compare** page.

## Local development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in real values (see **Deploying for free**
   below for where to get them). For quick local testing without a real Supabase
   project yet, you can instead run Prisma's built-in local Postgres:
   ```bash
   npx prisma dev
   ```
   and point `DATABASE_URL` / `DIRECT_URL` in `.env` at the connection string it prints
   (add `&pgbouncer=true` to `DATABASE_URL`). Without `SUPABASE_URL` /
   `SUPABASE_SERVICE_ROLE_KEY` set, uploaded photos fall back to being saved under
   `public/uploads` for local testing only — production **requires** Supabase Storage
   since Vercel's filesystem isn't persistent.
3. Push the schema and seed the default admin:
   ```bash
   npm run db:push
   npm run db:seed
   ```
4. Start the app:
   ```bash
   npm run dev
   ```

## Deploying for free

**1. Database + photo storage — [Supabase](https://supabase.com) (free tier)**
- Create a project.
- Project Settings → Database → Connection string: copy the **Transaction pooler**
  URL (port 6543) into `DATABASE_URL` (append `?pgbouncer=true`), and the **direct**
  connection (port 5432) into `DIRECT_URL`.
- Project Settings → API: copy the Project URL into `SUPABASE_URL` and the
  `service_role` secret key into `SUPABASE_SERVICE_ROLE_KEY`.
- Storage → create a bucket named `avatars` (or whatever you set
  `SUPABASE_STORAGE_BUCKET` to) and make it **public** (so team photos can be shown
  without signed URLs).

**2. Hosting — [Vercel](https://vercel.com) (free tier)**
- Push this repo to GitHub, then "Import Project" in Vercel and select it.
- Add all the variables from `.env.example` as Vercel Environment Variables
  (`DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `SUPABASE_STORAGE_BUCKET`, `AUTH_SECRET`, and `NEXTAUTH_URL` set to your Vercel
  domain, e.g. `https://your-app.vercel.app`).
- Deploy. `npm run build` runs `prisma generate` automatically; run
  `npx prisma db push` once (locally, pointed at the production `DATABASE_URL`) to
  create the tables, then `npm run db:seed` once to create the default admin.

Both tiers comfortably cover a small tournament tracker at no cost.

## Notable implementation details

- `src/lib/standings.ts` computes the point table from approved match scores (scoped
  to a single group when one is given); a match awaiting a player-submitted correction
  keeps counting its last-approved score until an admin approves or rejects it.
  `getQualifiers()` ranks teams for knockout seeding.
- `src/lib/scheduling.ts` is the circle-method round-robin fixture generator (handles
  odd team counts with a bye) plus the random group draw; `src/app/api/tournaments`
  uses it to create every `Match` with a `scheduledDate` up front.
- `src/app/api/tournaments/[id]/advance` is the admin-only endpoint that generates the
  next knockout round (semis, then final + 3rd place) once the previous round's
  results are approved — it never overwrites an already-generated stage.
- `src/lib/headToHead.ts` computes direct head-to-head records and common-opponent
  breakdowns between any two teams, across all tournaments.
- `src/lib/image.ts` re-encodes every uploaded photo as JPEG, stepping down quality
  and then dimensions until it's under 100KB — enforced server-side regardless of
  what the client sends.
- `src/proxy.ts` (Next 16's replacement for `middleware.ts`) gates all routes behind
  authentication except `/login`, `/register`, and `/api/register`, and further gates
  `/admin/*` to the `ADMIN` role.
- The default admin is flagged `isDefaultAdmin` in the database; the role-change and
  (any future) delete endpoints must check and refuse that flag.
- Design tokens (colors, `.card`/`.btn`/`.badge`/`.table-clean` etc.) live in
  `src/app/globals.css` as CSS custom properties, with a dark-mode override block —
  reuse those classes rather than one-off Tailwind color utilities.
