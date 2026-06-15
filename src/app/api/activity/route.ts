import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Recent completions feed — only 'completed' events from the last 14 days.
// Optional ?limit= (default 50).
export async function GET(req: NextRequest) {
  const sql = getDb();
  const limitParam = Number(req.nextUrl.searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 50;

  const rows = await sql`
    SELECT * FROM activity
    WHERE action = 'completed'
      AND created_at >= now() - interval '14 days'
    ORDER BY created_at DESC, id DESC
    LIMIT ${limit}
  `;
  return NextResponse.json(rows);
}
