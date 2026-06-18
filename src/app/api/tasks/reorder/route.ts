import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Reorder a sublist of tasks (one project's list, or one person's list).
// Body: { ids: number[] } — the reordered task ids in their new order.
//
// We permute the sort_order values the dragged tasks ALREADY occupy rather than
// renumbering 0..n: read their current sort_order, sort those values ascending
// ("slots"), then assign slots[k] to ids[k]. This reorders the dragged set while
// leaving every other task's relative position untouched — important for the
// by-person view, where a list spans multiple projects.
export async function POST(req: NextRequest) {
  const sql = getDb();
  const { ids } = await req.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });
  }

  try {
    const rows = await sql`SELECT id, sort_order FROM tasks WHERE id = ANY(${ids})`;
    const slots = rows.map((r) => Number(r.sort_order)).sort((a, b) => a - b);

    for (let k = 0; k < ids.length; k++) {
      await sql`UPDATE tasks SET sort_order = ${slots[k] ?? k} WHERE id = ${ids[k]}`;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to reorder tasks", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reorder tasks" },
      { status: 500 }
    );
  }
}
