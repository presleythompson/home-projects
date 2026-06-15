"use client";

import { useState } from "react";
import type { Person, Task, Recurrence } from "@/lib/types";
import { dueLabel } from "@/lib/util";
import EditableText from "./EditableText";
import AssigneePicker from "./AssigneePicker";

const TONE_CLASS: Record<string, string> = {
  overdue: "bg-danger-50 text-danger-600",
  today: "bg-accent-100 text-accent-700",
  soon: "bg-slate-100 text-slate-600",
  none: "bg-slate-100 text-slate-500",
};

// Cycle order for the recurrence toggle.
function nextRecurrence(r: Recurrence): Recurrence {
  if (r === null) return "daily";
  if (r === "daily") return "weekly";
  return null;
}

export default function TaskRow({
  task,
  people,
  currentPersonId,
  onToggle,
  onRename,
  onAssign,
  onSetDue,
  onSetRecurrence,
  onDelete,
}: {
  task: Task;
  people: Person[];
  currentPersonId: number | null;
  onToggle: (task: Task) => void;
  onRename: (id: number, title: string) => void;
  onAssign: (id: number, personId: number | null) => void;
  onSetDue: (id: number, due: string | null) => void;
  onSetRecurrence: (id: number, r: Recurrence) => void;
  onDelete: (task: Task) => void;
}) {
  const [editingDue, setEditingDue] = useState(false);
  const due = dueLabel(task.due_date);
  const recurring = task.recurrence !== null;

  return (
    <div className="group flex items-center gap-2.5 py-1.5">
      <input
        type="checkbox"
        checked={task.is_done}
        onChange={() => onToggle(task)}
      />

      <span className={`flex-1 text-[15px] ${task.is_done ? "line-through text-slate-400" : "text-slate-700"}`}>
        <EditableText value={task.title} onSave={(v) => onRename(task.id, v)} />
      </span>

      {/* Recurrence — click to cycle none → daily → weekly */}
      <button
        onClick={() => onSetRecurrence(task.id, nextRecurrence(task.recurrence))}
        title={recurring ? `Repeats ${task.recurrence}` : "Set repeat"}
        className={`text-[12px] font-medium rounded-full px-2 py-0.5 transition-colors ${
          recurring
            ? "bg-accent-100 text-accent-700"
            : "text-slate-300 opacity-0 group-hover:opacity-100 hover:text-accent-500"
        }`}
      >
        ↻ {recurring ? (task.recurrence === "daily" ? "Daily" : "Weekly") : ""}
      </button>

      {/* Due date — click to edit */}
      {editingDue ? (
        <input
          type="date"
          autoFocus
          defaultValue={task.due_date ?? ""}
          onBlur={(e) => { onSetDue(task.id, e.target.value || null); setEditingDue(false); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") { onSetDue(task.id, (e.target as HTMLInputElement).value || null); setEditingDue(false); }
            if (e.key === "Escape") setEditingDue(false);
          }}
          className="rounded-lg px-2 py-0.5 text-[13px] border border-accent-400 bg-accent-50 outline-none"
        />
      ) : task.due_date ? (
        <button
          onClick={() => setEditingDue(true)}
          className={`text-[12px] font-medium rounded-full px-2 py-0.5 ${TONE_CLASS[due.tone]}`}
          title="Click to change due date"
        >
          {due.text}
        </button>
      ) : (
        <button
          onClick={() => setEditingDue(true)}
          className="text-[12px] text-slate-300 opacity-0 group-hover:opacity-100 hover:text-accent-500 transition-colors"
          title="Add a due date"
        >
          + date
        </button>
      )}

      <AssigneePicker
        people={people}
        assigneeId={task.assignee_id}
        currentPersonId={currentPersonId}
        onAssign={(pid) => onAssign(task.id, pid)}
      />

      <button
        onClick={() => onDelete(task)}
        className="text-slate-300 opacity-0 group-hover:opacity-100 hover:text-danger-500 transition-all text-[18px] leading-none px-1"
        title="Delete task"
      >
        ×
      </button>
    </div>
  );
}
