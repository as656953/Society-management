# Society Management

A residential society management system — apartment directory, amenity booking,
visitor and gate management, complaints, notices, and admin reporting.

React + Vite frontend, Express + Passport backend, Drizzle ORM over Postgres.

## Features

**Residents** — browse the apartment directory, book amenities (gym, clubhouse,
guest house), pre-approve expected visitors, raise and track complaints, read
society notices, manage vehicles and notification preferences.

**Guards** — check visitors in and out, work the pre-approval queue, see who is
currently on the premises.

**Admins** — manage users, towers and apartments, approve bookings, triage all
complaints, publish notices, run reports, and manage data retention.

## Getting started

### Prerequisites

- Node 22 (`nvm use` picks it up from `.nvmrc`)
- A Postgres database — Supabase works well

### Setup

```bash
git clone <repo-url>
cd Society-management
npm install

cp .env.example .env
# then fill in DATABASE_URL and SESSION_SECRET
```

`.env.example` documents every variable, which are required, and which features
degrade if the optional ones are missing. The two you must set:

- **`DATABASE_URL`** — your Postgres connection string. On Supabase, take the
  **session pooler** string (port 5432) from Dashboard → Connect. Avoid the
  transaction pooler on 6543; the session store needs a persistent connection.
- **`SESSION_SECRET`** — generate one:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

### Run

```bash
npm run dev
```

Serves the API and the Vite dev client together on <http://localhost:3000>.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build (client + bundled server) |
| `npm start` | Run the production build |
| `npm run check` | TypeScript type check |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

> **Do not run `npm run db:push`.** The drizzle migration journal has diverged
> from the migrations actually applied to the database, so it may propose
> destructive changes. See [CLAUDE.md](CLAUDE.md) for details.

## Project structure

```
client/src/         React app
  pages/            17 route components
  components/ui/    shadcn/ui primitives
  hooks/            use-auth and friends
server/             Express API
  auth.ts           Passport strategies, scrypt hashing
  db.ts             Lazy pg pool + drizzle
  storage.ts        IStorage data-access layer
  routes/           Feature route modules
shared/schema.ts    Drizzle schema + zod validators (single source of truth)
api/index.ts        Vercel serverless entry
migrations/         SQL migrations
```

## Authentication

Session-based, via Passport. Local login authenticates on **username** (not
email) with scrypt-hashed passwords. Google OAuth is available when
`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are configured; without them the
button is simply absent and local login is unaffected.

Three roles — `admin`, `resident`, `guard` — control both navigation and API
access.

## Contributing

Read [CLAUDE.md](CLAUDE.md) first. It documents several non-obvious traps,
most importantly that **server-side imports must be relative and carry explicit
`.js` extensions** for Vercel's ESM resolution.

[MEMORY.md](MEMORY.md) tracks project state, past decisions, and the backlog.
