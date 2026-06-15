import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { PERSON_COLORS } from "@/lib/colors";

export async function GET() {
  const sql = getDb();
  const rows = await sql`SELECT * FROM people ORDER BY sort_order, id`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const sql = getDb();
  const { name, color } = await req.json();

  const maxOrder = await sql`SELECT COALESCE(MAX(sort_order), -1) as max_order FROM people`;
  const sort_order = (maxOrder[0]?.max_order ?? -1) + 1;
  const chosenColor = color ?? PERSON_COLORS[sort_order % PERSON_COLORS.length];

  const rows = await sql`
    INSERT INTO people (name, color, sort_order)
    VALUES (${name}, ${chosenColor}, ${sort_order})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
