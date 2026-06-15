import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Edit a task's fields: title, notes, due_date, recurrence, assignee_id, project_id.
// Any subset may be sent. Assigning (assignee_id present) also logs activity.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sql = getDb();
  const { id } = await params;
  const body = await req.json();
  const { title, notes, due_date, recurrence, assignee_id, project_id, actorId } = body;

  if (title !== undefined) {
    await sql`UPDATE tasks SET title = ${title} WHERE id = ${id}`;
  }
  if (notes !== undefined) {
    await sql`UPDATE tasks SET notes = ${notes} WHERE id = ${id}`;
  }
  if (due_date !== undefined) {
    await sql`UPDATE tasks SET due_date = ${due_date ?? null} WHERE id = ${id}`;
  }
  if (recurrence !== undefined) {
    await sql`UPDATE tasks SET recurrence = ${recurrence ?? null} WHERE id = ${id}`;
  }
  if (project_id !== undefined) {
    await sql`UPDATE tasks SET project_id = ${project_id ?? null} WHERE id = ${id}`;
  }
  if (assignee_id !== undefined) {
    await sql`UPDATE tasks SET assignee_id = ${assignee_id ?? null} WHERE id = ${id}`;
    const taskRows = await sql`SELECT title FROM tasks WHERE id = ${id}`;
    await sql`
      INSERT INTO activity (task_id, person_id, action, detail)
      VALUES (${id}, ${actorId ?? null}, 'assigned', ${taskRows[0]?.title ?? null})
    `;
  }

  const rows = await sql`SELECT * FROM tasks WHERE id = ${id}`;
  return NextResponse.json(rows[0]);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sql = getDb();
  const { id } = await params;

  await sql`DELETE FROM tasks WHERE id = ${id}`;

  return NextResponse.json({ success: true });
}
