import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seedData } from "@/lib/seed-data";

// Creates the schema (idempotent) and seeds starter data.
// Safe to leave deployed: it refuses to re-seed once people exist.
export async function POST() {
  const sql = getDb();

  // --- Schema (mirrors seed.sql) ---
  await sql`
    CREATE TABLE IF NOT EXISTS people (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#d07c28',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_archived BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      notes TEXT,
      due_date DATE,
      recurrence JSONB,
      assignee_id BIGINT REFERENCES people(id) ON DELETE SET NULL,
      is_done BOOLEAN NOT NULL DEFAULT false,
      completed_at TIMESTAMPTZ,
      completed_by BIGINT REFERENCES people(id) ON DELETE SET NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS activity (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      task_id BIGINT REFERENCES tasks(id) ON DELETE SET NULL,
      person_id BIGINT REFERENCES people(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      detail TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON tasks(project_id)`;
  await sql`CREATE INDEX IF NOT EXISTS activity_created_at_idx ON activity(created_at DESC)`;

  // --- Refuse to re-seed if data already exists ---
  const countResult = await sql`SELECT COUNT(*) as count FROM people`;
  if (countResult[0]?.count > 0) {
    return NextResponse.json(
      { error: "Database already seeded", schemaReady: true },
      { status: 400 }
    );
  }

  // --- People ---
  for (let i = 0; i < seedData.people.length; i++) {
    const p = seedData.people[i];
    await sql`
      INSERT INTO people (name, color, sort_order)
      VALUES (${p.name}, ${p.color}, ${i})
    `;
  }

  // --- Projects + their tasks ---
  for (let p = 0; p < seedData.projects.length; p++) {
    const project = seedData.projects[p];
    const projectRows = await sql`
      INSERT INTO projects (name, description, sort_order)
      VALUES (${project.name}, ${project.description ?? null}, ${p})
      RETURNING id
    `;
    const projectId = projectRows[0]?.id;
    if (!projectId) {
      return NextResponse.json(
        { error: `Failed to insert project: ${project.name}` },
        { status: 500 }
      );
    }

    for (let t = 0; t < project.tasks.length; t++) {
      const task = project.tasks[t];
      await sql`
        INSERT INTO tasks (project_id, title, sort_order)
        VALUES (${projectId}, ${task.title}, ${t})
      `;
    }
  }

  return NextResponse.json({ success: true, message: "Database seeded" });
}
