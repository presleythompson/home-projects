# home-tasks

A lightweight shared household task tracker (Presley + parents, occasionally grandkids). Projects contain tasks; tasks have optional due dates and an assignee. No auth — a no-login "who's using this" identity toggle attributes actions. Sibling app to `house-cleaning-tracker` (separate repo/DB/Vercel project; shares patterns, not data).

## Stack
- Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 (`@theme` tokens in `src/app/globals.css`)
- Raw SQL via `getDb()` (`src/lib/db.ts`): `@neondatabase/serverless` in prod, `pg` locally. Selection is by host — a `localhost`/`127.0.0.1` `DATABASE_URL` uses `pg`, anything else uses Neon.
- No ORM, no tests. Verify with `npx tsc --noEmit` + the live preview.

## Run / verify
- `npm run dev` → http://localhost:3100. The Claude_Preview MCP is the way to drive/inspect it (`preview_start name "home-tasks"`, `preview_screenshot`, `preview_eval`).
- `.env.local` → `postgresql://presleythompson@127.0.0.1:5432/home_tasks` (local Postgres, `brew services postgresql@17`).
- Type-check: `npx tsc --noEmit`. There is no test suite.

### Dev-server gotchas (seen repeatedly)
- After several edits, Next HMR can go **stale**: state/localStorage update but the UI doesn't (e.g. a toggle that won't switch). Fix: stop + start the dev server.
- The SWC error buffer **retains stale compile errors** across reloads — errors from the split-second between two paired edits persist. If `tsc` is clean and the page renders (no Next error overlay), they're stale; a restart clears them.
- `curl localhost:3100` from the shell can hang (IPv4/IPv6); use `preview_eval`'s `fetch` instead, which uses the working path.

## Architecture
- `src/app/page.tsx` — `force-dynamic` server fetch of people/projects/tasks/activity, normalized, passed to `<TaskApp>`. **Loads ALL tasks** (no SQL age filter); the "hide completed after 2 days" rule is client-side.
- `src/components/TaskApp.tsx` — top-level client orchestrator: all state + fetch handlers, **optimistic updates** everywhere (mutate local state first, fire the request, reconcile/revert). Renders the project view or `PeopleView`, the `Recently done` aside, and the `FloatingAdd` button.
- API route handlers under `src/app/api/*/route.ts` (+ `[id]/route.ts`). Mutations take `actorId` in the body to stamp `completed_by` / `activity.person_id`.
- `src/lib/util.ts` — `normalize*` helpers (BIGINT ids → numbers; `due_date` → `YYYY-MM-DD`) and `compareByDue` (the shared task sort).

### Data conventions / footguns
- Postgres `BIGINT` ids come back as **strings** → always `normalize*` / `Number(...)` before comparing.
- `completed_at` may arrive as a JS `Date` (server) or string (optimistic) → coerce with `String(...)` before `.localeCompare`.
- **Every task must have a project.** Project is required when adding (no "Unfiled" option in the picker); legacy `project_id IS NULL` tasks still render under an "Unfiled" label as a graceful fallback.

### Schema & migrations
- Schema lives in `src/app/api/seed/route.ts` as `CREATE TABLE IF NOT EXISTS` **plus idempotent `ALTER TABLE … ADD COLUMN IF NOT EXISTS`** for later columns (`people.avatar`, `projects.is_ongoing`). The ALTERs run *before* the re-seed guard, so **hitting `POST /api/seed` migrates an already-seeded DB** (it returns "already seeded" — expected; the columns still get added).
- Reorder endpoints (`projects/reorder`, `tasks/reorder`) take `{ ids }`. Tasks use a **slot-permute**: reassign the `sort_order` values the dragged set already occupies (not `0..n`), so reordering a cross-project list in the by-person view doesn't scramble other projects.

## Key product behaviors
- **Identity**: localStorage `home-tasks:currentPersonId`. First visit shows a 2-step `NamePrompt` (pick a name → optionally add with color/emoji). Avatars are bare emoji or a colored initial (`Avatar.tsx`); `PERSON_COLORS` is a pastel set.
- **Views**: `home-tasks:view` toggles "By project" ⇄ "By person" (`PeopleView` groups open tasks per person + an Unassigned bucket; rows carry a project tag).
- **Projects** are *finite* (progress bar over all tasks) or *ongoing* (`is_ongoing`, no bar). Completed tasks hide 2 days after completion with a per-section "Show completed" toggle.
- **Live sync**: `TaskApp` polls all data every ~8s while the tab is visible (+ refresh on focus/visibility), so two devices stay in sync. Polling is **paused while an input is focused or a confirm dialog is open** so it never clobbers in-progress edits.
- **Reorder (no drag handles cluttering the UI)**: tap a **task title** → its checkbox becomes a grip you drag (a row-level `active` flag, decoupled from the title's edit state, keeps the grip alive through the focus blur a drag causes). Tap a **project title** → up/down arrows appear to move it one slot. Date order always wins for tasks (`compareByDue`); manual order only sticks among same-date/undated peers.
- **Adding**: inline "+ Add task" per section (project pre-filled) + a `FloatingAdd` button (circle on mobile, "+ Add task" pill on desktop, right-aligned to the page width) that opens a panel with a required project picker. Deletes are optimistic — the `ConfirmDialog` closes immediately, the network call runs in the background.
- **Editing/pickers**: inline tap-to-edit (`EditableText`) and the date/assignee/project popovers all use `useOutsideDismiss` (`src/lib/useOutsideDismiss.ts`) — an outside tap dismisses *and swallows that click* so it doesn't activate whatever's under it. A `[data-edit-group]` ancestor marks a field's sibling controls as "inside".

## Deploy
- Vercel project **home-projects** → domain **todo.presleythompson.com**. Push to `main` auto-deploys (the user handles git/commits unless asked).
- **After deploying a schema change, run `POST https://todo.presleythompson.com/api/seed` once** to apply the idempotent ALTERs to the production Neon DB.
- There is no Neon MCP connected; inspect prod data via the deployed API routes (they return real SQL errors on failure — wrapped in try/catch) or ask for the connection string.
