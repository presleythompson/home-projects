import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();
  const rows = await sql`SELECT * FROM tasks ORDER BY sort_order, id`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const sql = getDb();
  const { project_id, title, due_date, assignee_ids, notes } = await req.json();

  const maxOrder = await sql`
    SELECT COALESCE(MAX(sort_order), -1) as max_order
    FROM tasks
    WHERE project_id IS NOT DISTINCT FROM ${project_id ?? null}
  `;
  const sort_order = (maxOrder[0]?.max_order ?? -1) + 1;

  const rows = await sql`
    INSERT INTO tasks (project_id, title, notes, due_date, assignee_ids, sort_order)
    VALUES (
      ${project_id ?? null},
      ${title},
      ${notes ?? null},
      ${due_date ?? null},
      ${assignee_ids ?? []},
      ${sort_order}
    )
    RETURNING *
  `;

  return NextResponse.json(rows[0]);
}
