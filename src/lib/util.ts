import type { Person, Project, Task, Activity } from "./types";

// Postgres returns BIGINT columns as strings; normalize ids to numbers (or null)
// at the data boundary so our `id: number` types are honest and === comparisons
// in the UI are safe.
function num(v: unknown): number {
  return Number(v);
}
function numOrNull(v: unknown): number | null {
  return v === null || v === undefined ? null : Number(v);
}

// Postgres DATE can arrive as a JS Date (local pg driver) or a string (Neon).
// Normalize anything date-ish to a plain "YYYY-MM-DD" string, or null.
export function ymd(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export function normalizePerson(p: Person): Person {
  return { ...p, id: num(p.id) };
}

export function normalizeProject(p: Project): Project {
  return { ...p, id: num(p.id) };
}

// Coerce ids to numbers and due_date to a clean string.
export function normalizeTask(task: Task): Task {
  return {
    ...task,
    id: num(task.id),
    project_id: numOrNull(task.project_id),
    assignee_id: numOrNull(task.assignee_id),
    completed_by: numOrNull(task.completed_by),
    due_date: ymd(task.due_date),
  };
}

export function normalizeActivity(a: Activity): Activity {
  return {
    ...a,
    id: num(a.id),
    task_id: numOrNull(a.task_id),
    person_id: numOrNull(a.person_id),
  };
}

// Today's date as "YYYY-MM-DD" in local time.
export function todayYmd(): string {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
}

// Friendly due-date label + a flag for overdue/today styling.
// Within a week → weekday name; today/tomorrow/yesterday special-cased; further
// out → "Jun 24" (no year); overdue → "4d overdue".
export function dueLabel(due: string | null): { text: string; tone: "overdue" | "today" | "soon" | "none" } {
  if (!due) return { text: "", tone: "none" };
  const today = todayYmd();
  const d = new Date(due + "T00:00:00");
  const diffDays = Math.round(
    (d.getTime() - new Date(today + "T00:00:00").getTime()) / 86400000
  );

  let text: string;
  if (diffDays === 0) text = "Today";
  else if (diffDays === 1) text = "Tomorrow";
  else if (diffDays === -1) text = "Yesterday";
  else if (diffDays < 0) text = `${Math.abs(diffDays)}d overdue`;
  else if (diffDays <= 6) text = d.toLocaleDateString(undefined, { weekday: "long" });
  else text = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  const tone = diffDays < 0 ? "overdue" : diffDays === 0 ? "today" : diffDays <= 6 ? "soon" : "none";
  return { text, tone };
}

// Relative "time ago" for the activity feed.
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
