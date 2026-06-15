import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const PALETTE = ["#d07c28", "#2da368", "#3b7dd8", "#9b59b6", "#e0526a", "#16a3a3"];

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
  const chosenColor = color ?? PALETTE[sort_order % PALETTE.length];

  const rows = await sql`
    INSERT INTO people (name, color, sort_order)
    VALUES (${name}, ${chosenColor}, ${sort_order})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
