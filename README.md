# Home Tasks

A lightweight, no-login household task tracker — projects with tasks (dated,
undated, or daily/weekly recurring), self-assignment, and a "who's using this"
person toggle that attributes every action. Sibling app to `house-cleaning-tracker`,
built on the same stack (Next.js 15 / React 19 / Tailwind v4 / raw SQL on Neon).

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Postgres** via `@neondatabase/serverless` (production) with a `pg` fallback
  for local Postgres — see `src/lib/db.ts`.

## Data model

`people`, `projects`, `tasks`, `activity`. Full schema in [`seed.sql`](./seed.sql).
`POST /api/seed` creates the tables (idempotent) and inserts starter data.

## Identity

No auth. The current person is stored in the browser under
`localStorage["home-tasks:currentPersonId"]` and sent as `actorId` on mutations so
completions, assignments, and the activity feed are attributed.

## Local development

```bash
npm install
cp .env.local.example .env.local   # set DATABASE_URL to a local or Neon Postgres
npm run dev
```

Then open http://localhost:3000 — on a fresh database you'll get a one-click
**"Set up the database"** button (calls `POST /api/seed`).

- **Local Postgres:** `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_tasks`
  (the `localhost`/`127.0.0.1` host switches `db.ts` to the `pg` driver).
- **Neon:** paste the Neon connection string; the serverless driver is used automatically.

## Deployment (Vercel)

This is its own repo / Vercel project / Neon database — fully independent of the
cleaning tracker.

1. Push to a new GitHub repo.
2. Create a new Neon database; copy its connection string.
3. Import the repo into a new Vercel project; set `DATABASE_URL`; deploy.
4. Add your subdomain (e.g. `tasks.example.com`) to the Vercel project and create
   the DNS record.
5. Visit the deployed URL once and click **Set up the database**.

## API

| Route | Methods | Purpose |
|---|---|---|
| `/api/seed` | POST | Create schema + seed starter data |
| `/api/people` | GET, POST | List / add people |
| `/api/people/[id]` | PATCH, DELETE | Rename·recolor / remove a person |
| `/api/projects` | GET, POST | List / add projects |
| `/api/projects/[id]` | PATCH, DELETE | Rename·archive / delete a project |
| `/api/tasks` | GET, POST | List / add tasks |
| `/api/tasks/[id]` | PATCH, DELETE | Edit (title/due/recurrence/assignee) / delete |
| `/api/tasks/[id]/complete` | POST, DELETE | Check off (handles recurrence) / reopen |
| `/api/activity` | GET | Recent who-did-what feed (`?limit=`) |
