import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sql = getDb();
  const { id } = await params;
  const { name, color, avatar } = await req.json();

  if (name !== undefined) {
    await sql`UPDATE people SET name = ${name} WHERE id = ${id}`;
  }
  if (color !== undefined) {
    await sql`UPDATE people SET color = ${color} WHERE id = ${id}`;
  }
  if (avatar !== undefined) {
    await sql`UPDATE people SET avatar = ${avatar ?? null} WHERE id = ${id}`;
  }

  const rows = await sql`SELECT * FROM people WHERE id = ${id}`;
  return NextResponse.json(rows[0]);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sql = getDb();
  const { id } = await params;

  try {
    // Unlink references first, then delete. We don't rely on the FK being
    // declared ON DELETE SET NULL — an older live DB may have created these
    // constraints without it, which would make the delete fail with a FK error.
    await sql`UPDATE tasks SET assignee_id = NULL WHERE assignee_id = ${id}`;
    await sql`UPDATE tasks SET assignee_ids = array_remove(assignee_ids, ${Number(id)}) WHERE ${Number(id)} = ANY(assignee_ids)`;
    await sql`UPDATE tasks SET completed_by = NULL WHERE completed_by = ${id}`;
    await sql`UPDATE activity SET person_id = NULL WHERE person_id = ${id}`;
    await sql`DELETE FROM people WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete person", id, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete person" },
      { status: 500 }
    );
  }
}
