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
- `src/app/page.tsx` — `force-dynamic` server fetch of people/projects/tasks/activity, normalized, passed to `<TaskApp>`. **Loads ALL tasks** (no SQL age filter); the "hide completed after 1 day" rule is client-side.
- `src/components/TaskApp.tsx` — top-level client orchestrator: all state + fetch handlers, **optimistic updates** everywhere (mutate local state first, fire the request, reconcile/revert). Renders the project view or `PeopleView`, the `Recently done` aside, and the `FloatingAdd` button.
- API route handlers under `src/app/api/*/route.ts` (+ `[id]/route.ts`). Mutations take `actorId` in the body to stamp `completed_by` / `activity.person_id`.
- `src/lib/util.ts` — `normalize*` helpers (BIGINT ids → numbers; `due_date` → `YYYY-MM-DD`) and `compareByDue` (the shared task sort).

### Data conventions / footguns
- Postgres `BIGINT` ids come back as **strings** → always `normalize*` / `Number(...)` before comparing.
- `completed_at` may arrive as a JS `Date` (server) or string (optimistic) → coerce with `String(...)` before `.localeCompare`.
- **Every task must have a project.** Project is required when adding (no "Unfiled" option in the picker); legacy `project_id IS NULL` tasks still render under an "Unfiled" label as a graceful fallback.
- **Tasks have multiple assignees** (`assignee_ids: number[]`, Postgres `BIGINT[]`). Postgres returns `int8[]` as an **array of strings** (both drivers) → `normalizeTask` runs it through `numArray` (`Array.isArray ? map(Number) : []`). Bind a JS `number[]` directly as one param (`${ids}`; `[]` → `{}`); never interpolate into SQL text. A multi-assignee task appears in **every** assignee's section in the by-person view (predicate `t.assignee_ids.includes(person.id)`; Unassigned = `length === 0`).

### Schema & migrations
- Schema lives in `src/app/api/seed/route.ts` as `CREATE TABLE IF NOT EXISTS` **plus idempotent `ALTER TABLE … ADD COLUMN IF NOT EXISTS`** for later columns (`people.avatar`, `projects.is_ongoing`, `tasks.assignee_ids`). The ALTERs run *before* the re-seed guard, so **hitting `POST /api/seed` migrates an already-seeded DB** (it returns "already seeded" — expected; the columns still get added).
- `tasks.assignee_ids BIGINT[]` was added alongside an idempotent **backfill** from the old single `assignee_id` (kept for rollback): `UPDATE … SET assignee_ids = ARRAY[assignee_id] WHERE assignee_id IS NOT NULL AND (assignee_ids IS NULL OR assignee_ids = '{}')`. **After deploying, hit `POST /api/seed` once** or existing assignments read as empty until the backfill runs. Person-delete uses `array_remove(assignee_ids, id)`.
- Reorder endpoints (`projects/reorder`, `tasks/reorder`) take `{ ids }`. Tasks use a **slot-permute**: reassign the `sort_order` values the dragged set already occupies (not `0..n`), so reordering a cross-project list in the by-person view doesn't scramble other projects.

## Key product behaviors
- **Identity**: localStorage `home-tasks:currentPersonId`. First visit shows a 2-step `NamePrompt` (pick a name → optionally add with color/emoji). Avatars are bare emoji or a colored initial (`Avatar.tsx`); `PERSON_COLORS` is a pastel set.
- **Sort & filter** (labeled toggles, "SORT BY" / "FILTER BY"): `home-tasks:view` sorts "By project" ⇄ "By person" (`PeopleView` groups open tasks per person + an Unassigned bucket; rows carry a project tag). `home-tasks:filter` toggles "All tasks" ⇄ "My tasks" (tasks where `assignee_ids.includes(currentPersonId)` — in project view also drops projects you have no tasks in; in person view shows only your own section).
- **Projects** are *finite* (progress bar over all tasks) or *ongoing* (`is_ongoing`, no bar). Completed tasks hide 1 day after completion (`STALE_MS` in `ProjectSection.tsx`) with a per-section "Show completed" toggle.
- **Live sync**: `TaskApp` polls all data every ~8s while the tab is visible (+ refresh on focus/visibility), so two devices stay in sync. Polling is **paused while an input is focused or a confirm dialog is open** so it never clobbers in-progress edits.
- **Task edit mode (Things-style)**: tapping a collapsed row (anywhere but the checkbox) expands it into an inline edit card — full wrapping title, a notes field, and project/date/person pickers, plus a drag grip (left, where the checkbox was) and a trash. A *second* tap on any element opens its own editor/picker. Exactly one row is open at a time via a lifted `expandedTaskId` in `TaskApp` (threaded explicitly through `ProjectSection`/`PeopleView`/`SortableTaskList` → `TaskRow`); tapping outside collapses it. Collapsed rows show title + **read-only** due-date chip + assignee avatar(s). The card is white (`bg-paper` + shadow) on mobile for contrast, tinted/transparent on desktop where it sits on a white grouping card.
- **Assignee avatars** (`AvatarStack.tsx`): a **single** assignee renders as a plain `Avatar` (bare emoji / colored initial, no border). **Multiple** overlap with a paper-colored separating ring, emoji framed on a white circle with a thin outline, and a `+N` chip past 3. Used in collapsed rows, the expanded picker trigger, and both add forms.
- **Reorder**: the grip in an open task's edit card is the dnd-kit drag activator (`SortableTaskList.tsx`), so only an open task is draggable; completed/Unfiled rows (plain `TaskRow`, no dnd context) get no grip. Use `CSS.Translate` (NOT `CSS.Transform`) for the drag style — `Transform` bakes in scaleX/Y for variable-height lists and squishes the tall card. Tap a **project title** → up/down arrows to move it one slot. Date order always wins for tasks (`compareByDue`); manual order only sticks among same-date/undated peers.
- **Adding**: inline "+ Add task" per section (project pre-filled) + a `FloatingAdd` button (circle on mobile with a centered `PlusIcon`, "+ Add task" pill on desktop, right-aligned to page width) opening a panel with a required project picker. The panel is **portaled to `document.body`** with the blur on a *separate* layer (an element that's both `position:fixed` and `backdrop-filter` is mis-anchored to the document by iOS Safari); the dialog itself is the scroll container anchored at top. While open, FloatingAdd **locks body scroll** (`body { position: fixed; top: -scrollY }`, restored on close) — on iOS, focusing the title input otherwise makes Safari scroll the document and drag the fixed panel off-screen. (Note: do NOT use `viewport.interactiveWidget = "resizes-content"` — it left the iOS layout viewport stuck short after keyboard dismiss, floating the `fixed` FAB to mid-screen.) Deletes are optimistic — the `ConfirmDialog` closes immediately, the network call runs in the background.
- **Editing/pickers**: inline tap-to-edit (`EditableText`, with a `multiline` textarea mode for notes — Enter inserts a newline and it can be cleared to empty) and the date/assignee/project popovers all use `useOutsideDismiss` (`src/lib/useOutsideDismiss.ts`) — an outside tap dismisses *and swallows that click* so it doesn't activate whatever's under it. A `[data-edit-group]` ancestor marks a field's sibling controls as "inside"; a `[data-overlay]` ancestor (add panel / confirm dialog) is also "inside" so a modal's first button click isn't swallowed. Changing a task's project (`onChangeProject` → `changeTaskProject` in `TaskApp`) **re-buckets** it between `projects[].tasks`/`looseTasks` in local state, not just a field patch.
- **Popovers** (project/date/person) share `Popover` + `PopoverGroup` (`Popover.tsx`): the panel **portals to `document.body`** (escapes scroll/overflow clipping like the Add Task modal) and positions `fixed` from the trigger rect — **centered horizontally on mobile** (`< 640px`), anchored to the trigger's left on desktop, clamped on-screen and flipped above if no room. `PopoverGroup` enforces **one open at a time**. The **assignee picker is multi-select**: tapping a person toggles them, the popover **stays open**, "Assign to me"/"Unassign me" toggles self, "Clear all" empties; the handler is `onToggleAssignee`/`onClearAssignees` (in `TaskApp`, `toggleAssignee` computes the next array and routes through `patchTask`).

## Deploy
- Vercel project **home-projects** → domain **todo.presleythompson.com**. Push to `main` auto-deploys (the user handles git/commits unless asked).
- **After deploying a schema change, run `POST https://todo.presleythompson.com/api/seed` once** to apply the idempotent ALTERs to the production Neon DB.
- There is no Neon MCP connected; inspect prod data via the deployed API routes (they return real SQL errors on failure — wrapped in try/catch) or ask for the connection string.
