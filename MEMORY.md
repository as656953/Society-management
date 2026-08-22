# MEMORY.md — project state and decisions

Durable notes across sessions. Newest first. Keep this short and factual;
architectural detail belongs in [CLAUDE.md](CLAUDE.md).

---

## 2026-08-22 — Revival

The project had been dormant since roughly December 2024. The Supabase project
was un-paused and its MCP server (`society-management-supabase`) connected.

### Diagnosis

**The database was never broken.** All 15 tables were present and all data
intact:

| Table | Rows |
|---|---|
| users | 7 |
| towers | 5 |
| apartments | 19 |
| amenities | 4 |
| bookings | 2 |
| visitors | 4 |
| pre_approved_visitors | 2 |
| complaints / complaint_comments | 1 / 1 |
| notices | 1 |
| notification_preferences | 1 |
| cleanup_logs | 2 |
| vehicles / notifications | 0 / 0 |

The actual cause of "nothing works" was twofold:

1. `.env` still pointed `DATABASE_URL` at `localhost:5432/society_management`
   — the old local Postgres from development — instead of Supabase.
2. `node_modules` was not installed.

### Actions taken

- **Repointed `DATABASE_URL`** at the Supabase session pooler (port 5432, not
  the transaction pooler — see CLAUDE.md trap 2 reasoning). Regenerated
  `SESSION_SECRET`.
- **Reset two passwords.** Passwords are one-way scrypt hashes and were
  unrecoverable. Only `admin` (id 7) and `aditya` (id 8) were reset, using
  hashes generated to match `server/auth.ts:19-23` byte-for-byte and verified
  against the same comparison logic before applying. The other five accounts
  (`Sangeeta`, `bhavikadaga`, `Deeksha` local; `Mayank Sinha`,
  `Harsh Pandey` Google-only) were deliberately left untouched — they belong to
  other people.
- **Enabled RLS with no policies on all 15 tables.** They had been fully exposed
  to the `anon` role via PostgREST and GraphQL, including `users` with its
  password hashes. Verified safe first: `grep` confirmed zero `supabase-js`,
  `createClient`, or anon-key usage anywhere in the source, so the server's
  direct Postgres connection is unaffected.
- **Added project scaffolding** that had never existed: `CLAUDE.md`,
  `MEMORY.md`, `README.md`, `.env.example`, ESLint + Prettier.
  ESLint baseline at adoption: 167 problems (13 errors, 154 warnings).
- **Untracked `.env` from git.** It had been committed since the initial commit
  and the GitHub repo is public, so the old localhost DB password and the old
  `SESSION_SECRET` are in public history. Verified Supabase credentials were
  never committed. Decision: leave history alone, rotate secrets instead —
  the exposed DB password only worked against localhost. `SESSION_SECRET` still
  needs rotating in Vercel's env settings.

### Bugs found and fixed during verification

- **`server/db.ts` pool starvation.** `max: 1` was set for serverless, but
  `connect-pg-simple` checks out a client for the session store, leaving zero
  for query traffic. Every login failed with "timeout exceeded when trying to
  connect". Now `max: isServerless ? 1 : 10`. Added a pool `error` listener too;
  an idle-client error was otherwise an unhandled event.
- **`server/auth.ts` LocalStrategy crashed the process.** Passport does not
  catch rejections from an async verify callback, so the timeout above
  propagated out and killed the server rather than returning a 500. Now wrapped
  in try/catch calling `done(err)`.
- **`server/storage.ts` type error.** The session-store factories return `any`,
  so assigning to the `Store | null` property never narrowed. `npm run check`
  was failing; now clean.

### Decisions

- **Local dev first.** Vercel config left alone this pass; its known problems
  are documented rather than fixed.
- **No test suite yet.** The repo has zero tests. Establishing that the app
  actually runs came first; tests come next, written against behaviour we've
  confirmed rather than assumed.
- **Lint baseline reported, not auto-fixed.** Mass-formatting ~90 untested files
  immediately after a revival would make any regression untraceable.

### Accounts

`admin` / id 7 — `role='admin'`, `is_admin=true`, no apartment.
`aditya` / id 8 — `role='resident'`, apartment_id 19.
Credentials were delivered in chat, not stored here.

---

## Backlog

Roughly in priority order:

1. **Stop returning the password hash from the API.** `/api/login`, `/api/user`
   and `/api/users` all serialize the full user row. Strip `password` in a
   shared serializer. Most severe open issue.
2. Rotate the Supabase database password — it was shared in a chat transcript
   on 2026-08-22 — and rotate `SESSION_SECRET` in Vercel.
3. Test suite (Vitest) + CI. Start with `server/auth.ts` and `server/storage.ts`.
4. Fix the remaining auth bugs: `comparePasswords` length crash, ungated
   `/guard-dashboard`, the `SESSION_SECRET` fallback.
5. Unify `is_admin` and `role` into one authorization concept.
6. Reconcile the drizzle migration journal with the 0003-0019 hand-applied SQL.
7. Fix Vercel sessions (`memorystore` -> Postgres store) and redeploy.
8. Address `npm audit` (54 vulnerabilities, 2 critical).
9. Delete dead code: `server/api.ts`, `server/api-source/`, `api-dist/`,
   root `lib/utils.ts`.

## Reference docs

- [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) — 58KB phased feature plan from the
  original build. Aspirational; treat as intent, not current state.
- [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) — 25KB manual QA checklist.
  A good basis for the automated suite.
