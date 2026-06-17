import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();
  const rows = await sql`SELECT * FROM projects ORDER BY sort_order, id`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const sql = getDb();
  const { name, description, is_ongoing } = await req.json();

  const maxOrder = await sql`SELECT COALESCE(MAX(sort_order), -1) as max_order FROM projects`;
  const sort_order = (maxOrder[0]?.max_order ?? -1) + 1;

  const rows = await sql`
    INSERT INTO projects (name, description, sort_order, is_ongoing)
    VALUES (${name}, ${description ?? null}, ${sort_order}, ${is_ongoing ?? false})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
