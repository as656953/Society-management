# CLAUDE.md — Society Management

Working context for AI sessions on this repo. Read this before touching code.

## What this is

A residential society management system: apartment directory, amenity booking,
visitor/gate management, complaints, notices, and admin reporting. Originally a
college project; revived 2026-08-22 after a long dormancy.

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 18, Vite 5, TypeScript 5.6 (strict) |
| Routing | `wouter` (not react-router) |
| Server state | TanStack Query v5 |
| UI | Radix UI + shadcn/ui (47 vendored primitives in `client/src/components/ui/`), Tailwind 3.4 |
| Forms | react-hook-form + zod |
| Backend | Express 4, Passport (local + Google OAuth) |
| ORM | Drizzle 0.41 over `pg` (node-postgres) |
| Database | Postgres (Supabase). Project ref lives in `.env`, never in this file. |
| Deploy | Vercel serverless (`api/index.ts`); Replit config also present |

Node 22 (`.nvmrc`, `engines`). `"type": "module"` — the whole repo is ESM.

## Layout

```
client/src/     React app — pages/, components/, hooks/, lib/
server/         Express — auth.ts, db.ts, storage.ts, routes.ts, routes/, middleware/
shared/schema.ts  Single Drizzle schema + all zod validators. One source of truth.
api/index.ts    Vercel serverless entry (separate Express bootstrap from server/index.ts)
migrations/     SQL migrations (see warning below)
```

## Commands

```bash
npm run dev      # tsx server/index.ts — Express + Vite middleware, port 3000
npm run build    # vite build && esbuild the server
npm run check    # tsc --noEmit. The main quality gate.
npm run lint     # eslint
npm run format   # prettier --write
npm run db:push  # drizzle-kit push — DO NOT RUN, see below
```

## Traps — read these before editing

### 1. Server code must use relative imports with explicit `.js` extensions

`@/*` -> `client/src/*` and `@shared/*` -> `shared/*` work **in client code only**.
Server and `api/` code must write `import { x } from "../shared/schema.js"` —
relative, with the `.js` extension, even though the file is `.ts`. Vercel's ESM
resolution breaks otherwise. This was fixed across two commits (`773be2c`,
`e720a63`); don't regress it.

### 2. Use `db:migrate`, not `db:push`

`npm run db:migrate` applies the journaled migrations. `db:push` diffs the schema
and applies the result directly; it is kept only for reference.

This used to be an outright prohibition. The live database carried 26 indexes
that were created by hand and declared in neither `shared/schema.ts` nor any
journaled migration, so `push` would have proposed dropping all of them. Those
indexes are now declared, `drizzle-kit generate` reports an empty diff, and the
17 unjournaled `0003`-`0019` files have moved to `migrations/legacy/` as history.

Two things to know before touching migrations:

- `0000_nice_red_skull.sql` is a consolidated snapshot using plain `CREATE TABLE`,
  not `IF NOT EXISTS`. It is safe on an empty database and will fail on a
  populated one. The live database is already baselined in
  `drizzle.__drizzle_migrations` as being at `0001`, so `db:migrate` is a no-op
  there rather than an error.
- The one foreign key (`notices.created_by`) is written as `"public"."users"`, so
  the migrations only reproduce correctly into the `public` schema.

### 3. Two competing notions of "admin"

`users.is_admin` (legacy boolean) and `users.role` (`admin` | `resident` |
`guard`) both exist. The client (`protected-route.tsx`, `navigation.tsx`) and
`server/middleware/auth.ts` check **only the boolean**, while the route-local
guards in `server/routes/visitors.ts` and `server/routes/complaints.ts` check
`role === "admin" || isAdmin`. When creating an admin, set **both**.

### 4. Passwords are scrypt, not bcrypt

`server/auth.ts:19-23` — `scrypt(password, salt, 64)` stored as `hash.salt`
(161 chars: 128 hex + `.` + 32 hex salt). Any code that writes a password must
match this format exactly or login silently fails. The helper is duplicated in
`server/routes/profile.ts:10`.

## Auth model

Session-based Passport, sessions in a cookie named `ssync.sid` (24h).

- Local strategy authenticates on **`username`**, not email.
- Google OAuth registers only if `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` are
  set; Google users have `password IS NULL`.
- Session store: `connect-pg-simple` (Postgres) in dev, `memorystore` in
  production — see known issues.
- Guards: `isAuthenticated`, `isAdmin` in `server/middleware/auth.ts`;
  `isResident` is NOT in that file — it is defined inline twice, in
  `server/routes/complaints.ts` and `server/routes/visitors.ts`, and additionally
  requires the user to have an `apartmentId`. Consolidating it is on the backlog.

## Roles

| Role | Access |
|---|---|
| `admin` | Everything: users, properties, amenities, all bookings/complaints, reports, storage management |
| `resident` | Directory, amenities, own bookings, own complaints, own pre-approved visitors |
| `guard` | Visitor check-in/out, pre-approval queue, guard dashboard |

## Database

14 tables in `shared/schema.ts`, which is authoritative, plus a `session` table
`connect-pg-simple` creates on its own. Note: **almost no foreign keys**
— only `notices.created_by -> users.id`. Everything else is a bare `integer`
joined manually in `server/storage.ts`. Don't assume referential integrity.

Row Level Security is enabled on every public table with no policies attached.
That is deliberate: the server reaches Postgres over a direct connection and does
not use `supabase-js` or the anon key anywhere, so RLS exists purely to keep the
auto-generated REST and GraphQL surface closed. **If you ever introduce
`supabase-js`, write policies first** or every query will fail closed.

Indexes: the live database carries indexes that are declared in neither
`shared/schema.ts` nor any migration. Until that is reconciled, see trap 2.

## Known issues (not yet fixed)

- **The API returns the scrypt password hash to the client.** `POST /api/login`
  and `GET /api/user` serialize the whole `users` row, `password` included, so
  every hash goes over the wire and into browser memory on each auth check.
  `GET /api/users` (admin) leaks all of them at once. Fix by stripping
  `password` in a serializer before every user-shaped response. **Highest
  priority item in the backlog.**
- `comparePasswords` (`server/auth.ts:25-31`) — `timingSafeEqual` throws on a
  malformed stored hash instead of returning `false`.
- React console warnings during normal use: "Cannot update a component while
  rendering a different component" (a `setState` during render) and "Function
  components cannot be given refs". Cosmetic today, but both signal real
  lifecycle bugs.
- `/guard-dashboard` gates in-page, but its data queries fire before the gate runs,
  so a non-guard's browser still issues those requests (the server rejects them).
  `ProtectedRoute` has no concept of roles at all, only an `isAdminOnly` flag.
- `SESSION_SECRET` falls back to the literal `"your-secret-key"` in
  `server/index.ts:20` and `api/index.ts:29`.
- Vercel sessions use `memorystore` (`api/index.ts:26-43`), so logins drop
  between serverless instances. Cron jobs are also skipped when `VERCEL=1`.
- Migration journal diverged from applied migrations (trap 2).
- Dead code: `server/api.ts`, `server/api-source/handler.ts`, `api-dist/`,
  root `lib/utils.ts`.
- `npm audit` reports 54 vulnerabilities (2 critical) in the dependency tree.
- No test suite and no CI.

## Conventions

- Validate at the boundary with the zod schemas in `shared/schema.ts`. Don't
  hand-roll validation in route handlers.
- Data access goes through the `IStorage` interface in `server/storage.ts`, not
  raw drizzle calls in routes.
- Prefer many small files. See the user-level rules in `~/.claude/rules/`.
