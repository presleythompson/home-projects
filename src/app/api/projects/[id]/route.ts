import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sql = getDb();
  const { id } = await params;
  const { name, description, is_archived } = await req.json();

  // Apply only the fields that were provided.
  if (name !== undefined) {
    await sql`UPDATE projects SET name = ${name} WHERE id = ${id}`;
  }
  if (description !== undefined) {
    await sql`UPDATE projects SET description = ${description} WHERE id = ${id}`;
  }
  if (is_archived !== undefined) {
    await sql`UPDATE projects SET is_archived = ${is_archived} WHERE id = ${id}`;
  }

  const rows = await sql`SELECT * FROM projects WHERE id = ${id}`;
  return NextResponse.json(rows[0]);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sql = getDb();
  const { id } = await params;

  // tasks.project_id is ON DELETE CASCADE, so a project's tasks go with it.
  await sql`DELETE FROM projects WHERE id = ${id}`;

  return NextResponse.json({ success: true });
}
