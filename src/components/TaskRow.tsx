"use client";

import type { Person, Task } from "@/lib/types";
import { dueLabel } from "@/lib/util";
import EditableText from "./EditableText";
import AssigneePicker from "./AssigneePicker";
import DatePicker from "./DatePicker";
import { CalendarIcon, PersonIcon } from "./icons";

const TONE_BADGE: Record<string, string> = {
  overdue: "bg-danger-50 text-danger-600",
  today: "bg-accent-100 text-accent-700",
  soon: "bg-line/70 text-stone-600",
  none: "bg-line/70 text-stone-500",
};

export default function TaskRow({
  task,
  people,
  currentPersonId,
  onToggle,
  onRename,
  onAssign,
  onSetDue,
  onDelete,
}: {
  task: Task;
  people: Person[];
  currentPersonId: number | null;
  onToggle: (task: Task) => void;
  onRename: (id: number, title: string) => void;
  onAssign: (id: number, personId: number | null) => void;
  onSetDue: (id: number, due: string | null) => void;
  onDelete: (task: Task) => void;
}) {
  const due = dueLabel(task.due_date);
  const assignee = people.find((p) => p.id === task.assignee_id) ?? null;

  return (
    <div className="group flex items-center gap-2.5 py-2.5">
      <input type="checkbox" checked={task.is_done} onChange={() => onToggle(task)} />

      {/* Title — click to edit in place */}
      <span className={`flex-1 min-w-0 text-[16px] ${task.is_done ? "line-through text-stone-400" : "text-ink"}`}>
        <EditableText value={task.title} onSave={(v) => onRename(task.id, v)} />
      </span>

      {/* Date — click to pick */}
      <DatePicker
        value={task.due_date}
        onChange={(d) => onSetDue(task.id, d)}
        trigger={
          task.due_date ? (
            <span className={`text-[12px] font-medium rounded-full px-2 py-0.5 ${TONE_BADGE[due.tone]}`} title="Change due date">
              {due.text}
            </span>
          ) : (
            <span className="text-stone-400 hover:text-accent-500 transition-colors flex items-center" title="Set a due date">
              <CalendarIcon />
            </span>
          )
        }
      />

      {/* Person — click to assign */}
      <AssigneePicker
        people={people}
        assigneeId={task.assignee_id}
        currentPersonId={currentPersonId}
        onAssign={(pid) => onAssign(task.id, pid)}
        trigger={
          assignee ? (
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold ring-1 ring-black/5"
              style={{ background: assignee.color }}
              title={`Assigned to ${assignee.name}`}
            >
              {assignee.name.charAt(0).toUpperCase()}
            </span>
          ) : (
            <span
              className="w-6 h-6 text-stone-400 flex items-center justify-center hover:text-accent-400 transition-colors"
              title="Assign someone"
            >
              <PersonIcon />
            </span>
          )
        }
      />

      {/* Delete — subtle, always tappable (no hover dependency for mobile) */}
      <button
        onClick={() => onDelete(task)}
        className="text-stone-300 hover:text-danger-500 transition-colors text-[18px] leading-none px-0.5 cursor-pointer flex-shrink-0"
        title="Delete task"
      >
        ×
      </button>
    </div>
  );
}
