import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// POST = check off a task (mark done, stamp completed_at / completed_by, log it).
// DELETE = reopen a task that was checked off.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sql = getDb();
  const { id } = await params;
  const { actorId } = await req.json().catch(() => ({}));

  const taskRows = await sql`SELECT title FROM tasks WHERE id = ${id}`;
  const task = taskRows[0];
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await sql`
    INSERT INTO activity (task_id, person_id, action, detail)
    VALUES (${id}, ${actorId ?? null}, 'completed', ${task.title})
  `;

  const updated = await sql`
    UPDATE tasks
    SET is_done = true, completed_at = now(), completed_by = ${actorId ?? null}
    WHERE id = ${id}
    RETURNING *
  `;

  return NextResponse.json(updated[0]);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sql = getDb();
  const { id } = await params;

  const rows = await sql`
    UPDATE tasks
    SET is_done = false, completed_at = NULL, completed_by = NULL
    WHERE id = ${id}
    RETURNING *
  `;

  // Reversing a completion: the task is no longer done, so drop its
  // "completed" entries from the Recently done feed.
  await sql`DELETE FROM activity WHERE task_id = ${id} AND action = 'completed'`;

  return NextResponse.json(rows[0]);
}
