import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sql = getDb();
  const { id } = await params;
  const { name, color } = await req.json();

  let rows;
  if (name !== undefined && color !== undefined) {
    rows = await sql`UPDATE people SET name = ${name}, color = ${color} WHERE id = ${id} RETURNING *`;
  } else if (name !== undefined) {
    rows = await sql`UPDATE people SET name = ${name} WHERE id = ${id} RETURNING *`;
  } else if (color !== undefined) {
    rows = await sql`UPDATE people SET color = ${color} WHERE id = ${id} RETURNING *`;
  } else {
    rows = await sql`SELECT * FROM people WHERE id = ${id}`;
  }

  return NextResponse.json(rows[0]);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sql = getDb();
  const { id } = await params;

  // FKs on tasks.assignee_id / completed_by are ON DELETE SET NULL, so
  // removing a person just unlinks them from tasks and activity.
  await sql`DELETE FROM people WHERE id = ${id}`;

  return NextResponse.json({ success: true });
}
