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

## 2026-08-22 (later) — Review pass and Phase 0/1 execution

Six review voices (CEO, engineering, design, DX, code review, plus an adversarial
Codex pass) ran against a professionalization plan. They corrected three claims made
in this file and invalidated the plan's premise. Full plan and review report:
`~/.claude/plans/hey-claude-this-is-curried-hopper.md`.

**Corrections to the entry above.** The "low-risk, localhost only" assessment of the
leaked credentials was **wrong** — only `HEAD:.env` had been checked, not history.
The initial commit held a live *remote* Render Postgres credential, and both
`db/*.sql` dumps held 2 real password hashes and 101 real phone numbers, all public.

**Done:**
- Purged `.env` and `db/` from all 72 commits with `git-filter-repo` and force-pushed.
  Verified zero occurrences of the credential or the dumps in published history.
  Mirror backup at `~/Desktop/Personal/society-management-backup-*.git`.
- Pushed the previously-unpushed docs and tooling. **The public repo had no README
  until now** — every deliverable of the prior session existed only on disk.
- Sanitized CLAUDE.md: it had been publishing the Supabase project ref, the RLS
  posture, and every open vulnerability with line numbers. Fixed its four factual
  errors too.
- **Recovered the orphaned design system.** `client/tailwind.config.js` held the real
  typography (Plus Jakarta Sans / Space Grotesk / Outfit) and was never loaded, so
  the app rendered in the system font and `font-display`/`font-heading` emitted
  nothing in 21 places. Merged into the root config, fonts now confirmed rendering.
- Removed the `.container` max-width override, added `<title>`, removed
  `maximum-scale=1`, deduped the chart tokens, converted plugins to ESM imports.
- Fixed `deserializeUser` crashing the process — **caught live**, it killed the dev
  server mid-verification.

Lint errors 13 → 8. `tsc` clean. Data intact throughout.

**Still open:** rotating the Render, Supabase, and Vercel credentials — dashboard
work. Rotation is what actually neutralizes the exposure; the purge only stops it
spreading.

## 2026-08-23 — Phase 1 continued

- Removed all Replit scaffolding and dead weight; added LICENSE. Deleting the
  shadcn-theme-json plugin also removed `theme.json`, resolving the primary-colour
  conflict (both values were near-black, so no visible change; verified by
  screenshot).
- Reconciled the login page with the app's theme and associated its form labels.
- Fixed the dashboard hierarchy and the false-empty bookings card.
- Collapsed four page-heading treatments into one canonical style across twelve
  pages, and added `client/src/components/page-header.tsx`.
- README now leads with screenshots and carries an Engineering notes section.

### Two more crashes found by using the app

Both were the same class as the `deserializeUser` bug and neither was in the plan:

- **`GET /api/amenities` (routes.ts:262) has no try/catch.** A rejected query became
  an unhandled rejection and Node terminated the process. Added process-level
  `unhandledRejection` / `uncaughtException` handlers as a **safety net only** —
  the real fix is wrapping the handlers, see backlog.
- **connect-pg-simple shared the application pool.** Every request spent an app
  connection on the session lookup before its handler ran, so any concurrency
  starved the pool and produced "timeout exceeded when trying to connect" on
  requests that had worked moments earlier. The session store now has its own
  pool (max 3). Verified with 60 concurrent authenticated requests, all 200.

**Correction:** an earlier note here attributed those pool timeouts to connections
leaked across dev-server restarts, based on idle entries in `pg_stat_activity`.
That was wrong — those entries are the Supabase pooler's own persistent backends
and look identical either way. The graceful-shutdown handler added for it is still
correct practice, but it was not the cause.

## Backlog

Roughly in priority order:

1. **Stop returning the password hash from the API.** `/api/login`, `/api/user`
   and `/api/users` all serialize the full user row. Strip `password` in a
   shared serializer. Most severe open issue.
2. Rotate the Supabase database password — it was shared in a chat transcript
   on 2026-08-22 — and rotate `SESSION_SECRET` in Vercel.
3. **Wrap the async route handlers.** The process-level rejection handler is a
   net, not a fix; a handler that throws still returns nothing useful to the user.
4. Test suite (Vitest) + CI. Start with `server/auth.ts` and `server/storage.ts`.
5. Fix the remaining auth bugs: `comparePasswords` length crash, ungated
   `/guard-dashboard`, the `SESSION_SECRET` fallback.
6. Unify `is_admin` and `role` into one authorization concept.
7. Reconcile the drizzle migration journal with the 0003-0019 hand-applied SQL.
8. Fix Vercel sessions (`memorystore` -> Postgres store) and redeploy.
9. Address `npm audit` (54 vulnerabilities, 2 critical).
10. Delete dead code: `server/api.ts`, `server/api-source/`, `api-dist/`,
   root `lib/utils.ts`.

## Reference docs

- [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) — 58KB phased feature plan from the
  original build. Aspirational; treat as intent, not current state.
- [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) — 25KB manual QA checklist.
  A good basis for the automated suite.
