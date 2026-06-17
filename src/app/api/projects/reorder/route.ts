import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Persist a new project order. Body: { ids: number[] } in the desired order;
// each project's sort_order is set to its index.
export async function POST(req: NextRequest) {
  const sql = getDb();
  const { ids } = await req.json();

  if (!Array.isArray(ids)) {
    return NextResponse.json({ error: "ids must be an array" }, { status: 400 });
  }

  for (let i = 0; i < ids.length; i++) {
    await sql`UPDATE projects SET sort_order = ${i} WHERE id = ${ids[i]}`;
  }

  return NextResponse.json({ success: true });
}
