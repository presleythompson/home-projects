import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Recent "who did what" feed. Optional ?limit= (default 30).
export async function GET(req: NextRequest) {
  const sql = getDb();
  const limitParam = Number(req.nextUrl.searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 30;

  const rows = await sql`
    SELECT * FROM activity
    ORDER BY created_at DESC, id DESC
    LIMIT ${limit}
  `;
  return NextResponse.json(rows);
}
