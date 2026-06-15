import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// POST  = check off a task.
//   - Recurring task: log 'completed', then reset to not-done and roll the due
//     date forward by its interval (if it has one) so it comes back around.
//   - One-time task: mark done, stamp completed_at / completed_by.
// DELETE = reopen a (one-time) task that was checked off.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sql = getDb();
  const { id } = await params;
  const { actorId } = await req.json().catch(() => ({}));

  const taskRows = await sql`SELECT * FROM tasks WHERE id = ${id}`;
  const task = taskRows[0];
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Always record the completion in the activity feed.
  await sql`
    INSERT INTO activity (task_id, person_id, action, detail)
    VALUES (${id}, ${actorId ?? null}, 'completed', ${task.title})
  `;

  if (task.recurrence === "daily" || task.recurrence === "weekly") {
    const interval = task.recurrence === "daily" ? "1 day" : "7 days";
    // Roll the due date forward (only if one is set); keep the task active.
    await sql`
      UPDATE tasks
      SET is_done = false,
          completed_at = NULL,
          completed_by = NULL,
          due_date = CASE
            WHEN due_date IS NOT NULL THEN due_date + ${interval}::interval
            ELSE due_date
          END
      WHERE id = ${id}
    `;
  } else {
    await sql`
      UPDATE tasks
      SET is_done = true,
          completed_at = now(),
          completed_by = ${actorId ?? null}
      WHERE id = ${id}
    `;
  }

  const updated = await sql`SELECT * FROM tasks WHERE id = ${id}`;
  return NextResponse.json(updated[0]);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sql = getDb();
  const { id } = await params;
  const { actorId } = await req.json().catch(() => ({}));

  const rows = await sql`
    UPDATE tasks
    SET is_done = false, completed_at = NULL, completed_by = NULL
    WHERE id = ${id}
    RETURNING *
  `;

  if (rows[0]) {
    await sql`
      INSERT INTO activity (task_id, person_id, action, detail)
      VALUES (${id}, ${actorId ?? null}, 'reopened', ${rows[0].title})
    `;
  }

  return NextResponse.json(rows[0]);
}
